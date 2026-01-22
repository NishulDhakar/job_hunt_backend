import { Job } from '../types';

const normalizeJob = (job: any): Job => {
    // Check if it's JSearch format (snake_case) or Adzuna/Generic (camelCase or specific fields)
    const isJSearch = job.job_id !== undefined;

    if (isJSearch) {
        return {
            id: job.job_id,
            title: job.job_title || 'Unknown Title',
            company: job.employer_name || 'Unknown Company',
            description: job.job_description || 'No description available',
            location: `${job.job_city || ''}, ${job.job_country || ''}`.replace(/^, /, '') || 'Remote',
            jobType: job.job_employment_type || 'Full-time',
            workMode: job.job_is_remote ? 'Remote' : 'On-site',
            salary: 'Not disclosed', // JSearch often doesn't give clean salary range strings easily in free tier, keep simple
            url: job.job_apply_link || job.job_google_link || '#',
            postedAt: job.job_posted_at_datetime_utc || new Date().toISOString(),
            // Pass through other raw data if needed
            ...job
        };
    }

    // Fallback/Adzuna Adapter (existing logic)
    return {
        id: job.id || job.adref || Math.random().toString(36).substring(7),
        title: job.title || 'Unknown Title',
        company: job.company?.display_name || job.company || 'Unknown Company',
        description: job.description || 'No description available',
        location: job.location?.display_name || job.location || 'Remote',
        jobType: job.contract_time || 'Full-time',
        workMode: job.contract_type || 'Remote',
        salary: job.salary_min ? `${job.salary_min} - ${job.salary_max}` : 'Not disclosed',
        url: job.url || job.redirect_url || '#',
        postedAt: job.created || job.posted_at || new Date().toISOString()
    };
};

export default normalizeJob;
