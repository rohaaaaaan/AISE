'use client';

import { Node, Edge } from '@xyflow/react';

// ========== Types ==========

export interface Token {
    id: string;
    nodeId: string;
    createdAt: number;
}

export interface SimulationLog {
    timestamp: number;
    level: 'info' | 'warning' | 'error' | 'success';
    message: string;
    nodeId?: string;
}

export interface SimulationVariable {
    name: string;
    value: string | number | boolean;
    type: string;
}

export interface SimulationState {
    status: 'idle' | 'running' | 'paused' | 'paused_decision' | 'completed' | 'error';
    tokens: Token[];
    activeNodeIds: Set<string>;
    completedNodeIds: Set<string>;
    logs: SimulationLog[];
    variables: SimulationVariable[];
    stepCount: number;
    startTime: number | null;
    pendingDecision?: {
        nodeId: string;
        tokenId: string;
        options: {
            edgeId: string;
            label: string;
            targetId: string;
        }[];
    };
}

export interface SimulationCallbacks {
    onStateChange: (state: SimulationState) => void;
    onNodeActivate: (nodeId: string) => void;
    onNodeDeactivate: (nodeId: string) => void;
    onTokenMove: (tokenId: string, fromNodeId: string, toNodeId: string) => void;
    onComplete: () => void;
    onError: (error: string) => void;
}

// ========== Activity Simulation Engine ==========

export class ActivitySimulator {
    private nodes: Node[] = [];
    private edges: Edge[] = [];
    private state: SimulationState;
    private callbacks: SimulationCallbacks;
    private animationSpeed: number = 1; // 1x speed
    private stepDelay: number = 1000; // ms per step
    private timeoutId: NodeJS.Timeout | null = null;
    private tokenIdCounter: number = 0;

    constructor(callbacks: SimulationCallbacks) {
        this.callbacks = callbacks;
        this.state = this.createInitialState();
    }

    private createInitialState(): SimulationState {
        // Persist user-defined variables (not created by Action execution)
        const preservedVariables = this.state?.variables
            ? this.state.variables.filter(v => v.type !== 'Action')
            : [];

        return {
            status: 'idle',
            tokens: [],
            activeNodeIds: new Set(),
            completedNodeIds: new Set(),
            logs: [],
            variables: preservedVariables,
            stepCount: 0,
            startTime: null,
        };
    }

    private log(level: SimulationLog['level'], message: string, nodeId?: string) {
        const logEntry: SimulationLog = {
            timestamp: Date.now(),
            level,
            message,
            nodeId,
        };
        // Use immutable update to ensure React detects the change
        this.state.logs = [...this.state.logs, logEntry];
        this.notifyStateChange();
    }

    private notifyStateChange() {
        this.callbacks.onStateChange({ ...this.state });
    }

    private createToken(nodeId: string): Token {
        const token: Token = {
            id: `token-${++this.tokenIdCounter}`,
            nodeId,
            createdAt: Date.now(),
        };
        this.state.tokens.push(token);
        return token;
    }

    private removeToken(tokenId: string) {
        this.state.tokens = this.state.tokens.filter(t => t.id !== tokenId);
    }

    private getOutgoingEdges(nodeId: string): Edge[] {
        return this.edges.filter(e => e.source === nodeId);
    }

    private getIncomingEdges(nodeId: string): Edge[] {
        return this.edges.filter(e => e.target === nodeId);
    }

    private getNodeById(nodeId: string): Node | undefined {
        return this.nodes.find(n => n.id === nodeId);
    }

    private findInitialNodes(): Node[] {
        return this.nodes.filter(n => n.type === 'sysmlInitial');
    }

    private findFinalNodes(): Node[] {
        return this.nodes.filter(n => n.type === 'sysmlFinal');
    }

    // ========== Simulation Control ==========

    initialize(nodes: Node[], edges: Edge[]) {
        this.nodes = nodes;
        this.edges = edges;
        this.state = this.createInitialState();
        this.tokenIdCounter = 0;
        this.log('info', 'Simulation initialized');
        this.notifyStateChange();
    }

    setSpeed(speed: number) {
        this.animationSpeed = speed;
        this.stepDelay = 1000 / speed;
    }

    start() {
        if (this.state.status === 'running') return;

        const initialNodes = this.findInitialNodes();
        if (initialNodes.length === 0) {
            this.log('error', 'No Initial Node found! Add an Initial Node to start the activity.');
            this.state.status = 'error';
            this.callbacks.onError('No Initial Node found');
            this.notifyStateChange();
            return;
        }

        this.state.status = 'running';
        this.state.startTime = Date.now();
        this.log('success', '▶ Simulation started');

        // Create tokens at each initial node
        initialNodes.forEach(node => {
            const token = this.createToken(node.id);
            this.state.activeNodeIds.add(node.id);
            this.callbacks.onNodeActivate(node.id);
            this.log('info', `Token created at Initial Node`, node.id);
        });

        this.notifyStateChange();
        this.scheduleNextStep();
    }

    pause() {
        if (this.state.status !== 'running') return;
        this.state.status = 'paused';
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
        }
        this.log('info', '⏸ Simulation paused');
        this.notifyStateChange();
    }

    resume() {
        if (this.state.status !== 'paused') return;
        this.state.status = 'running';
        this.log('info', '▶ Simulation resumed');
        this.notifyStateChange();
        this.scheduleNextStep();
    }

    step() {
        if (this.state.status === 'completed' || this.state.status === 'error') return;

        if (this.state.status === 'idle') {
            // Initialize first
            const initialNodes = this.findInitialNodes();
            if (initialNodes.length === 0) {
                this.log('error', 'No Initial Node found!');
                this.state.status = 'error';
                this.notifyStateChange();
                return;
            }
            this.state.status = 'paused';
            this.state.startTime = Date.now();

            initialNodes.forEach(node => {
                const token = this.createToken(node.id);
                this.state.activeNodeIds.add(node.id);
                this.callbacks.onNodeActivate(node.id);
                this.log('info', `Token created at Initial Node`, node.id);
            });

            this.notifyStateChange();
            return;
        }

        if (this.state.status === 'running') {
            this.pause();
        }

        this.executeStep();
    }

    stop() {
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
        }

        // Deactivate all nodes
        this.state.activeNodeIds.forEach(nodeId => {
            this.callbacks.onNodeDeactivate(nodeId);
        });

        this.state = this.createInitialState();
        this.log('info', '⏹ Simulation stopped');
        this.notifyStateChange();
    }

    reset() {
        this.stop();
        this.log('info', '🔄 Simulation reset');
        this.state.logs = [];
        this.notifyStateChange();
    }

    selectDecisionPath(edgeId: string) {
        if (this.state.status !== 'paused_decision' || !this.state.pendingDecision) {
            console.error('No pending decision to select path for');
            return;
        }

        const { nodeId, tokenId } = this.state.pendingDecision;
        const selectedOption = this.state.pendingDecision.options.find(o => o.edgeId === edgeId);

        if (!selectedOption) {
            console.error('Invalid edge ID selected');
            return;
        }

        const token = this.state.tokens.find(t => t.id === tokenId);
        if (!token) return;

        // Log selection
        this.log('info', `◇ Decision manually selected: "${selectedOption.label}"`, nodeId);

        // Deactivate current decision node
        this.state.activeNodeIds.delete(nodeId);
        this.callbacks.onNodeDeactivate(nodeId);

        // Clear pending State
        this.state.pendingDecision = undefined;
        this.state.status = 'running';

        // Move token
        this.moveTokenToNode(token, nodeId, selectedOption.targetId);

        this.notifyStateChange();
        this.scheduleNextStep();
    }

    // ========== Execution Logic ==========

    private scheduleNextStep() {
        if (this.state.status !== 'running') return;

        this.timeoutId = setTimeout(() => {
            this.executeStep();
            if (this.state.status === 'running') {
                this.scheduleNextStep();
            }
        }, this.stepDelay);
    }

    private executeStep() {
        if (this.state.tokens.length === 0) {
            this.state.status = 'completed';
            this.log('success', '✓ Simulation completed - all tokens consumed');
            this.callbacks.onComplete();
            this.notifyStateChange();
            return;
        }

        this.state.stepCount++;

        // Process each token
        const tokensToProcess = [...this.state.tokens];

        for (const token of tokensToProcess) {
            this.processToken(token);
        }

        this.notifyStateChange();
    }

    private processToken(token: Token) {
        const currentNode = this.getNodeById(token.nodeId);
        if (!currentNode) return;

        const nodeType = currentNode.type;
        const nodeLabel = (currentNode.data?.label as string) || currentNode.id;

        switch (nodeType) {
            case 'sysmlInitial':
                this.processInitialNode(token, currentNode);
                break;
            case 'sysmlAction':
                this.processActionNode(token, currentNode);
                break;
            case 'sysmlDecision':
                this.processDecisionNode(token, currentNode);
                break;
            case 'sysmlForkJoin':
                this.processForkJoinNode(token, currentNode);
                break;
            case 'sysmlFinal':
                this.processFinalNode(token, currentNode);
                break;
            case 'sysmlSignal':
                this.processSignalNode(token, currentNode);
                break;
            default:
                // Generic: just move to next node
                this.moveTokenToNextNodes(token, currentNode);
        }
    }

    private processInitialNode(token: Token, node: Node) {
        this.log('info', `Initial Node activated`, node.id);
        this.moveTokenToNextNodes(token, node);
    }

    private processActionNode(token: Token, node: Node) {
        const label = (node.data?.label as string) || 'Action';
        this.log('info', `⚙ Executing action: "${label}"`, node.id);

        // Add to variables to show execution
        const existingVar = this.state.variables.find(v => v.name === label);
        if (existingVar) {
            existingVar.value = 'executing';
        } else {
            this.state.variables.push({ name: label, value: 'executing', type: 'Action' });
        }

        // Move token forward
        this.moveTokenToNextNodes(token, node);

        // Mark as completed
        this.state.completedNodeIds.add(node.id);
        const varToUpdate = this.state.variables.find(v => v.name === label);
        if (varToUpdate) varToUpdate.value = 'completed';
    }

    private interactiveMode: boolean = false;

    setInteractiveMode(enabled: boolean) {
        this.interactiveMode = enabled;
        this.log('info', `Mode changed: ${enabled ? 'Interactive (Manual Fallback)' : 'Automatic (Random Fallback)'}`);
    }

    private processDecisionNode(token: Token, node: Node) {
        const guard = (node.data?.guard as string) || '';
        this.log('info', `◇ Decision: evaluating${guard ? ` [${guard}]` : ''}`, node.id);

        const outgoingEdges = this.getOutgoingEdges(node.id);

        if (outgoingEdges.length === 0) {
            this.log('warning', 'Decision node has no outgoing edges!', node.id);
            this.removeToken(token.id);
            this.state.activeNodeIds.delete(node.id);
            this.callbacks.onNodeDeactivate(node.id);
            return;
        }

        // Try to evaluate guard conditions automatically first
        let matchedEdge = null;

        // Create a context object from current variables
        const context: Record<string, any> = {};
        this.state.variables.forEach(v => {
            if (v.value !== undefined && v.value !== null) {
                // If it's a number string, parse it
                const num = Number(v.value);
                // Ensure variable name is clean for function arguments
                const cleanName = v.name.trim();
                // Skip invalid identifiers to prevent SyntaxError
                if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(cleanName)) {
                    context[cleanName] = isNaN(num) ? v.value : num;
                }
            }
        });

        for (const edge of outgoingEdges) {
            const guard = (edge.data?.guard as string) || '';
            // Remove brackets [] if present e.g. [x > 5] -> x > 5
            const cleanGuard = guard.replace(/^\[|\]$/g, '').trim();

            if (!cleanGuard || cleanGuard.toLowerCase() === 'else') continue;

            if (this.evaluateGuard(cleanGuard, context)) {
                matchedEdge = edge;
                this.log('success', `◇ Logic evaluated true: "${guard}"`, node.id);
                break;
            }
        }

        // Handle "else" if no other match found
        if (!matchedEdge) {
            const elseEdge = outgoingEdges.find(e => {
                const g = ((e.data?.guard as string) || '').toLowerCase();
                return g === 'else' || g === '[else]';
            });
            if (elseEdge) {
                matchedEdge = elseEdge;
                this.log('info', `◇ Logic fallback: Taking [else] path`, node.id);
            }
        }

        if (matchedEdge) {
            // AUTOMATED PATH TAKEN
            this.state.activeNodeIds.delete(node.id);
            this.callbacks.onNodeDeactivate(node.id);
            this.moveTokenToNode(token, node.id, matchedEdge.target);
            return;
        }

        // NO MATCH FOUND
        // If Interactive Mode is OFF, revert to RANDOM selection (Automatic Default)
        if (!this.interactiveMode) {
            const randomIndex = Math.floor(Math.random() * outgoingEdges.length);
            const randomEdge = outgoingEdges[randomIndex];
            this.log('info', `◇ Automatic Choice (Random): "${(randomEdge.data?.guard as string) || 'Path ' + (randomIndex + 1)}"`, node.id);

            this.state.activeNodeIds.delete(node.id);
            this.callbacks.onNodeDeactivate(node.id);
            this.moveTokenToNode(token, node.id, randomEdge.target);
            return;
        }

        // If Interactive Mode is ON, PAUSE and ask User
        const options = outgoingEdges.map((edge, idx) => ({
            edgeId: edge.id,
            label: (edge.data?.guard as string) || `Path ${idx + 1}`,
            targetId: edge.target
        }));

        this.state.status = 'paused_decision';
        this.state.pendingDecision = {
            nodeId: node.id,
            tokenId: token.id,
            options
        };

        this.log('warning', `◇ Manual Decision Required`, node.id);

        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
        }

        this.notifyStateChange();
    }

    private processForkJoinNode(token: Token, node: Node) {
        const incomingEdges = this.getIncomingEdges(node.id);
        const outgoingEdges = this.getOutgoingEdges(node.id);

        // Check if this is a Fork (one incoming, multiple outgoing)
        const isFork = incomingEdges.length <= 1 && outgoingEdges.length > 1;
        // Check if this is a Join (multiple incoming, one outgoing)
        const isJoin = incomingEdges.length > 1 && outgoingEdges.length <= 1;

        if (isFork) {
            this.log('info', `⑂ Fork: splitting into ${outgoingEdges.length} parallel flows`, node.id);

            // Remove current token
            this.removeToken(token.id);
            this.state.activeNodeIds.delete(node.id);
            this.callbacks.onNodeDeactivate(node.id);

            // Create new tokens for each outgoing edge
            outgoingEdges.forEach((edge, idx) => {
                const newToken = this.createToken(edge.target);
                this.state.activeNodeIds.add(edge.target);
                this.callbacks.onNodeActivate(edge.target);
                this.log('info', `  → Fork branch ${idx + 1} token to ${edge.target}`, edge.target);
            });
        } else if (isJoin) {
            // Check if all incoming tokens are present
            const tokensAtJoin = this.state.tokens.filter(t => t.nodeId === node.id);

            if (tokensAtJoin.length < incomingEdges.length) {
                this.log('info', `⑂ Join: waiting for more tokens (${tokensAtJoin.length}/${incomingEdges.length})`, node.id);
                return; // Wait for more tokens
            }

            this.log('info', `⑂ Join: all ${incomingEdges.length} tokens merged`, node.id);

            // Remove all tokens at join
            tokensAtJoin.forEach(t => this.removeToken(t.id));

            // Create single token for outgoing edge
            if (outgoingEdges.length > 0) {
                const newToken = this.createToken(outgoingEdges[0].target);
                this.state.activeNodeIds.add(outgoingEdges[0].target);
                this.callbacks.onNodeActivate(outgoingEdges[0].target);
            }

            this.state.activeNodeIds.delete(node.id);
            this.callbacks.onNodeDeactivate(node.id);
        } else {
            // Just pass through
            this.moveTokenToNextNodes(token, node);
        }
    }

    private processFinalNode(token: Token, node: Node) {
        const finalType = (node.data?.finalType as string) || 'activity';

        if (finalType === 'flow') {
            this.log('info', `⊗ Flow Final: token consumed`, node.id);
        } else {
            this.log('success', `◉ Activity Final: execution complete`, node.id);
        }

        // Remove token
        this.removeToken(token.id);
        this.state.activeNodeIds.delete(node.id);
        this.callbacks.onNodeDeactivate(node.id);
        this.state.completedNodeIds.add(node.id);
    }

    private processSignalNode(token: Token, node: Node) {
        const signalType = (node.data?.signalType as string) || 'send';
        const signalName = (node.data?.signalName as string) || (node.data?.label as string) || 'Signal';

        if (signalType === 'send') {
            this.log('info', `▷ Send Signal: "${signalName}"`, node.id);
        } else {
            this.log('info', `◁ Accept Event: "${signalName}" received`, node.id);
        }

        this.moveTokenToNextNodes(token, node);
    }

    private moveTokenToNextNodes(token: Token, currentNode: Node) {
        const outgoingEdges = this.getOutgoingEdges(currentNode.id);

        if (outgoingEdges.length === 0) {
            this.log('warning', `No outgoing edges from node`, currentNode.id);
            this.removeToken(token.id);
            this.state.activeNodeIds.delete(currentNode.id);
            this.callbacks.onNodeDeactivate(currentNode.id);
            return;
        }

        // Deactivate current node
        this.state.activeNodeIds.delete(currentNode.id);
        this.callbacks.onNodeDeactivate(currentNode.id);
        this.state.completedNodeIds.add(currentNode.id);

        // Move to first outgoing edge target
        const nextEdge = outgoingEdges[0];
        this.moveTokenToNode(token, currentNode.id, nextEdge.target);
    }

    private moveTokenToNode(token: Token, fromNodeId: string, toNodeId: string) {
        token.nodeId = toNodeId;
        this.state.activeNodeIds.add(toNodeId);
        this.callbacks.onNodeActivate(toNodeId);
        this.callbacks.onTokenMove(token.id, fromNodeId, toNodeId);

        const toNode = this.getNodeById(toNodeId);
        const toLabel = (toNode?.data?.label as string) || toNodeId;
        this.log('info', `→ Token moved to: "${toLabel}"`, toNodeId);
    }

    // ========== Getters ==========

    getState(): SimulationState {
        return { ...this.state };
    }

    isRunning(): boolean {
        return this.state.status === 'running';
    }

    setVariable(name: string, value: string | number | boolean) {
        const existing = this.state.variables.find(v => v.name === name);
        if (existing) {
            existing.value = value;
        } else {
            this.state.variables.push({ name, value, type: typeof value });
        }
        this.log('info', `Variable set: ${name} = ${value}`);
        this.notifyStateChange();
    }

    isPaused(): boolean {
        return this.state.status === 'paused';
    }

    private evaluateGuard(expression: string, context: Record<string, any>): boolean {
        // Debugging: Log context and expression
        // console.log('Evaluating:', expression, 'Context:', context);

        try {
            const keys = Object.keys(context);
            const values = Object.values(context);

            // Normalize expression
            const cleanExpr = expression.trim();

            // Log context for debugging
            console.log(`[Eval] Expr: "${cleanExpr}"`);
            console.log(`[Eval] Context:`, context);

            // Check for simple boolean literals
            if (cleanExpr.toLowerCase() === 'yes' || cleanExpr.toLowerCase() === 'true') return true;
            if (cleanExpr.toLowerCase() === 'no' || cleanExpr.toLowerCase() === 'false') return false;

            // Dangerous but necessary for MVP dynamic evaluation: new Function
            const func = new Function(...keys, `return ${cleanExpr};`);
            const result = func(...values);

            console.log(`[Eval] Result: ${result}`);

            // Check true/false explicit return
            return !!result;
        } catch (e) {
            console.warn(`Evaluation failed for "${expression}":`, e);
            return false;
        }
    }
}
