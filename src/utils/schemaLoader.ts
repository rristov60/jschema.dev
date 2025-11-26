import $RefParser from '@apidevtools/json-schema-ref-parser';

const DEFAULT_BASE_URL = 'https://plannerschemas.blob.core.windows.net/schemas';

export interface SchemaFile {
    name: string;
    url: string;
    lastModified: string;
}

export const fetchSchemaList = async (baseUrl: string = DEFAULT_BASE_URL): Promise<SchemaFile[]> => {
    try {
        let listUrl = baseUrl;
        if (!baseUrl.includes('?restype=container&comp=list')) {
            const cleanUrl = baseUrl.split('?')[0];
            listUrl = `${cleanUrl}?restype=container&comp=list`;
        }

        const response = await fetch(listUrl);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const text = await response.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(text, 'text/xml');

        const parseError = xmlDoc.getElementsByTagName('parsererror');
        if (parseError.length > 0) {
            throw new Error('Failed to parse XML response');
        }

        const blobs = xmlDoc.getElementsByTagName('Blob');
        const schemas: SchemaFile[] = [];

        const baseUrlForFiles = baseUrl.split('?')[0].replace(/\/$/, '');

        for (let i = 0; i < blobs.length; i++) {
            const blob = blobs[i];
            const name = blob.getElementsByTagName('Name')[0]?.textContent || '';
            const lastModified = blob.getElementsByTagName('Last-Modified')[0]?.textContent || '';
            if (name.endsWith('.json')) {
                schemas.push({
                    name,
                    url: `${baseUrlForFiles}/${name}`,
                    lastModified,
                });
            }
        }

        if (schemas.length === 0) {
            throw new Error('No JSON schemas found at this URL');
        }

        return schemas;
    } catch (error: any) {
        console.error('Error fetching schema list:', error);
        throw error;
    }
};

export const fetchAndResolveSchema = async (url: string): Promise<any> => {
    try {
        const schema = await $RefParser.dereference(url);
        return schema;
    } catch (error: any) {
        console.error('Error resolving schema:', error);
        throw error;
    }
};

export const fetchRawSchema = async (url: string): Promise<any> => {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const schema = await response.json();
        return schema;
    } catch (error: any) {
        console.error('Error fetching raw schema:', error);
        throw error;
    }
};
