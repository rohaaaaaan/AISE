import React from 'react';
import { BaseEdge, EdgeProps, getBezierPath, getSmoothStepPath, EdgeLabelRenderer } from '@xyflow/react';
import { SYSML_CONNECTORS, MARKER_DEFINITIONS } from '@/config/sysml-connectors';

// Helper to get config style
const getEdgeStyle = (id: string, propStyle: React.CSSProperties = {}) => {
  const config = SYSML_CONNECTORS[id];
  return { ...config?.style, ...propStyle };
};

// Helper to get stereotype label
const getStereotype = (id: string) => {
  return SYSML_CONNECTORS[id]?.stereotype;
}

export function CANEdge(props: EdgeProps) {
  const { sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, style, markerEnd, label, data } = props;
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
    borderRadius: 0,
  });

  const busType = (data as any)?.busType;
  let edgeStyle = getEdgeStyle('can', style);

  // Dynamic CAN Styling override
  switch (busType) {
    case 'canfd':
      edgeStyle = { ...edgeStyle, stroke: '#7c3aed', strokeWidth: 3, strokeDasharray: undefined }; // Purple, Solid
      break;
    case 'highspeed':
      edgeStyle = { ...edgeStyle, stroke: '#dc2626', strokeWidth: 2, strokeDasharray: '10,5' }; // Red, Long Dash
      break;
    case 'lowspeed':
      edgeStyle = { ...edgeStyle, stroke: '#059669', strokeWidth: 2, strokeDasharray: '2,2' }; // Green, Dotted
      break;
    case 'classic':
    default:
      // Keep default from config or ensure it's set
      edgeStyle = { ...edgeStyle, stroke: '#f59e0b', strokeWidth: 3, strokeDasharray: '5,5' };
      break;
  }

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={edgeStyle} />
      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              background: edgeStyle.stroke,
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '10px',
              fontWeight: 600,
              color: '#000',
              pointerEvents: 'all',
            }}
            className="nodrag nopan"
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

export function EthernetEdge(props: EdgeProps) {
  const { sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, style, markerEnd, label } = props;
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
    borderRadius: 0,
  });

  const edgeStyle = getEdgeStyle('ethernet', style);

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={edgeStyle} />
      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              background: edgeStyle.stroke,
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '10px',
              fontWeight: 600,
              color: '#fff',
              pointerEvents: 'all',
            }}
            className="nodrag nopan"
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

export function LINEdge(props: EdgeProps) {
  const { sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, style, markerEnd, label } = props;
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
    borderRadius: 0,
  });

  const edgeStyle = getEdgeStyle('lin', style);

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={edgeStyle} />
      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              background: edgeStyle.stroke,
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '10px',
              fontWeight: 600,
              color: '#000',
              pointerEvents: 'all',
            }}
            className="nodrag nopan"
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}


export function CompositionEdge(props: EdgeProps) {
  const [edgePath] = getSmoothStepPath(props);
  const config = SYSML_CONNECTORS['composition'];

  return (
    <>
      {/* We rely on global definitions for markers now, but keeping local defs for safety if not in Canvas */}
      <defs>
        {MARKER_DEFINITIONS.filter(m => m.id === config.markerStart).map(m => (
          <marker key={m.id} id={m.id} markerWidth={m.width} markerHeight={m.height} refX={m.refX} refY={m.refY} orient="auto">
            <path d={m.path} fill={m.fill} stroke={m.stroke} />
          </marker>
        ))}
      </defs>
      <BaseEdge
        path={edgePath}
        markerStart={`url(#${config.markerStart})`}
        style={getEdgeStyle('composition', props.style)}
      />
    </>
  );
}

export function AggregationEdge(props: EdgeProps) {
  const [edgePath] = getSmoothStepPath(props);
  const config = SYSML_CONNECTORS['aggregation'];

  return (
    <>
      <defs>
        {MARKER_DEFINITIONS.filter(m => m.id === config.markerStart).map(m => (
          <marker key={m.id} id={m.id} markerWidth={m.width} markerHeight={m.height} refX={m.refX} refY={m.refY} orient="auto">
            <path d={m.path} fill={m.fill} stroke={m.stroke} strokeWidth={1.5} />
          </marker>
        ))}
      </defs>
      <BaseEdge
        path={edgePath}
        markerStart={`url(#${config.markerStart})`}
        style={getEdgeStyle('aggregation', props.style)}
      />
    </>
  );
}

export function GeneralizationEdge(props: EdgeProps) {
  const [edgePath] = getSmoothStepPath(props);
  const config = SYSML_CONNECTORS['generalization'];

  return (
    <>
      <defs>
        {MARKER_DEFINITIONS.filter(m => m.id === config.markerEnd).map(m => (
          <marker key={m.id} id={m.id} markerWidth={m.width} markerHeight={m.height} refX={m.refX} refY={m.refY} orient="auto">
            <path d={m.path} fill={m.fill} stroke={m.stroke} strokeWidth={1.5} />
          </marker>
        ))}
      </defs>
      <BaseEdge
        path={edgePath}
        markerEnd={`url(#${config.markerEnd})`}
        style={getEdgeStyle('generalization', props.style)}
      />
    </>
  );
}

export function ItemFlowEdge(props: EdgeProps) {
  const [edgePath, labelX, labelY] = getSmoothStepPath(props);
  const config = SYSML_CONNECTORS['itemFlow'];
  const label = props.label || config.stereotype?.replace(/«|»/g, '') || 'flow';

  return (
    <>
      <defs>
        {MARKER_DEFINITIONS.filter(m => m.id === config.markerEnd).map(m => (
          <marker key={m.id} id={m.id} markerWidth={m.width} markerHeight={m.height} refX={m.refX} refY={m.refY} orient="auto">
            <path d={m.path} fill={m.fill} stroke={m.stroke} />
          </marker>
        ))}
      </defs>
      <BaseEdge
        path={edgePath}
        markerEnd={`url(#${config.markerEnd})`}
        style={getEdgeStyle('itemFlow', props.style)}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            background: '#fff',
            padding: '2px 8px',
            border: '1px solid #000',
            borderRadius: '4px',
            fontSize: '10px',
            fontWeight: 600,
            color: '#000',
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        >
          «{label}»
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

export function SatisfyEdge(props: EdgeProps) {
  const [edgePath, labelX, labelY] = getSmoothStepPath(props);

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={props.markerEnd}
        style={getEdgeStyle('satisfy', props.style)}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            background: '#fff',
            padding: '2px 4px',
            fontSize: '10px',
            color: '#000',
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        >
          {getStereotype('satisfy')}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

export function VerifyEdge(props: EdgeProps) {
  const [edgePath, labelX, labelY] = getSmoothStepPath(props);

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={props.markerEnd}
        style={getEdgeStyle('verify', props.style)}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            background: '#fff',
            padding: '2px 4px',
            fontSize: '10px',
            color: '#000',
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        >
          {getStereotype('verify')}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

export function DeriveEdge(props: EdgeProps) {
  const [edgePath, labelX, labelY] = getSmoothStepPath(props);

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={props.markerEnd}
        style={getEdgeStyle('derive', props.style)}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            background: '#fff',
            padding: '2px 4px',
            fontSize: '10px',
            color: '#000',
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        >
          {getStereotype('derive')}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

export function RefineEdge(props: EdgeProps) {
  const [edgePath, labelX, labelY] = getSmoothStepPath(props);

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={props.markerEnd}
        style={getEdgeStyle('refine', props.style)}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            background: '#fff',
            padding: '2px 4px',
            fontSize: '10px',
            color: '#000',
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        >
          {getStereotype('refine')}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

// Include Edge (Use Case Diagram)
export function IncludeEdge(props: EdgeProps) {
  const { sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition } = props;
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
  });

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={props.markerEnd}
        style={getEdgeStyle('include', props.style)}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            background: '#fff',
            padding: '2px 4px',
            fontSize: '10px',
            color: '#000',
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        >
          {getStereotype('include')}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

// Extend Edge (Use Case Diagram)
export function ExtendEdge(props: EdgeProps) {
  const { sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition } = props;
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
  });

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={props.markerEnd}
        style={getEdgeStyle('extend', props.style)}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            background: '#fff',
            padding: '2px 4px',
            fontSize: '10px',
            color: '#000',
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        >
          {getStereotype('extend')}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

// Binding Edge (Parametric Diagram - connects constraint parameters to properties)
export function BindingEdge(props: EdgeProps) {
  const { sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition } = props;
  const [edgePath] = getBezierPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
  });

  return (
    <BaseEdge
      path={edgePath}
      style={{
        strokeWidth: 2,
        stroke: '#7c3aed',
        strokeDasharray: '6,3',
        ...props.style,
      }}
    />
  );
}

// Control Flow Edge (Activity Diagram - connects actions, decisions, forks)
export function ControlFlowEdge(props: EdgeProps) {
  const { sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, label } = props;
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
    borderRadius: 8,
  });

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd="url(#control-flow-arrow)"
        style={{
          strokeWidth: 2,
          stroke: '#3b82f6',
          strokeDasharray: '6,3',
          ...props.style,
        }}
      />
      {/* Arrow marker definition */}
      <defs>
        <marker
          id="control-flow-arrow"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#3b82f6" />
        </marker>
      </defs>
      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              background: '#1f2937',
              padding: '2px 6px',
              fontSize: '10px',
              color: '#fff',
              borderRadius: '4px',
              border: '1px solid #3b82f6',
              pointerEvents: 'all',
            }}
            className="nodrag nopan"
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

// Object Flow Edge (Activity Diagram - data/object flow between actions)
export function ObjectFlowEdge(props: EdgeProps) {
  const { sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, label } = props;
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
    borderRadius: 8,
  });

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd="url(#object-flow-arrow)"
        style={{
          strokeWidth: 2,
          stroke: '#10b981',
          ...props.style,
        }}
      />
      {/* Arrow marker definition */}
      <defs>
        <marker
          id="object-flow-arrow"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#10b981" />
        </marker>
      </defs>
      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              background: '#1f2937',
              padding: '2px 6px',
              fontSize: '10px',
              color: '#fff',
              borderRadius: '4px',
              border: '1px solid #10b981',
              pointerEvents: 'all',
            }}
            className="nodrag nopan"
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
