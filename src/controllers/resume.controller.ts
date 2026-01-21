import { Request, Response } from 'express';
import extractText from '../utils/extractText';
import redis from '../services/redis.service';

export const uploadResume = async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        const userId = req.body.userId || 'guest'; // specific user request param or default
        const text = await extractText(req.file.path, req.file.mimetype);

        // Save resume text to Redis
        await redis.set(`resume:${userId}`, text);

        res.json({ success: true, message: 'Resume uploaded and processed successfully' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
