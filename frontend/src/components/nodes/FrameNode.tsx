import { memo } from 'react';
import { NodeProps } from '@xyflow/react';

const FrameNode = ({ data }: NodeProps) => {
    return <div style={{ width: '100%', height: '100%', pointerEvents: 'none', background: 'transparent' }} />;
};

export default memo(FrameNode);
