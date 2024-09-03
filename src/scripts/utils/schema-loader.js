import { promises as fs } from 'fs';

export const loadSchemaFile = async(path) => {
    try {
        const data = await fs.readFile(`.github/schemas/${path}`, 'utf8');
        const jsonData = JSON.parse(data);
        
        return jsonData;
    } catch (error) {
        console.error('Error reading JSON file:', error);
    }
}