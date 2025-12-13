# AISE - Connector / Edge Rules

Complete reference for all edge types with usage rules and styling.

---

## Edge JSON Structure

```json
{
  "id": "edge_unique_id",
  "source": "source_node_id",
  "target": "target_node_id",
  "type": "composition",
  "sourceHandle": "right",      // Optional: left, right, top, bottom
  "targetHandle": "left",       // Optional
  "data": {
    // Type-specific data
  }
}
```

---

## Structural Connectors

### composition
**Use:** Strong ownership in BDD (whole-part relationship)
**Rule:** Parent "owns" child; child cannot exist without parent

```json
{
  "id": "vehicle_to_chassis",
  "source": "vehicle_system",
  "target": "chassis_block",
  "type": "composition"
}
```

**⚠️ CRITICAL:** Do NOT use composition in IBD - use `parentId` nesting instead!

---

### aggregation
**Use:** Weak ownership (shared parts)
**Visual:** Empty diamond at source

```json
{
  "id": "team_to_member",
  "source": "team_block",
  "target": "engineer_block",
  "type": "aggregation"
}
```

---

### generalization
**Use:** Inheritance, specialization
**Visual:** Triangle arrowhead

```json
{
  "id": "sedan_extends_vehicle",
  "source": "sedan_block",
  "target": "vehicle_block",
  "type": "generalization"
}
```

---

### association
**Use:** General relationship between logical elements
**Visual:** Simple line with optional arrow

```json
{
  "id": "user_to_system",
  "source": "user_actor",
  "target": "system_block",
  "type": "association"
}
```

**⚠️ CRITICAL:** NEVER use association for hardware! Use bus types.

---

### dependency
**Use:** One element depends on another
**Visual:** Dashed arrow

```json
{
  "id": "app_depends_lib",
  "source": "application",
  "target": "library",
  "type": "dependency"
}
```

---

## Hardware / Network Connectors

### RULE: Hardware to Hardware = Bus Type

| From | To | Use Connector |
|------|-----|---------------|
| sensor | ecu | `can`, `lin`, `ethernet` |
| ecu | actuator | `can`, `lin`, `pwm` |
| ecu | ecu | `can`, `ethernet` |
| ecu | gateway | `can`, `ethernet` |
| sensor | sensor (bus) | `can` |

### can
**Use:** CAN bus network connection
**Color:** Orange (#f97316)

```json
{
  "id": "sensor_can_ecu",
  "source": "temp_sensor",
  "target": "bms_ecu",
  "type": "can"
}
```

### lin
**Use:** LIN bus (low-speed, single-wire)
**Color:** Light blue (#38bdf8)

```json
{
  "id": "switch_lin_bcm",
  "source": "window_switch",
  "target": "body_control_module",
  "type": "lin"
}
```

### ethernet
**Use:** Automotive Ethernet
**Color:** Green (#22c55e)

```json
{
  "id": "camera_eth_adas",
  "source": "front_camera",
  "target": "adas_ecu",
  "type": "ethernet"
}
```

### flexray
**Use:** FlexRay bus (high-speed, safety-critical)
**Color:** Purple (#a855f7)

```json
{
  "id": "brake_fr_esp",
  "source": "brake_sensor",
  "target": "esp_ecu",
  "type": "flexray"
}
```

---

## Requirements Connectors

### satisfy
**Use:** Block satisfies a requirement
**Direction:** Block → Requirement
**Label:** <<satisfy>>

```json
{
  "id": "brakes_satisfy_safety",
  "source": "brake_system",
  "target": "req_safety_001",
  "type": "satisfy"
}
```

### verify
**Use:** Test case verifies a requirement
**Direction:** TestCase → Requirement
**Label:** <<verify>>

```json
{
  "id": "test_verifies_req",
  "source": "test_estop_001",
  "target": "req_safety_001",
  "type": "verify"
}
```

### derive
**Use:** Child requirement derived from parent
**Direction:** ChildReq → ParentReq
**Label:** <<deriveReqt>>

```json
{
  "id": "subreq_from_parent",
  "source": "req_latency_001",
  "target": "req_performance_001",
  "type": "derive"
}
```

### refine
**Use:** More detailed requirement refines abstract one
**Label:** <<refine>>

```json
{
  "id": "detail_refines_abstract",
  "source": "req_motor_speed",
  "target": "req_performance",
  "type": "refine"
}
```

### trace
**Use:** General traceability link
**Label:** <<trace>>

---

## Behavior Connectors

### controlFlow
**Use:** Activity diagram sequencing
**Visual:** Blue solid arrow
**Color:** #3b82f6

```json
{
  "id": "flow_start_to_action",
  "source": "initial_node",
  "target": "process_order",
  "type": "controlFlow"
}
```

### objectFlow
**Use:** Data/object passing in activities
**Visual:** Green dashed arrow
**Color:** #22c55e

```json
{
  "id": "data_to_action",
  "source": "get_data_action",
  "target": "process_action",
  "type": "objectFlow",
  "data": {
    "label": "orderData"
  }
}
```

### transition
**Use:** State machine state changes
**Visual:** Arrow with optional label

```json
{
  "id": "idle_to_active",
  "source": "state_idle",
  "target": "state_active",
  "type": "transition",
  "data": {
    "trigger": "startButton",
    "guard": "[systemReady]",
    "effect": "initializeSystem()"
  }
}
```

**Transition Label Format:** `trigger [guard] / effect`
Example: `startButton [systemReady] / initializeSystem()`

---

## Parametric Connectors

### binding
**Use:** Connect constraint parameters to properties
**Visual:** Purple dashed line
**Color:** #a855f7

```json
{
  "id": "force_binding",
  "source": "newton_constraint",
  "target": "brake_force_property",
  "type": "binding",
  "sourceHandle": "param_F",
  "data": {
    "parameterName": "F"
  }
}
```

---

## Package Connectors

### packageImport
**Use:** Import elements from another package
**Visual:** Dashed arrow with <<import>>

```json
{
  "id": "import_types",
  "source": "vehicle_pkg",
  "target": "common_types_pkg",
  "type": "packageImport"
}
```

### packageMerge
**Use:** Merge packages together
**Visual:** Dashed arrow with <<merge>>

```json
{
  "id": "merge_configs",
  "source": "main_pkg",
  "target": "config_pkg",
  "type": "packageMerge"
}
```

---

## Use Case Connectors

### include
**Use:** Use case always includes another
**Visual:** Dashed arrow with <<include>>

```json
{
  "id": "login_include_validate",
  "source": "uc_login",
  "target": "uc_validate_credentials",
  "type": "include"
}
```

### extend
**Use:** Optional extension of use case
**Visual:** Dashed arrow with <<extend>>

```json
{
  "id": "advanced_extends_basic",
  "source": "uc_advanced_search",
  "target": "uc_search",
  "type": "extend"
}
```

---

## Quick Reference Table

| Connector | From | To | Diagram |
|-----------|------|-----|---------|
| `composition` | Parent Block | Child Block | BDD |
| `aggregation` | Container | Shared Part | BDD |
| `generalization` | Specific | General | BDD |
| `can` | Hardware | Hardware | IBD, EE |
| `lin` | Hardware | Hardware | IBD, EE |
| `ethernet` | Hardware | Hardware | IBD, EE |
| `satisfy` | Block | Requirement | REQ |
| `verify` | TestCase | Requirement | REQ |
| `derive` | SubReq | ParentReq | REQ |
| `controlFlow` | Activity Node | Activity Node | ACT |
| `objectFlow` | Action | Action | ACT |
| `transition` | State | State | STM |
| `binding` | Constraint | Property | PAR |
| `include` | UseCase | UseCase | UC |
| `extend` | UseCase | UseCase | UC |
