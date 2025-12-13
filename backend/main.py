from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from pathlib import Path
# ... (Existing code)

import random
from openai import OpenAI
import json
import re

from sqlmodel import Session, select
from datetime import datetime
from database import create_db_and_tables, get_session
from models import Project
from fastapi import Depends

# ... (Moved DB routes down)
PROMPTS_DIR = Path(__file__).parent / "prompts"

def load_prompt(filename: str) -> str:
    """Load a prompt file from the prompts directory."""
    try:
        filepath = PROMPTS_DIR / filename
        if filepath.exists():
            return filepath.read_text(encoding='utf-8')
        else:
            print(f"Warning: Prompt file not found: {filename}")
            return ""
    except Exception as e:
        print(f"Error loading prompt {filename}: {e}")
        return ""

# Load all prompt components at startup
AI_RULES = load_prompt("ai-rules.md")
NODE_SCHEMAS = load_prompt("node-schemas.md")
CONNECTOR_RULES = load_prompt("connector-rules.md")
DIAGRAM_EXAMPLES = load_prompt("diagram-examples.md")

print(f"Loaded prompts: ai-rules={len(AI_RULES)} chars, node-schemas={len(NODE_SCHEMAS)} chars, connector-rules={len(CONNECTOR_RULES)} chars, examples={len(DIAGRAM_EXAMPLES)} chars")

app = FastAPI(title="AISE Backend", description="AI-Powered MBSE Tool API")
# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific frontend origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Database on Startup
@app.on_event("startup")
def on_startup():
    create_db_and_tables()

class ProjectCreate(BaseModel):
    name: str
    data_json: str
    id: Optional[int] = None

class ProjectResponse(BaseModel):
    id: int
    name: str
    updated_at: datetime
    data_size: int

@app.post("/projects", response_model=Project)
def save_project(project: ProjectCreate, session: Session = Depends(get_session)):
    if project.id:
        existing = session.get(Project, project.id)
        if existing:
            existing.name = project.name
            existing.data_json = project.data_json
            existing.updated_at = datetime.utcnow()
            session.add(existing)
            session.commit()
            session.refresh(existing)
            return existing
    
    new_project = Project(
        name=project.name, 
        data_json=project.data_json,
        updated_at=datetime.utcnow()
    )
    session.add(new_project)
    session.commit()
    session.refresh(new_project)
    return new_project

@app.get("/projects", response_model=List[ProjectResponse])
def list_projects(session: Session = Depends(get_session)):
    projects = session.exec(select(Project)).all()
    return [
        ProjectResponse(
            id=p.id, 
            name=p.name, 
            updated_at=p.updated_at,
            data_size=len(p.data_json)
        ) 
        for p in projects
    ]

@app.get("/projects/{project_id}", response_model=Project)
def get_project(project_id: int, session: Session = Depends(get_session)):
    project = session.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

@app.delete("/projects/{project_id}")
def delete_project(project_id: int, session: Session = Depends(get_session)):
    project = session.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    session.delete(project)
    session.commit()
    return {"ok": True}

class PromptRequest(BaseModel):
    prompt: str
    api_key: str
    base_url: str = None
    model: str = "gpt-3.5-turbo" # Default backup
    current_nodes: List[Dict[str, Any]] = None # Optional context
    current_edges: List[Dict[str, Any]] = None # Optional context

class Node(BaseModel):
    id: str
    position: Dict[str, float]
    data: Dict[str, Any]  # Changed from str to Any to support arrays for values/operations
    type: str = "default"
    parentId: Optional[str] = None  # Optional parent for hierarchy

class Edge(BaseModel):
    id: str
    source: str
    target: str
    type: str = "default"  # Edge type (can, composition, satisfy, etc.)

class ModelResponse(BaseModel):
    nodes: List[Node]
    edges: List[Edge]
    message: str

@app.get("/")
async def root():
    return {"message": "AISE Backend is running"}

@app.get("/health")
async def health_check():
    return {"status": "ok"}

@app.post("/generate", response_model=ModelResponse)
async def generate_model(request: PromptRequest):
    if not request.api_key:
        raise HTTPException(status_code=400, detail="API Key is required")

    try:
        # Initialize client with optional base_url
        base_url = request.base_url
        
        # Native Google Gemini Detection
        # If key starts with AIza, it's an official Google Key. Use Google's OpenAI-compatible endpoint.
        # Native Google Gemini Detection
        if request.api_key and request.api_key.startswith("AIza"):
            base_url = "https://generativelanguage.googleapis.com/v1beta/openai/"
            print(f"Detected Google Gemini Key. Switched Base URL to: {base_url}")
            
            # Google prefers x-goog-api-key header
            client = OpenAI(
                api_key=request.api_key,
                base_url=base_url,
                default_headers={
                    "HTTP-Referer": "http://localhost:3000",
                    "X-Title": "AISE SysML Tool",
                    "x-goog-api-key": request.api_key
                }
            )
        else:
            # Standard OpenAI/OpenRouter setup
            if base_url:
                base_url = base_url.rstrip("/")
            
            client = OpenAI(
                api_key=request.api_key,
                base_url=base_url if base_url else None,
                default_headers={
                    "HTTP-Referer": "http://localhost:3000",
                    "X-Title": "AISE SysML Tool"
                }
            )



        # Normalize model name for Google (strip 'models/' prefix if present)
        model_name = request.model
        if "gemini" in model_name.lower() and model_name.startswith("models/"):
            model_name = model_name.replace("models/", "")
            print(f"Normalized Google model name to: {model_name}")

        # Build system prompt from loaded markdown files
        # Use a condensed version for token efficiency, with full details in examples
        system_prompt = f"""
# IDENTITY
You are Dr. SysML, a Principal Systems Engineer with 25 years of MBSE experience.
You architect semantically valid SysML v2 models. You are consultative and rigorous.

# MISSION
Translate user intent into valid JSON models. 
Prioritize generation. Make reasonable assumptions for vague requests.
Output ONLY JSON. No markdown, no chatter outside the JSON structure.

# EDITING MODE
When given "CONTEXT: The user is looking at...":
- MODIFYING: Return FULL nodes/edges list (old + new). Preserve existing IDs.
- DISCUSSING: Return empty nodes:[], edges:[] with explanation in message.

# CONSTRAINTS
- Max 15 nodes
- Essential architecture only
- Valid JSON output only

# DIAGRAM TYPES
{AI_RULES if AI_RULES else '''
| Request Keywords | Diagram | Mechanism |
|-----------------|---------|-----------|
| decompose, hierarchy, types | BDD | composition edges |
| design system, internals, parts | IBD | parentId nesting |
| requirements, specs, shall | REQ | satisfy, verify, derive |
| states, transitions, machine | STM | sysmlState, transition |
| activity, process, workflow | ACT | sysmlAction, controlFlow |
| use cases, actors | UC | sysmlActor, sysmlUseCase |
| constraints, equations | PAR | sysmlConstraintBlock, binding |
| packages, organize | PKG | sysmlPackage, packageImport |
'''}

# NODE SCHEMAS (Reference)
{NODE_SCHEMAS if NODE_SCHEMAS else '''
Key types: sysmlBlock, sysmlPart, sysmlPort, sensor, actuator, ecu, gateway,
sysmlRequirement, sysmlAction, sysmlDecision, sysmlState, sysmlPseudoState,
sysmlConstraintBlock, sysmlPackage, textBox, diagramFrame, sysmlActor, sysmlUseCase
'''}

# CONNECTOR RULES (Reference)
{CONNECTOR_RULES if CONNECTOR_RULES else '''
Structure: composition, aggregation, generalization, dependency
Hardware: can, lin, ethernet, flexray (NEVER use association for hardware!)
Requirements: satisfy, verify, derive, refine, trace
Behavior: controlFlow, objectFlow, transition
Parametric: binding
Package: packageImport, packageMerge
'''}

# CRITICAL RULES
1. Hardware → Hardware = Bus type (can/lin/ethernet), NEVER association
2. IBD nesting = parentId, NO composition edges
3. Requirements must have reqId and reqText
4. State machines start with initial pseudostate
5. Activities must have Initial and Final nodes

# OUTPUT FORMAT
{{
  "nodes": [{{"id": "uuid", "type": "nodeType", "position": {{"x": 0, "y": 0}}, "data": {{}}, "parentId": "optional"}}],
  "edges": [{{"id": "uuid", "source": "id", "target": "id", "type": "edgeType", "data": {{}}}}],
  "message": "Brief description of what was generated."
}}

# EXAMPLES FOR REFERENCE
{DIAGRAM_EXAMPLES if DIAGRAM_EXAMPLES else '(See diagram-examples.md for full examples)'}
"""

        print(f"DEBUG: Sending request to model: {model_name}")


        user_content = request.prompt
        if request.current_nodes:
            context_data = {
                "nodes": request.current_nodes,
                "edges": request.current_edges or []
            }
            # Add context to prompt
            user_content = f"{request.prompt}\n\nCONTEXT: The user is looking at the following diagram:\n{json.dumps(context_data, default=str)}\n\n(Follow EDITING & DISCUSSION MODE rules above)"

        response = client.chat.completions.create(
            model=model_name,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_content}
            ],
            response_format={ "type": "json_object" },
            temperature=0.2
        )

        print(f"DEBUG: AI Response Type: {type(response)}")
        
        content = ""
        if hasattr(response, 'choices'):
            content = response.choices[0].message.content
        elif isinstance(response, str):
            print(f"DEBUG: Raw String Response: {response}")
            content = response
        elif isinstance(response, dict):
            print(f"DEBUG: Dict Response: {response}")
            content = response.get('choices', [{}])[0].get('message', {}).get('content', '')
        else:
            print(f"DEBUG: Unknown Response: {response}")
            content = str(response)

        # Sanitize Markdown Code Blocks
        if "```" in content:
            print("DEBUG: Removing Markdown Code Blocks")
            content = re.sub(r'```json\s*', '', content)
            content = re.sub(r'```', '', content)
            content = content.strip()

        print(f"DEBUG: Final Content to Parse: {content}")

        if content.strip().startswith("<!DOCTYPE") or content.strip().startswith("<html"):
            print("ERROR: Received HTML response")
            return ModelResponse(
                nodes=[],
                edges=[],
                message="Error: The AI Provider returned a Webpage (HTML) instead of data. Please check your 'Base URL' in Settings. It should usually end in '/v1'."
            )

        try:
            data = json.loads(content)
        except json.JSONDecodeError as je:
             print(f"ERROR: Failed to parse JSON: {je}")
             return ModelResponse(
                nodes=[],
                edges=[],
                message=f"I couldn't generate a diagram. AI said: {content[:200]}..."
             )
        
        # Validate and Post-Process Edges
        nodes_list = data.get("nodes", [])
        edges_list = data.get("edges", [])
        
        # Helper map for node types
        node_types = {n.get("id"): n.get("type", "sysmlBlock") for n in nodes_list}
        hw_types = ["sensor", "actuator", "ecu", "gateway"]

        for edge in edges_list:
            src_type = node_types.get(edge.get("source"))
            tgt_type = node_types.get(edge.get("target"))
            edge_type = edge.get("type", "association")

            # FIX 1: Hardware <-> Hardware should NOT be association. Default to CAN.
            if edge_type == "association" or edge_type == "default":
                if src_type in hw_types and tgt_type in hw_types:
                    edge["type"] = "can"
                    print(f"AUTO-FIX: Converted {src_type}->{tgt_type} edge to 'can'")

        return ModelResponse(
            nodes=nodes_list,
            edges=edges_list,
            message=data.get("message", "Generated system model successfully.")
        )

    except Exception as e:
        print(f"Error generating model: {e}")
        return ModelResponse(
            nodes=[], 
            edges=[], 
            message=f"Error generating model: {str(e)}"
        )

class DFMEARequest(BaseModel):
    component_name: str
    component_type: str
    context: Optional[str] = None
    api_key: str
    base_url: Optional[str] = None
    model: str = "gpt-3.5-turbo"

@app.post("/generate-dfmea")
async def generate_dfmea(request: DFMEARequest):
    if not request.api_key:
         raise HTTPException(status_code=400, detail="API Key is required")
    
    try:
        # Client Setup (Copy-Paste mostly from generate_model)
        base_url = request.base_url
        if request.api_key and request.api_key.startswith("AIza"):
            base_url = "https://generativelanguage.googleapis.com/v1beta/openai/"
            client = OpenAI(
                api_key=request.api_key,
                base_url=base_url,
                default_headers={"HTTP-Referer": "http://localhost:3000", "X-Title": "AISE SysML Tool", "x-goog-api-key": request.api_key}
            )
        else:
             if base_url: base_url = base_url.rstrip("/")
             client = OpenAI(
                api_key=request.api_key,
                base_url=base_url if base_url else None,
                default_headers={"HTTP-Referer": "http://localhost:3000", "X-Title": "AISE SysML Tool"}
            )
        
        model_name = request.model
        if "gemini" in model_name.lower() and model_name.startswith("models/"):
            model_name = model_name.replace("models/", "")

        prompt = f"""
        Analyze the following component for Design FMEA (Failure Mode and Effects Analysis):

        Component Name: {request.component_name}
        Component Type: {request.component_type}
        {f"System Context: {request.context}" if request.context else ""}

        Generate 2-3 potential failure modes for this component. For each failure mode, provide:
        1. Failure Mode (what could fail)
        2. Potential Effects (impact on system)
        3. Potential Causes (root causes)
        4. Current Controls (detection/prevention methods)
        5. Recommended Actions (mitigation steps)
        6. Suggested Severity (1-10, where 10 is most severe)
        7. Suggested Occurrence (1-10, where 10 is most likely)
        8. Suggested Detection (1-10, where 10 is hardest to detect)

        Respond ONLY with valid JSON in this exact format:
        {{
          "failureModes": [
            {{
              "mode": "failure description",
              "effects": "system impact",
              "causes": "root causes",
              "controls": "current detection methods",
              "actions": "recommended mitigations",
              "suggestedSeverity": 7,
              "suggestedOccurrence": 4,
              "suggestedDetection": 5
            }}
          ]
        }}
        """

        response = client.chat.completions.create(
            model=model_name,
            messages=[
                {"role": "system", "content": "You are Dr. SysML, an expert Safety Engineer. Provide formal FMEA analysis in JSON."},
                {"role": "user", "content": prompt}
            ],
            response_format={ "type": "json_object" },
            temperature=0.2
        )

        content = response.choices[0].message.content
        
        # Sanitize
        if "```" in content:
            content = re.sub(r'```json\s*', '', content)
            content = re.sub(r'```', '', content)
            content = content.strip()
            
        return json.loads(content)

    except Exception as e:
        print(f"Error generating DFMEA: {e}")
        raise HTTPException(status_code=500, detail=str(e))
