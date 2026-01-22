import { Request, Response } from 'express';
import redis from '../services/redis.service';
import { Application } from '../types';

export const applyJob = async (req: Request, res: Response) => {
    try {
        const { userId, jobId, title, company, userChoice } = req.body;

        if (userChoice !== 'Yes') {
            return res.json({ success: true, message: 'Job skipped' });
        }

        const key = `applications:${userId}`;
        const newApp: Application = {
            jobId,
            title,
            company,
            status: 'Applied',
            timestamp: new Date().toISOString()
        };

        const existingApps = await redis.get<Application[]>(key);
        let applications = existingApps || [];


        const index = applications.findIndex(app => app.jobId === jobId);
        if (index > -1) {
            applications[index] = { ...applications[index], ...newApp }; 
        } else {
            applications.push(newApp);
        }

        await redis.set(key, applications);

        res.json({ success: true, message: 'Applied successfully' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateStatus = async (req: Request, res: Response) => {
    try {
        const { userId, status } = req.body;
        const { jobId } = req.params;

        const key = `applications:${userId}`;
        const existingApps = await redis.get<Application[]>(key);

        if (!existingApps) return res.status(404).json({ success: false, message: 'No applications found' });

        let applications = existingApps;
        const index = applications.findIndex(app => app.jobId === jobId);

        if (index === -1) return res.status(404).json({ success: false, message: 'Application not found' });

        applications[index].status = status;
        await redis.set(key, applications);

        res.json({ success: true, data: applications[index] });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getApplications = async (req: Request, res: Response) => {
    try {
        const { userId } = req.query; // or auth token
        const key = `applications:${userId}`;
        const apps = await redis.get<Application[]>(key);
        res.json({ success: true, data: apps || [] });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
