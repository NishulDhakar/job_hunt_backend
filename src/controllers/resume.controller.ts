import { Request, Response } from 'express';
import extractText from '../utils/extractText';
import redis from '../services/redis.service';

export const uploadResume = async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            console.warn('⚠️ Upload attempt with no file');
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        console.log(`📂 Processing file: ${req.file.originalname} (${req.file.mimetype})`);

        const userId = req.body.userId || 'guest';
        const text = await extractText(req.file.path, req.file.mimetype);

        if (!text) {
            throw new Error('Failed to extract text from file.');
        }

        console.log(`✅ Text extracted (${text.length} chars). Saving to Redis...`);

        // Save resume text to Redis
        const cached = await redis.set(`resume:${userId}`, text);

        if (!cached) {
            console.warn(`⚠️ Failed to cache resume for user: ${userId}. Redis might be down.`);
            // You might want to return text back to client if redis failed, 
            // so client can send it in next request, but for now just warn.
        } else {
            console.log(`✅ Resume cached for user: ${userId}`);
        }

        res.json({
            success: true,
            message: 'Resume uploaded and processed successfully',
            data: {
                fileName: req.file.originalname,
                textPreview: text.substring(0, 100) + '...'
            }
        });

    } catch (error: any) {
        console.error('❌ Upload Error:', error);
        res.status(500).json({ success: false, message: error.message || 'Internal Server Error' });
    }
};
