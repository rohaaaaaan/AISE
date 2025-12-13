# AISE - Complete Diagram Examples

Reference examples for each SysML diagram type with full JSON output.

---

## 1. Block Definition Diagram (BDD)

### Request: "Decompose a Vehicle System"

```json
{
  "nodes": [
    {
      "id": "frame_bdd_vehicle",
      "type": "diagramFrame",
      "position": { "x": 0, "y": 0 },
      "data": {
        "diagramType": "bdd",
        "diagramName": "Vehicle System BDD",
        "modelName": "VehicleProject",
        "width": 800,
        "height": 500
      }
    },
    {
      "id": "vehicle_system",
      "type": "sysmlBlock",
      "position": { "x": 300, "y": 50 },
      "parentId": "frame_bdd_vehicle",
      "data": {
        "label": "Vehicle System",
        "stereotype": "<<system>>",
        "values": [{ "name": "maxSpeed", "type": "Real", "default": "200 km/h" }]
      }
    },
    {
      "id": "chassis_block",
      "type": "sysmlBlock",
      "position": { "x": 80, "y": 200 },
      "parentId": "frame_bdd_vehicle",
      "data": {
        "label": "Chassis",
        "parts": ["frontAxle", "rearAxle"]
      }
    },
    {
      "id": "powertrain_block",
      "type": "sysmlBlock",
      "position": { "x": 300, "y": 200 },
      "parentId": "frame_bdd_vehicle",
      "data": {
        "label": "Powertrain",
        "parts": ["engine", "transmission"]
      }
    },
    {
      "id": "electronics_block",
      "type": "sysmlBlock",
      "position": { "x": 520, "y": 200 },
      "parentId": "frame_bdd_vehicle",
      "data": {
        "label": "Electronics",
        "parts": ["bms", "infotainment"]
      }
    }
  ],
  "edges": [
    { "id": "e1", "source": "vehicle_system", "target": "chassis_block", "type": "composition" },
    { "id": "e2", "source": "vehicle_system", "target": "powertrain_block", "type": "composition" },
    { "id": "e3", "source": "vehicle_system", "target": "electronics_block", "type": "composition" }
  ],
  "message": "Created Vehicle System BDD inside diagram frame with 3 major subsystems: Chassis, Powertrain, and Electronics."
}
```

---

## 2. Internal Block Diagram (IBD)

### Request: "Design a Battery Management System"

```json
{
  "nodes": [
    {
      "id": "bms_container",
      "type": "sysmlBlock",
      "position": { "x": 0, "y": 0 },
      "data": {
        "label": "Battery Management System",
        "width": 800,
        "height": 500
      }
    },
    {
      "id": "temp_sensor_1",
      "type": "sensor",
      "position": { "x": 50, "y": 80 },
      "parentId": "bms_container",
      "data": {
        "label": "Temperature Sensor",
        "values": [{ "name": "range", "value": "-40°C to 85°C" }]
      }
    },
    {
      "id": "voltage_sensor",
      "type": "sensor",
      "position": { "x": 50, "y": 200 },
      "parentId": "bms_container",
      "data": {
        "label": "Voltage Sensor",
        "values": [{ "name": "range", "value": "0-500V" }]
      }
    },
    {
      "id": "bms_ecu",
      "type": "ecu",
      "position": { "x": 300, "y": 140 },
      "parentId": "bms_container",
      "data": {
        "label": "BMS Controller",
        "values": [{ "name": "processor", "value": "ARM Cortex-M4" }]
      }
    },
    {
      "id": "cooling_pump",
      "type": "actuator",
      "position": { "x": 550, "y": 100 },
      "parentId": "bms_container",
      "data": {
        "label": "Cooling Pump",
        "operations": [{ "name": "setSpeed", "params": ["rpm: Integer"] }]
      }
    },
    {
      "id": "contactor",
      "type": "actuator",
      "position": { "x": 550, "y": 220 },
      "parentId": "bms_container",
      "data": {
        "label": "Main Contactor",
        "operations": [{ "name": "open" }, { "name": "close" }]
      }
    }
  ],
  "edges": [
    { "id": "e1", "source": "temp_sensor_1", "target": "bms_ecu", "type": "can" },
    { "id": "e2", "source": "voltage_sensor", "target": "bms_ecu", "type": "can" },
    { "id": "e3", "source": "bms_ecu", "target": "cooling_pump", "type": "can" },
    { "id": "e4", "source": "bms_ecu", "target": "contactor", "type": "can" }
  ],
  "message": "Designed BMS with 2 sensors and 2 actuators connected via CAN bus to central controller."
}
```

---

## 3. Requirements Diagram

### Request: "Create safety requirements for braking system"

```json
{
  "nodes": [
    {
      "id": "req_brake_safety",
      "type": "sysmlRequirement",
      "position": { "x": 300, "y": 50 },
      "data": {
        "label": "Brake Safety",
        "reqId": "REQ-BRAKE-001",
        "reqText": "The braking system shall meet ISO 26262 ASIL-D requirements.",
        "priority": "Critical"
      }
    },
    {
      "id": "req_response_time",
      "type": "sysmlRequirement",
      "position": { "x": 100, "y": 200 },
      "data": {
        "label": "Response Time",
        "reqId": "REQ-BRAKE-002",
        "reqText": "The brake system shall respond within 50ms of pedal input.",
        "priority": "High"
      }
    },
    {
      "id": "req_force",
      "type": "sysmlRequirement",
      "position": { "x": 300, "y": 200 },
      "data": {
        "label": "Braking Force",
        "reqId": "REQ-BRAKE-003",
        "reqText": "The system shall provide minimum 30kN braking force.",
        "priority": "High"
      }
    },
    {
      "id": "req_redundancy",
      "type": "sysmlRequirement",
      "position": { "x": 500, "y": 200 },
      "data": {
        "label": "Redundancy",
        "reqId": "REQ-BRAKE-004",
        "reqText": "The brake system shall have dual-circuit redundancy.",
        "priority": "Critical"
      }
    },
    {
      "id": "brake_system_block",
      "type": "sysmlBlock",
      "position": { "x": 300, "y": 350 },
      "data": { "label": "Brake System" }
    },
    {
      "id": "test_response",
      "type": "sysmlTestCase",
      "position": { "x": 100, "y": 350 },
      "data": {
        "label": "Response Time Test",
        "testId": "TC-BRAKE-001",
        "description": "Measure brake response latency under various conditions"
      }
    }
  ],
  "edges": [
    { "id": "e1", "source": "req_response_time", "target": "req_brake_safety", "type": "derive" },
    { "id": "e2", "source": "req_force", "target": "req_brake_safety", "type": "derive" },
    { "id": "e3", "source": "req_redundancy", "target": "req_brake_safety", "type": "derive" },
    { "id": "e4", "source": "brake_system_block", "target": "req_brake_safety", "type": "satisfy" },
    { "id": "e5", "source": "test_response", "target": "req_response_time", "type": "verify" }
  ],
  "message": "Created brake safety requirements hierarchy with 4 requirements, satisfaction from Brake System, and test verification."
}
```

---

## 4. State Machine Diagram

### Request: "Create a state machine for traffic light"

```json
{
  "nodes": [
    {
      "id": "initial",
      "type": "sysmlPseudoState",
      "position": { "x": 300, "y": 30 },
      "data": { "pseudoType": "initial" }
    },
    {
      "id": "state_red",
      "type": "sysmlState",
      "position": { "x": 100, "y": 150 },
      "data": {
        "label": "Red",
        "entry": "turnOnRedLight()",
        "exit": "turnOffRedLight()"
      }
    },
    {
      "id": "state_green",
      "type": "sysmlState",
      "position": { "x": 300, "y": 150 },
      "data": {
        "label": "Green",
        "entry": "turnOnGreenLight()",
        "do": "countDown(30)",
        "exit": "turnOffGreenLight()"
      }
    },
    {
      "id": "state_yellow",
      "type": "sysmlState",
      "position": { "x": 500, "y": 150 },
      "data": {
        "label": "Yellow",
        "entry": "turnOnYellowLight()",
        "do": "countDown(5)",
        "exit": "turnOffYellowLight()"
      }
    }
  ],
  "edges": [
    { "id": "e0", "source": "initial", "target": "state_red", "type": "transition" },
    { 
      "id": "e1", 
      "source": "state_red", 
      "target": "state_green", 
      "type": "transition",
      "data": { "trigger": "after(30s)", "guard": "", "effect": "" }
    },
    { 
      "id": "e2", 
      "source": "state_green", 
      "target": "state_yellow", 
      "type": "transition",
      "data": { "trigger": "after(30s)", "guard": "", "effect": "" }
    },
    { 
      "id": "e3", 
      "source": "state_yellow", 
      "target": "state_red", 
      "type": "transition",
      "data": { "trigger": "after(5s)", "guard": "", "effect": "" }
    }
  ],
  "message": "Created traffic light state machine with Red, Green, Yellow states and timed transitions."
}
```

---

## 5. Activity Diagram

### Request: "Create order processing workflow"

```json
{
  "nodes": [
    {
      "id": "initial",
      "type": "sysmlInitial",
      "position": { "x": 300, "y": 30 },
      "data": {}
    },
    {
      "id": "receive_order",
      "type": "sysmlAction",
      "position": { "x": 300, "y": 100 },
      "data": {
        "label": "Receive Order",
        "outputPins": [{ "name": "order" }]
      }
    },
    {
      "id": "validate_order",
      "type": "sysmlAction",
      "position": { "x": 300, "y": 200 },
      "data": {
        "label": "Validate Order",
        "inputPins": [{ "name": "order" }],
        "outputPins": [{ "name": "isValid" }]
      }
    },
    {
      "id": "decision_valid",
      "type": "sysmlDecision",
      "position": { "x": 300, "y": 300 },
      "data": { "condition": "isValid?" }
    },
    {
      "id": "process_payment",
      "type": "sysmlAction",
      "position": { "x": 200, "y": 400 },
      "data": { "label": "Process Payment" }
    },
    {
      "id": "reject_order",
      "type": "sysmlAction",
      "position": { "x": 400, "y": 400 },
      "data": { "label": "Reject Order" }
    },
    {
      "id": "ship_order",
      "type": "sysmlAction",
      "position": { "x": 200, "y": 500 },
      "data": { "label": "Ship Order" }
    },
    {
      "id": "final",
      "type": "sysmlFinal",
      "position": { "x": 300, "y": 600 },
      "data": { "flowFinal": false }
    }
  ],
  "edges": [
    { "id": "e1", "source": "initial", "target": "receive_order", "type": "controlFlow" },
    { "id": "e2", "source": "receive_order", "target": "validate_order", "type": "controlFlow" },
    { "id": "e3", "source": "validate_order", "target": "decision_valid", "type": "controlFlow" },
    { "id": "e4", "source": "decision_valid", "target": "process_payment", "type": "controlFlow", "data": { "label": "[valid]" } },
    { "id": "e5", "source": "decision_valid", "target": "reject_order", "type": "controlFlow", "data": { "label": "[invalid]" } },
    { "id": "e6", "source": "process_payment", "target": "ship_order", "type": "controlFlow" },
    { "id": "e7", "source": "ship_order", "target": "final", "type": "controlFlow" },
    { "id": "e8", "source": "reject_order", "target": "final", "type": "controlFlow" }
  ],
  "message": "Created order processing activity with validation decision, payment processing, and shipping paths."
}
```

---

## 6. Use Case Diagram

### Request: "Create use cases for e-commerce"

```json
{
  "nodes": [
    {
      "id": "customer",
      "type": "sysmlActor",
      "position": { "x": 50, "y": 200 },
      "data": { "label": "Customer" }
    },
    {
      "id": "admin",
      "type": "sysmlActor",
      "position": { "x": 550, "y": 200 },
      "data": { "label": "Admin" }
    },
    {
      "id": "uc_browse",
      "type": "sysmlUseCase",
      "position": { "x": 250, "y": 100 },
      "data": { "label": "Browse Products" }
    },
    {
      "id": "uc_search",
      "type": "sysmlUseCase",
      "position": { "x": 250, "y": 200 },
      "data": { "label": "Search Products" }
    },
    {
      "id": "uc_purchase",
      "type": "sysmlUseCase",
      "position": { "x": 250, "y": 300 },
      "data": { "label": "Purchase Product" }
    },
    {
      "id": "uc_manage",
      "type": "sysmlUseCase",
      "position": { "x": 400, "y": 200 },
      "data": { "label": "Manage Inventory" }
    }
  ],
  "edges": [
    { "id": "e1", "source": "customer", "target": "uc_browse", "type": "association" },
    { "id": "e2", "source": "customer", "target": "uc_search", "type": "association" },
    { "id": "e3", "source": "customer", "target": "uc_purchase", "type": "association" },
    { "id": "e4", "source": "admin", "target": "uc_manage", "type": "association" },
    { "id": "e5", "source": "uc_purchase", "target": "uc_search", "type": "include" }
  ],
  "message": "Created e-commerce use case diagram with Customer and Admin actors, 4 use cases with include relationship."
}
```

---

## 7. Package Diagram

### Request: "Organize vehicle system packages"

```json
{
  "nodes": [
    {
      "id": "pkg_vehicle",
      "type": "sysmlPackage",
      "position": { "x": 300, "y": 50 },
      "data": {
        "label": "VehicleSystem",
        "stereotype": "<<model>>",
        "members": ["Chassis", "Powertrain", "Electronics"]
      }
    },
    {
      "id": "pkg_chassis",
      "type": "sysmlPackage",
      "position": { "x": 100, "y": 200 },
      "data": {
        "label": "Chassis",
        "members": ["Frame", "Suspension", "Wheels"]
      }
    },
    {
      "id": "pkg_powertrain",
      "type": "sysmlPackage",
      "position": { "x": 300, "y": 200 },
      "data": {
        "label": "Powertrain",
        "members": ["Engine", "Transmission"]
      }
    },
    {
      "id": "pkg_common",
      "type": "sysmlPackage",
      "position": { "x": 500, "y": 200 },
      "data": {
        "label": "CommonTypes",
        "stereotype": "<<library>>",
        "members": ["Units", "DataTypes"]
      }
    }
  ],
  "edges": [
    { "id": "e1", "source": "pkg_vehicle", "target": "pkg_chassis", "type": "packageImport" },
    { "id": "e2", "source": "pkg_vehicle", "target": "pkg_powertrain", "type": "packageImport" },
    { "id": "e3", "source": "pkg_chassis", "target": "pkg_common", "type": "packageImport" },
    { "id": "e4", "source": "pkg_powertrain", "target": "pkg_common", "type": "packageImport" }
  ],
  "message": "Created vehicle package hierarchy with CommonTypes library imported by subsystem packages."
}
```

---

## 8. Parametric Diagram

### Request: "Create physics constraints for motion"

```json
{
  "nodes": [
    {
      "id": "newton_constraint",
      "type": "sysmlConstraintBlock",
      "position": { "x": 300, "y": 100 },
      "data": {
        "label": "Newton's Second Law",
        "equation": "F = m × a",
        "parameters": [
          { "name": "F", "type": "Force [N]" },
          { "name": "m", "type": "Mass [kg]" },
          { "name": "a", "type": "Acceleration [m/s²]" }
        ]
      }
    },
    {
      "id": "kinetic_constraint",
      "type": "sysmlConstraintBlock",
      "position": { "x": 300, "y": 300 },
      "data": {
        "label": "Kinetic Energy",
        "equation": "KE = 0.5 × m × v²",
        "parameters": [
          { "name": "KE", "type": "Energy [J]" },
          { "name": "m", "type": "Mass [kg]" },
          { "name": "v", "type": "Velocity [m/s]" }
        ]
      }
    },
    {
      "id": "vehicle_props",
      "type": "sysmlBlock",
      "position": { "x": 600, "y": 200 },
      "data": {
        "label": "Vehicle Properties",
        "values": [
          { "name": "mass", "type": "Real", "default": "1500 kg" },
          { "name": "velocity", "type": "Real" },
          { "name": "acceleration", "type": "Real" }
        ]
      }
    }
  ],
  "edges": [
    { "id": "e1", "source": "newton_constraint", "target": "vehicle_props", "type": "binding", "data": { "parameterName": "m" } },
    { "id": "e2", "source": "kinetic_constraint", "target": "vehicle_props", "type": "binding", "data": { "parameterName": "m" } }
  ],
  "message": "Created parametric diagram with Newton's Law and Kinetic Energy constraints bound to Vehicle properties."
}
```
