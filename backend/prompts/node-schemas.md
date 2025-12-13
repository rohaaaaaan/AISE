# AISE - Node Type Schemas

Complete reference for all supported node types with required and optional fields.

---

## Structural Nodes

### sysmlBlock
**Use for:** Systems, subsystems, components, modules

```json
{
  "id": "chassis_block",
  "type": "sysmlBlock",
  "position": { "x": 100, "y": 100 },
  "data": {
    "label": "Chassis",
    "stereotype": "<<block>>",
    "values": [
      { "name": "weight", "type": "Real", "default": "1500 kg" },
      { "name": "material", "type": "String", "default": "Steel" }
    ],
    "operations": [
      { "name": "calculateStress", "params": ["force: Real"], "return": "Real" }
    ],
    "parts": ["frontAxle", "rearAxle", "suspension"]
  }
}
```

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| label | ✅ | string | Block name |
| stereotype | ❌ | string | e.g., `<<block>>`, `<<system>>` |
| values | ❌ | array | Value properties |
| operations | ❌ | array | Behavioral features |
| parts | ❌ | array | Contained part names |

---

### sysmlPart
**Use for:** Typed instances within blocks (IBD)

```json
{
  "id": "left_wheel_part",
  "type": "sysmlPart",
  "position": { "x": 50, "y": 100 },
  "data": {
    "label": "leftWheel : Wheel",
    "multiplicity": "[1]"
  },
  "parentId": "chassis_block"
}
```

---

### sysmlPort
**Use for:** Interface points, flow ports

```json
{
  "id": "can_port_1",
  "type": "sysmlPort",
  "position": { "x": 0, "y": 50 },
  "data": {
    "label": "CAN_H",
    "direction": "inout",
    "portType": "flow",
    "sysmlType": "proxy"
  },
  "parentId": "ecu_main"
}
```

| Field | Values |
|-------|--------|
| direction | `in`, `out`, `inout` |
| portType | `flow`, `standard`, `full` |
| sysmlType | `flow`, `proxy`, `full` |

---

### sysmlPackage
**Use for:** Organizing model elements

```json
{
  "id": "vehicle_pkg",
  "type": "sysmlPackage",
  "position": { "x": 100, "y": 50 },
  "data": {
    "label": "VehicleSystems",
    "stereotype": "<<model>>",
    "members": ["Chassis", "Powertrain", "Electronics"]
  }
}
```

---

## Hardware / E-E Architecture Nodes

### sensor
```json
{
  "id": "temp_sensor_1",
  "type": "sensor",
  "position": { "x": 100, "y": 200 },
  "data": {
    "label": "Temperature Sensor",
    "values": [
      { "name": "range", "value": "-40°C to 125°C" },
      { "name": "accuracy", "value": "±0.5°C" },
      { "name": "protocol", "value": "CAN" }
    ]
  }
}
```

### actuator
```json
{
  "id": "brake_motor",
  "type": "actuator",
  "position": { "x": 400, "y": 200 },
  "data": {
    "label": "Brake Motor",
    "operations": [
      { "name": "apply", "params": ["force: Real"] },
      { "name": "release", "params": [] }
    ]
  }
}
```

### ecu
```json
{
  "id": "bms_ecu",
  "type": "ecu",
  "position": { "x": 250, "y": 100 },
  "data": {
    "label": "Battery Management ECU",
    "values": [
      { "name": "processor", "value": "ARM Cortex-M4" },
      { "name": "firmware", "value": "v2.3.1" }
    ]
  }
}
```

### gateway
```json
{
  "id": "central_gw",
  "type": "gateway",
  "position": { "x": 300, "y": 50 },
  "data": {
    "label": "Central Gateway",
    "protocols": ["CAN", "Ethernet", "LIN"]
  }
}
```

---

## Requirements Nodes

### sysmlRequirement
```json
{
  "id": "req_safety_001",
  "type": "sysmlRequirement",
  "position": { "x": 100, "y": 100 },
  "data": {
    "label": "Emergency Stop",
    "reqId": "REQ-SAFETY-001",
    "reqText": "The system shall stop all actuators within 100ms of emergency signal.",
    "priority": "Critical",
    "status": "Approved"
  }
}
```

| Field | Required | Description |
|-------|----------|-------------|
| label | ✅ | Short name |
| reqId | ✅ | Unique identifier |
| reqText | ✅ | Full requirement statement |
| priority | ❌ | Critical, High, Medium, Low |
| status | ❌ | Draft, Approved, Implemented |

### sysmlTestCase
```json
{
  "id": "test_estop_001",
  "type": "sysmlTestCase",
  "position": { "x": 400, "y": 100 },
  "data": {
    "label": "E-Stop Response Test",
    "testId": "TC-001",
    "description": "Verify actuator shutdown within timing requirement"
  }
}
```

---

## Activity Diagram Nodes

### sysmlAction
```json
{
  "id": "process_order",
  "type": "sysmlAction",
  "position": { "x": 200, "y": 150 },
  "data": {
    "label": "Process Order",
    "inputPins": [{ "name": "orderData", "type": "Order" }],
    "outputPins": [{ "name": "result", "type": "Boolean" }]
  }
}
```

### sysmlDecision
```json
{
  "id": "check_valid",
  "type": "sysmlDecision",
  "position": { "x": 200, "y": 250 },
  "data": {
    "label": "",
    "condition": "isOrderValid"
  }
}
```

### sysmlForkJoin
```json
{
  "id": "parallel_fork",
  "type": "sysmlForkJoin",
  "position": { "x": 200, "y": 300 },
  "data": {
    "orientation": "horizontal",
    "isFork": true
  }
}
```

### sysmlInitial
```json
{
  "id": "start_node",
  "type": "sysmlInitial",
  "position": { "x": 200, "y": 50 },
  "data": {}
}
```

### sysmlFinal
```json
{
  "id": "end_node",
  "type": "sysmlFinal",
  "position": { "x": 200, "y": 500 },
  "data": {
    "flowFinal": false
  }
}
```

---

## State Machine Nodes

### sysmlState
```json
{
  "id": "state_idle",
  "type": "sysmlState",
  "position": { "x": 100, "y": 150 },
  "data": {
    "label": "Idle",
    "entry": "resetCounters()",
    "do": "monitorSignals()",
    "exit": "logStateExit()"
  }
}
```

### sysmlPseudoState
```json
{
  "id": "initial_state",
  "type": "sysmlPseudoState",
  "position": { "x": 200, "y": 30 },
  "data": {
    "pseudoType": "initial"
  }
}
```

| pseudoType | Description | Visual |
|------------|-------------|--------|
| `initial` | Starting point | Filled circle |
| `final` | End state | Circle with dot |
| `choice` | Conditional branch | Diamond |
| `fork` | Parallel split | Bar |
| `join` | Parallel merge | Bar |
| `history` | Shallow history | H in circle |
| `deepHistory` | Deep history | H* in circle |
| `entryPoint` | Region entry | Small circle |
| `exitPoint` | Region exit | X in circle |

---

## Constraint Nodes

### sysmlConstraintBlock
```json
{
  "id": "newton_eq",
  "type": "sysmlConstraintBlock",
  "position": { "x": 300, "y": 200 },
  "data": {
    "label": "Newton's Second Law",
    "equation": "F = m * a",
    "parameters": [
      { "name": "F", "type": "Force" },
      { "name": "m", "type": "Mass" },
      { "name": "a", "type": "Acceleration" }
    ]
  }
}
```

---

## Annotation Nodes

### textBox
```json
{
  "id": "note_1",
  "type": "textBox",
  "position": { "x": 500, "y": 50 },
  "data": {
    "text": "This diagram shows the high-level architecture",
    "variant": "note",
    "fontSize": 12,
    "fontColor": "#94a3b8"
  }
}
```

| variant | Visual Style |
|---------|--------------|
| `default` | Simple text box |
| `note` | Yellow sticky note |
| `comment` | Gray comment box |

### diagramFrame
```json
{
  "id": "bdd_frame",
  "type": "diagramFrame",
  "position": { "x": 0, "y": 0 },
  "data": {
    "diagramType": "bdd",
    "diagramName": "Vehicle Block Definition",
    "modelName": "VehicleSystem"
  }
}
```
