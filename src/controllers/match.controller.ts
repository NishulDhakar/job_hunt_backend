import { Request, Response } from 'express';
import redis from '../services/redis.service';
import { getMatchScore } from '../services/ai.service';
import { getJobs } from '../services/joinrise.service';
import { extractSkillsFromJob, calculateSkillMatch } from '../services/skills.service';
import { Job, Skills } from '../types';

export const scoreJobs = async (req: Request, res: Response) => {
    try {
        const { userId, jobs: submittedJobs } = req.body;
        if (!userId) {
            return res.status(400).json({ success: false, message: 'UserId is required' });
        }

        const resumeText = await redis.get<string>(`resume:${userId}`);
        if (!resumeText) {
            return res.status(404).json({ success: false, message: 'Resume not found. Please upload one first.' });
        }

        // Get user skills from Redis
        const userSkills = await redis.get<Skills>(`skills:${userId}`);
        if (!userSkills) {
            return res.status(404).json({ success: false, message: 'Skills not extracted. Please re-upload your resume.' });
        }

        const SKILL_MATCH_THRESHOLD = parseInt(process.env.SKILL_MATCH_THRESHOLD || '20');

        let jobs = submittedJobs;

        if (!jobs || !Array.isArray(jobs) || jobs.length === 0) {
            // Try to get from updated cache key for JoinRise API
            jobs = await redis.get<Job[]>('jobs_joinrise:page_1:limit_20');
        }

        if (!jobs || !Array.isArray(jobs) || jobs.length === 0) {
            // Fallback to old cache keys for backward compatibility
            jobs = await redis.get<Job[]>('jobs_v2:default:default');
        }

        if (!jobs || !Array.isArray(jobs) || jobs.length === 0) {
            // Fetch fresh jobs from JoinRise API (get more for better filtering)
            console.log('No cached jobs found, fetching fresh jobs from JoinRise...');
            jobs = await getJobs(1, 100); // Get 100 jobs for filtering
        }

        if (!jobs || jobs.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No jobs available to score. Please browse jobs first or wait for job data to load.'
            });
        }

        console.log(`📊 Filtering ${jobs.length} jobs by skill match (threshold: ${SKILL_MATCH_THRESHOLD}%)`);

        // Filter jobs by skill match
        const jobsWithMatch: Array<Job & { skillMatch: number }> = [];

        for (const job of jobs) {
            const jobSkills = await extractSkillsFromJob(job.description || job.title);
            const skillMatch = calculateSkillMatch(userSkills, jobSkills);

            if (skillMatch >= SKILL_MATCH_THRESHOLD) {
                jobsWithMatch.push({ ...job, skillMatch });
            }
        }

        // Sort by skill match percentage (highest first)
        jobsWithMatch.sort((a, b) => b.skillMatch - a.skillMatch);

        console.log(`✅ Found ${jobsWithMatch.length} jobs matching skills (≥${SKILL_MATCH_THRESHOLD}%)`);

        if (jobsWithMatch.length === 0) {
            return res.json({
                success: true,
                data: [],
                message: `No jobs found matching your skills. Try lowering the match threshold or update your resume.`
            });
        }

        const scoredJobs: any[] = [];

        // Score top 5 matching jobs
        const jobsToScore = jobsWithMatch.slice(0, 5);

        for (const job of jobsToScore) {
            const matchData = await getMatchScore(resumeText, job.description || job.title);
            scoredJobs.push({
                ...job,
                matchScore: matchData.score,
                matchReason: matchData.reason ? [matchData.reason] : ['AI analysis complete'],
                strengths: matchData.strengths || [],
                gaps: matchData.gaps || [],
                recommendation: matchData.recommendation || ''
            });
        }


        await redis.set(`scores:${userId}`, scoredJobs, { ex: 3600 });

        res.json({ success: true, data: scoredJobs });
    } catch (error: any) {
        console.error('Score jobs error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};


export const getScoredJobs = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        if (!userId) {
            return res.status(400).json({ success: false, message: 'UserId is required' });
        }


        const resumeText = await redis.get<string>(`resume:${userId}`);
        const hasResume = !!resumeText;


        const scoredJobs = await redis.get<Job[]>(`scores:${userId}`);

        res.json({
            success: true,
            data: {
                hasResume,
                hasScored: !!scoredJobs && scoredJobs.length > 0,
                jobs: scoredJobs || []
            }
        });
    } catch (error: any) {
        console.error('Get scored jobs error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
