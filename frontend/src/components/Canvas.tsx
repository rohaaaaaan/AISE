'use client';

import React, { useCallback } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
  Node,
  Edge,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  SelectionMode,
  Connection,
  IsValidConnection,
} from '@xyflow/react';

import '@xyflow/react/dist/style.css';
import ECUNode from './nodes/ECUNode';
import SensorNode from './nodes/SensorNode';
import ActuatorNode from './nodes/ActuatorNode';
import GatewayNode from './nodes/GatewayNode';
import SystemNode from './nodes/SystemNode';
import FrameNode from './nodes/FrameNode';
import DiagramFrame from './nodes/DiagramFrame';
import SimulinkPortNode from './nodes/SimulinkPortNode';
import SysMLBlockNode from './nodes/SysMLBlockNode';
import SysMLPortNode from './nodes/SysMLPortNode';
import SysMLPartNode from './nodes/SysMLPartNode';
import SysMLRequirementNode from './nodes/SysMLRequirementNode';
import SysMLActorNode from './nodes/SysMLActorNode';
import SysMLUseCaseNode from './nodes/SysMLUseCaseNode';
import SysMLSystemBoundaryNode from './nodes/SysMLSystemBoundaryNode';
import SysMLConstraintBlockNode from './nodes/SysMLConstraintBlockNode';
// Sequence Nodes
import SysMLLifelineNode from './nodes/SysMLLifelineNode';
// State Machine Nodes
import SysMLStateNode from './nodes/SysMLStateNode';
import SysMLPseudoStateNode from './nodes/SysMLPseudoStateNode';
import SysMLPackageNode from './nodes/SysMLPackageNode';
import TextBoxNode from './nodes/TextBoxNode';
// Activity Diagram nodes
import SysMLActionNode from './nodes/SysMLActionNode';
import SysMLDecisionNode from './nodes/SysMLDecisionNode';
import SysMLForkJoinNode from './nodes/SysMLForkJoinNode';
import SysMLInitialNode from './nodes/SysMLInitialNode';
import SysMLFinalNode from './nodes/SysMLFinalNode';
import SysMLSwimlaneNode from './nodes/SysMLSwimlaneNode';
import SysMLSignalNode from './nodes/SysMLSignalNode';
import SysMLInterruptibleRegionNode from './nodes/SysMLInterruptibleRegionNode';
import SysMLEdge from './edges/SysMLEdge';
import {
  CANEdge, EthernetEdge, LINEdge,
  CompositionEdge, AggregationEdge, GeneralizationEdge, ItemFlowEdge,
  SatisfyEdge, VerifyEdge, DeriveEdge, RefineEdge,
  IncludeEdge, ExtendEdge, BindingEdge, ControlFlowEdge, ObjectFlowEdge
} from './edges/CustomEdges';

const nodeTypes = {
  default: SystemNode,
  ecu: ECUNode,
  sensor: SensorNode,
  actuator: ActuatorNode,
  gateway: GatewayNode,
  sysmlBlock: SysMLBlockNode,
  sysmlPart: SysMLPartNode,
  sysmlPort: SysMLPortNode,
  sysmlRequirement: SysMLRequirementNode,
  sysmlActor: SysMLActorNode,
  sysmlUseCase: SysMLUseCaseNode,
  sysmlSystemBoundary: SysMLSystemBoundaryNode,
  sysmlConstraintBlock: SysMLConstraintBlockNode,
  // Sequence Diagram nodes
  sysmlLifeline: SysMLLifelineNode,
  // State Machine Diagram nodes
  sysmlState: SysMLStateNode,
  sysmlPseudoState: SysMLPseudoStateNode,
  sysmlHistory: SysMLPseudoStateNode,
  sysmlDeepHistory: SysMLPseudoStateNode,
  sysmlEntryPoint: SysMLPseudoStateNode,
  sysmlExitPoint: SysMLPseudoStateNode,
  // Activity Diagram nodes
  sysmlAction: SysMLActionNode,
  sysmlDecision: SysMLDecisionNode,
  sysmlForkJoin: SysMLForkJoinNode,
  sysmlInitial: SysMLInitialNode,
  sysmlFinal: SysMLFinalNode,
  sysmlSwimlane: SysMLSwimlaneNode,
  sysmlSignal: SysMLSignalNode,
  sysmlInterruptibleRegion: SysMLInterruptibleRegionNode,
  // Package Diagram nodes
  sysmlPackage: SysMLPackageNode,
  // Annotation nodes
  textBox: TextBoxNode,
  note: TextBoxNode,
  comment: TextBoxNode,
  frame: FrameNode,
  diagramFrame: DiagramFrame,
  simulinkPort: SimulinkPortNode,
};

const edgeTypes = {
  can: CANEdge,
  ethernet: EthernetEdge,
  lin: LINEdge,
  composition: CompositionEdge,
  aggregation: AggregationEdge,
  generalization: GeneralizationEdge,
  itemFlow: ItemFlowEdge,
  satisfy: SatisfyEdge,
  verify: VerifyEdge,
  derive: DeriveEdge,
  refine: RefineEdge,
  include: IncludeEdge,
  extend: ExtendEdge,
  binding: BindingEdge,
  controlFlow: ControlFlowEdge,
  objectFlow: ObjectFlowEdge,
  // Sequence
  sequenceSync: SysMLEdge,
  sequenceAsync: SysMLEdge,
  sequenceReply: SysMLEdge,
  // State Machine
  transition: SysMLEdge,
  association: SysMLEdge,  // Map association to default SysML edge
  default: SysMLEdge,       // Fallback for unrecognized types
  sysml: SysMLEdge,
};

interface CanvasProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  onNodeDoubleClick?: (event: React.MouseEvent, node: Node) => void;
  onEdgeDoubleClick?: (event: React.MouseEvent, edge: Edge) => void;
  onNodeContextMenu?: (event: React.MouseEvent, node: Node) => void;
  onEdgeContextMenu?: (event: React.MouseEvent, edge: Edge) => void;
  onPaneContextMenu?: (event: React.MouseEvent | MouseEvent) => void;
  onSelectionChange?: (params: { nodes: Node[]; edges: Edge[] }) => void;
  isValidConnection?: IsValidConnection;
  snapToGrid?: boolean;
  onNodeDragStop?: (event: React.MouseEvent, node: Node) => void;
  onInit?: (instance: any) => void;
  onDrop?: (event: React.DragEvent) => void;
  onDragOver?: (event: React.DragEvent) => void;
  fitView?: boolean;
  onReconnect?: (oldEdge: Edge, newConnection: Connection) => void;
  onReconnectStart?: (event: React.MouseEvent, edge: Edge, handleType: 'source' | 'target') => void;
  onReconnectEnd?: (event: MouseEvent | TouchEvent, edge: Edge, handleType: 'source' | 'target') => void;
}

export default function Canvas({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onNodeDoubleClick,
  onEdgeDoubleClick,
  onNodeContextMenu,
  onEdgeContextMenu,
  onPaneContextMenu,
  onSelectionChange,
  isValidConnection,
  snapToGrid = false,
  onNodeDragStop,
  onInit,
  onDrop,
  onDragOver,
  fitView = true,
  onReconnect,
  onReconnectStart,
  onReconnectEnd,
}: CanvasProps) {
  // Import EdgePathProvider for bypass detection
  const EdgePathProviderComponent = require('@/context/EdgePathContext').EdgePathProvider;

  return (
    <EdgePathProviderComponent>
      <div style={{ width: '100%', height: '100%' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeDoubleClick={onNodeDoubleClick}
          onEdgeDoubleClick={onEdgeDoubleClick}
          onNodeContextMenu={onNodeContextMenu}
          onEdgeContextMenu={onEdgeContextMenu}
          onPaneContextMenu={onPaneContextMenu}
          onSelectionChange={onSelectionChange}
          isValidConnection={isValidConnection}
          onNodeDragStop={onNodeDragStop}
          onInit={onInit}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onReconnect={onReconnect}
          onReconnectStart={onReconnectStart}
          onReconnectEnd={onReconnectEnd}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          deleteKeyCode={['Backspace', 'Delete']}
          selectionOnDrag
          panOnDrag={[1, 2]}
          selectionMode={SelectionMode.Partial}
          snapToGrid={snapToGrid}
          snapGrid={[15, 15]}
          multiSelectionKeyCode="Control"
          colorMode="dark"
          fitView={fitView}
        >
          <Controls />
          <MiniMap />
          <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
        </ReactFlow>
      </div>
    </EdgePathProviderComponent>
  );
}
