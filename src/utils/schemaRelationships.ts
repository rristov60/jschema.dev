import type { Node, Edge } from 'reactflow';

export interface SchemaRelationship {
    from: string;
    to: string;
    refPath: string;
    type: 'one-to-one' | 'one-to-many' | 'multiple';
    propertyName?: string;
}

const resolveRelativePath = (basePath: string, relativePath: string): string => {
    const baseDir = basePath.substring(0, basePath.lastIndexOf('/'));

    const baseParts = baseDir.split('/').filter(p => p);
    const relParts = relativePath.split('/').filter(p => p);

    const resultParts = [...baseParts];
    for (const part of relParts) {
        if (part === '..') {
            resultParts.pop();
        } else if (part !== '.') {
            resultParts.push(part);
        }
    }

    return resultParts.join('/');
};

export const extractSchemaReferences = (schema: any, schemaName: string): SchemaRelationship[] => {
    const refs: SchemaRelationship[] = [];

    const traverse = (obj: any, path: string = '', propertyName: string = '', parentIsArray: boolean = false) => {
        if (!obj || typeof obj !== 'object') return;
        if (obj.$ref && typeof obj.$ref === 'string') {
            const match = obj.$ref.match(/^([^#]+)/);
            if (match && match[1] && match[1].endsWith('.json')) {
                let refPath = match[1];

                if (refPath.startsWith('../') || refPath.startsWith('./')) {
                    refPath = resolveRelativePath(schemaName, refPath);
                } else if (!refPath.includes('/')) {
                    const baseDir = schemaName.substring(0, schemaName.lastIndexOf('/'));
                    refPath = baseDir ? `${baseDir}/${refPath}` : refPath;
                }

                const relationType: 'one-to-one' | 'one-to-many' = parentIsArray ? 'one-to-many' : 'one-to-one';

                refs.push({
                    from: schemaName,
                    to: refPath,
                    refPath: obj.$ref,
                    type: relationType,
                    propertyName: propertyName
                });
            }
        }
        if (obj.type === 'array' && obj.items) {
            traverse(obj.items, path, propertyName, true);
        }

        Object.entries(obj).forEach(([key, value]) => {
            if (typeof value === 'object' && value !== null && key !== 'items') {
                traverse(value, path, key, false);
            }
        });
    };

    traverse(schema);
    return refs;
};

const extractEntityType = (schemaPath: string): string => {
    const withoutExtension = schemaPath.replace(/\.schema\.json$/, '');

    const pathParts = withoutExtension.split('/');

    if (pathParts.length >= 2) {
        if (pathParts[0] === 'v1' && pathParts[1]) {
            return pathParts[1];
        }
    }

    const filename = pathParts[pathParts.length - 1];
    return filename || 'unknown';
};

export const createSchemaGraph = (
    schemas: Map<string, any>,
    relationships: SchemaRelationship[],
    expandedNodes: Set<string> = new Set()
): { nodes: Node[]; edges: Edge[] } => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    const nodeIds = new Set<string>();

    schemas.forEach((schema, name) => {
        const title = schema.title || schema.$id || name;
        const isRoot = !relationships.some(r => r.to === name);
        const isExpanded = expandedNodes.has(name);
        const entityType = extractEntityType(name);

        const properties: string[] = [];
        if (schema.properties) {
            Object.keys(schema.properties).forEach(key => {
                const prop = schema.properties[key];
                const type = prop.type || 'any';
                properties.push(`${key}: ${type}`);
            });
        }

        nodes.push({
            id: name,
            type: 'schemaNode',
            data: {
                label: title,
                schemaName: name,
                isRoot,
                isExpanded,
                properties,
                schemaData: schema,
                entityType,
            },
            position: { x: 0, y: 0 },
        });
        nodeIds.add(name);
    });

    const edgeIds = new Set<string>();
    let matchedCount = 0;
    let unmatchedCount = 0;

    const relationshipGroups = new Map<string, SchemaRelationship[]>();
    relationships.forEach((rel) => {
        const key = `${rel.from}-${rel.to}`;
        if (!relationshipGroups.has(key)) {
            relationshipGroups.set(key, []);
        }
        relationshipGroups.get(key)!.push(rel);
    });

    relationshipGroups.forEach((rels) => {
        const rel = rels[0];

        const fromNode = nodeIds.has(rel.from) ? rel.from :
            Array.from(nodeIds).find(id => id.endsWith(rel.from)) || rel.from;
        const toNode = nodeIds.has(rel.to) ? rel.to :
            Array.from(nodeIds).find(id => id.endsWith(rel.to)) || rel.to;

        if (nodeIds.has(fromNode) && nodeIds.has(toNode)) {
            const edgeId = `${fromNode}-${toNode}`;
            if (!edgeIds.has(edgeId)) {
                let edgeColor: string;
                let edgeWidth: number;
                let edgeType: 'one-to-one' | 'one-to-many' | 'multiple';

                if (rels.length > 1) {
                    edgeColor = '#12a525ff';
                    edgeWidth = 2.5;
                    edgeType = 'multiple';
                } else if (rel.type === 'one-to-many') {
                    edgeColor = '#ff9800';
                    edgeWidth = 2;
                    edgeType = 'one-to-many';
                } else {
                    edgeColor = '#61dafb';
                    edgeWidth = 1;
                    edgeType = 'one-to-one';
                }

                edges.push({
                    id: edgeId,
                    source: fromNode,
                    target: toNode,
                    animated: true,
                    style: {
                        stroke: edgeColor,
                        strokeWidth: edgeWidth
                    },
                    data: {
                        type: edgeType,
                        propertyNames: rels.map(r => r.propertyName).filter(Boolean),
                        count: rels.length
                    }
                });
                edgeIds.add(edgeId);
                matchedCount++;
            }
        } else {
            unmatchedCount++;
        }
    });

    return { nodes, edges };
};
