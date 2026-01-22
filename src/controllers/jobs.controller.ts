import { Request, Response } from 'express';
import { getJobs } from '../services/joinrise.service';
import redis from '../services/redis.service';
import { Job } from '../types';

export const fetchJobs = async (req: Request, res: Response) => {
    try {

        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;

        const cacheKey = `jobs_joinrise:page_${page}:limit_${limit}`;


        const cachedJobs = await redis.get<Job[]>(cacheKey);

        if (cachedJobs && Array.isArray(cachedJobs) && cachedJobs.length > 0) {
            console.log(`✅ Serving ${cachedJobs.length} jobs from cache (page ${page})`);
            return res.json({
                success: true,
                source: "cache",
                page,
                limit,
                data: cachedJobs
            });
        }

        console.log(`🔍 Fetching fresh jobs from JoinRise - Page: ${page}, Limit: ${limit}`);
        const jobs = await getJobs(page, limit);

        if (jobs && jobs.length > 0) {
            await redis.set(cacheKey, jobs, { ex: 1800 });
            console.log(`💾 Cached ${jobs.length} jobs for page ${page}`);
        }

        return res.json({
            success: true,
            source: "api",
            page,
            limit,
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
