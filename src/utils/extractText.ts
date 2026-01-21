const pdf = require('pdf-parse');
import fs from 'fs';

const extractText = async (filePath: string, mimetype: string): Promise<string> => {
    try {
        if (mimetype === 'application/pdf') {
            const dataBuffer = fs.readFileSync(filePath);
            const data = await pdf(dataBuffer);
            return data.text;
        } else if (mimetype === 'text/plain') {
            return fs.readFileSync(filePath, 'utf8');
        } else {
            throw new Error('Unsupported file type. Please upload PDF or TXT.');
        }
    } catch (error) {
        console.error('Text Extraction Error:', error);
        throw new Error('Failed to parse file content.');
    } finally {
        // Cleanup file after extraction
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    }
};

export default extractText;
