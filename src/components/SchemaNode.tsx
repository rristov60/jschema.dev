import React from 'react';
import { Handle, Position } from 'reactflow';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface SchemaNodeData {
    label: string;
    schemaName: string;
    isRoot?: boolean;
    isExpanded?: boolean;
    onToggle?: () => void;
    properties?: string[];
    entityType?: string;
    isSelected?: boolean;
    isEntityTypeSelected?: boolean;
    isConnected?: boolean;
}

interface SchemaNodeProps {
    data: SchemaNodeData;
}

const stringToColor = (str: string): { border: string; background: string } => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }

    const goldenRatio = 0.618033988749895;
    const hue = (Math.abs(hash) * goldenRatio * 360) % 360;

    const saturation = 70 + (Math.abs(hash >> 8) % 25);
    const lightness = 50 + (Math.abs(hash >> 16) % 20);

    const border = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    const background = `hsl(${hue}, ${saturation}%, ${Math.max(lightness - 30, 18)}%)`;

    return { border, background };
};

const getEntityColor = (entityType?: string, isRoot?: boolean): { border: string; background: string } => {
    if (isRoot) {
        return { border: '#4CAF50', background: '#2d4a2e' };
    }

    if (!entityType) {
        return { border: '#777', background: '#333' };
    }

    return stringToColor(entityType);
};

export const SchemaNode: React.FC<SchemaNodeProps> = ({ data }) => {
    const { label, isRoot, isExpanded, onToggle, properties, entityType, isSelected, isEntityTypeSelected, isConnected } = data;
    const colors = getEntityColor(entityType, isRoot);

    const isHighlighted = isSelected || isEntityTypeSelected;

    const hasSelection = isSelected === true || isEntityTypeSelected === true || isSelected === false || isEntityTypeSelected === false;
    let opacity = 1;
    if (hasSelection) {
        if (isHighlighted) {
            opacity = 1;
        } else if (isConnected) {
            opacity = 0.6;
        } else {
            opacity = 0.15;
        }
    }

    const borderWidth = isHighlighted ? '3px' : '2px';
    const boxShadow = isHighlighted ? '0 0 12px rgba(97, 218, 251, 0.6)' : 'none';

    return (
        <div
            style={{
                border: `${borderWidth} solid ${colors.border}`,
                padding: '10px',
                borderRadius: '8px',
                background: colors.background,
                color: '#fff',
                minWidth: '180px',
                fontWeight: isRoot ? 'bold' : 'normal',
                overflow: 'hidden',
                opacity,
                boxShadow,
                transition: 'all 0.2s ease',
            }}
        >
            <Handle type="target" position={Position.Top} />

            <div
                style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}
                onClick={() => {
                    console.log('Node toggle clicked:', label);
                    if (onToggle) onToggle();
                }}
            >
                {properties && properties.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </div>
                )}
                <div style={{ flex: 1 }}>{label}</div>
            </div>

            {isExpanded && properties && properties.length > 0 && (
                <div
                    className="nowheel"
                    style={{
                        marginTop: '8px',
                        paddingTop: '8px',
                        borderTop: '1px solid #555',
                        fontSize: '0.85em',
                        maxHeight: '250px',
                        overflowY: 'auto',
                    }}
                    onWheel={(e) => {
                        e.stopPropagation();
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.pointerEvents = 'auto';
                    }}
                >
                    {properties.map((prop, idx) => (
                        <div key={idx} style={{ padding: '2px 0', color: '#aaa' }}>
                            • {prop}
                        </div>
                    ))}
                </div>
            )}

            <Handle type="source" position={Position.Bottom} />
        </div>
    );
};
