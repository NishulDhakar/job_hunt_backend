import { Request, Response } from 'express';
import { chatAssistant } from '../services/ai.service';
import { getJobs } from '../services/jobApi.service';

export const chat = async (req: Request, res: Response) => {
    try {
        const { message, userId } = req.body;

        if (!message) {
            return res.status(400).json({ success: false, message: 'Message is required' });
        }


        const jobs = await getJobs();

        const response = await chatAssistant(jobs, message);

        res.json({ success: true, data: response });
    } catch (error: any) {
        console.error('Chat error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to process chat request',
            data: {
                explanation: "I'm having trouble processing your request right now. Please try again."
            }
        });
    }
};
