import type { Node, Edge } from 'reactflow';
import elk from 'elkjs/lib/elk.bundled';

const elkInstance = new elk();

export const layoutGraph = async (nodes: Node[], edges: Edge[]) => {
    const elkGraph = {
        id: 'root',
        layoutOptions: {
            'elk.algorithm': 'layered',
            'elk.direction': 'DOWN',
            'elk.spacing.nodeNode': '80',
            'elk.layered.spacing.nodeNodeBetweenLayers': '150',
            'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
            'elk.layered.crossingMinimization.semiInteractive': 'true',
            'elk.layered.considerModelOrder.strategy': 'NODES_AND_EDGES',
            'elk.spacing.componentComponent': '100',
        },
        children: nodes.map((node) => {
            const baseHeight = 80;
            const label = node.data.label || '';
            const minWidth = 200;
            const labelWidth = label.length * 8 + 60; 
            const calculatedWidth = Math.max(minWidth, Math.min(labelWidth, 500));
            return {
                id: node.id,
                width: calculatedWidth,
                height: baseHeight,
            };
        }),
        edges: edges.map((edge) => ({
            id: edge.id,
            sources: [edge.source],
            targets: [edge.target],
        })),
    };

    try {
        const layout = await elkInstance.layout(elkGraph);
        return {
            nodes: nodes.map((node) => {
                const layoutNode = layout.children?.find((n) => n.id === node.id);
                return {
                    ...node,
                    position: {
                        x: layoutNode?.x || 0,
                        y: layoutNode?.y || 0,
                    },
                };
            }),
            edges,
        };
    } catch (error) {
        console.error('Layout error:', error);
        return { nodes, edges };
    }
};

export const schemaToGraph = (schema: any): { nodes: Node[]; edges: Edge[] } => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    let idCounter = 0;

    const traverse = (obj: any, parentId: string | null, label: string) => {
        const id = `node-${idCounter++}`;
        const type = obj.type || 'object';
        nodes.push({
            id,
            data: { label: `${label} (${type})` },
            position: { x: 0, y: 0 },
            style: {
                border: '1px solid #777',
                padding: '10px',
                borderRadius: '5px',
                background: '#333',
                color: '#fff',
                width: 150,
            },
        });
        if (parentId) {
            edges.push({
                id: `edge-${parentId}-${id}`,
                source: parentId,
                target: id,
                animated: true,
            });
        }
        if (obj.properties) {
            Object.keys(obj.properties).forEach((key) => traverse(obj.properties[key], id, key));
        } else if (obj.items) {
            traverse(obj.items, id, 'items');
        } else if (obj.definitions || obj.$defs) {
            const defs = obj.definitions || obj.$defs;
            Object.keys(defs).forEach((key) => traverse(defs[key], id, `def: ${key}`));
        }
    };
    traverse(schema, null, 'Root');
    return { nodes, edges };
};
