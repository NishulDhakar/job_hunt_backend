import { Request, Response } from 'express';
import { getJobs } from '../services/jobApi.service';
import redis from '../services/redis.service';
import { Job } from '../types';

export const fetchJobs = async (req: Request, res: Response) => {
    try {
        const { query = "developer", location = "remote" } = req.query;
        const cacheKey = `jobs_v2:${query}:${location}`;

        // Check cache first for instant response
        const cachedJobs = await redis.get<Job[]>(cacheKey);

        if (cachedJobs && Array.isArray(cachedJobs) && cachedJobs.length > 0) {
            console.log(`✅ Serving ${cachedJobs.length} jobs from cache`);
            return res.json({
                success: true,
                source: "cache",
                data: cachedJobs
            });
        }

        // Fetch fresh jobs if not cached
        console.log(`🔍 Fetching fresh jobs for: ${query} in ${location}`);
        const jobs = await getJobs(query as string, location as string);

        // Cache for 30 minutes (1800 seconds)
        if (jobs && jobs.length > 0) {
            await redis.set(cacheKey, jobs, { ex: 1800 });
            console.log(`💾 Cached ${jobs.length} jobs`);
        }

        return res.json({
            success: true,
            source: "api",
            data: jobs
        });
    } catch (err) {
        console.error('Fetch jobs error:', err);
        res.status(500).json({
            success: false,
            message: "Failed to fetch jobs"
        });
    }
};
