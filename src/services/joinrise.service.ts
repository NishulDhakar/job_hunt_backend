import axios from "axios";
import { Job } from "../types";

const JOINRISE_BASE_URL = "https://api.joinrise.io/api/v1/jobs/public";

export const getJobs = async (
    page: number = 1,
    limit: number = 20
): Promise<Job[]> => {
    try {
        console.log(`🔍 Fetching jobs from JoinRise API - Page: ${page}, Limit: ${limit}`);

        const response = await axios.get(JOINRISE_BASE_URL, {
            params: {
                page,
                limit,
            },
            timeout: 10000,
        });

        const rawJobs = response.data?.result?.jobs || response.data?.data || response.data?.jobs || [];

        if (!Array.isArray(rawJobs)) {
            console.warn("⚠️ JoinRise API returned non-array data");
            return [];
        }

        console.log(`✅ Fetched ${rawJobs.length} jobs from JoinRise API`);


        return rawJobs.map(normalizeJoinRiseJob);
    } catch (error: any) {
        console.error("❌ JoinRise API Error:", error.message);

        if (error.response) {
            console.error(`Response Status: ${error.response.status}`);
            console.error(`Response Data:`, error.response.data);
        }


        return [];
    }
};

const normalizeJoinRiseJob = (job: any): Job => {
    const currentDate = new Date().toISOString();

    const companyName = job.owner?.companyName || job.company || "Company Not Disclosed";

    const location = job.locationAddress || job.location || "Remote";
    let salary = "Not disclosed";
    if (job.descriptionBreakdown?.salaryRangeMinYearly && job.descriptionBreakdown?.salaryRangeMaxYearly) {
        const min = job.descriptionBreakdown.salaryRangeMinYearly.toLocaleString();
        const max = job.descriptionBreakdown.salaryRangeMaxYearly.toLocaleString();
        salary = `$${min} - $${max}`;
    } else if (job.salary || job.salary_range || job.compensation) {
        salary = job.salary || job.salary_range || job.compensation;
    }

    return {
        id: job._id || job.id || Math.random().toString(36).substring(7),
        title: job.title || "Untitled Position",
        company: companyName,
        description: job.descriptionBreakdown?.oneSentenceJobSummary || job.description || "No description available",
        location: location,

        jobType: job.descriptionBreakdown?.employmentType || job.type || job.employment_type || "Full-time",
        workMode: job.descriptionBreakdown?.workModel || job.type || "Not specified",

        salary: salary,
        postedAt: job.createdAt || job.updatedAt || job.posted_at || currentDate,

        url: job.url || "#",

        ...job,
    };
};
