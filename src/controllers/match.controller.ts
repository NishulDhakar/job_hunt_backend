import { Request, Response } from 'express';
import redis from '../services/redis.service';
import { getMatchScore } from '../services/ai.service';
import { getJobs } from '../services/jobApi.service';
import { Job } from '../types';

export const scoreJobs = async (req: Request, res: Response) => {
    try {
        const { userId } = req.body;
        if (!userId) {
            return res.status(400).json({ success: false, message: 'UserId is required' });
        }

        const resumeText = await redis.get<string>(`resume:${userId}`);
        if (!resumeText) {
            return res.status(404).json({ success: false, message: 'Resume not found. Please upload one first.' });
        }

        // Try to get jobs from different cache keys or fetch fresh ones
        let jobs = await redis.get<Job[]>('jobs_v2:default:default');
        
        if (!jobs || !Array.isArray(jobs) || jobs.length === 0) {
            // Try alternative cache key
            jobs = await redis.get<Job[]>('jobs:default:default');
        }

        if (!jobs || !Array.isArray(jobs) || jobs.length === 0) {
            // Fetch fresh jobs if nothing in cache
            console.log('No cached jobs found, fetching fresh jobs...');
            jobs = await getJobs();
        }

        if (!jobs || jobs.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'No jobs available to score. Please browse jobs first or wait for job data to load.' 
            });
        }

        console.log(`Scoring ${jobs.length} jobs for user ${userId}`);

        const scoredJobs: any[] = [];

        // LIMIT to 5 jobs for performance (can be increased)
        const jobsToScore = jobs.slice(0, 5);

        for (const job of jobsToScore) {
            const matchData = await getMatchScore(resumeText, job.description || job.title);
            scoredJobs.push({
                ...job,
                matchScore: matchData.score,
                matchReason: matchData.reason ? [matchData.reason] : ['AI analysis complete']
            });
        }

        // Save scores
        await redis.set(`scores:${userId}`, scoredJobs, { ex: 3600 }); // Cache for 1 hour

        res.json({ success: true, data: scoredJobs });
    } catch (error: any) {
        console.error('Score jobs error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
