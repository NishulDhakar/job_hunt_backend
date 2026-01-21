import axios from "axios";
import normalizeJob from "../utils/normalizeJob";
import { Job } from "../types";

export const getJobs = async (
    query: string = "developer",
    location: string = "remote"
): Promise<Job[]> => {
    try {
        const rapidKey = process.env.RAPID_API_KEY;
        const rapidHost = process.env.RAPID_API_HOST || "jsearch.p.rapidapi.com";

        if (!rapidKey) {
            console.log("⚠️ RAPID_API_KEY missing. Using Mock Data.");
            return getMockJobs();
        }

        const options = {
            method: "GET",
            url: "https://jsearch.p.rapidapi.com/search",
            params: {
                query: `${query} in ${location}`,
                page: "1",
                num_pages: "1",
                date_posted: "all",
            },
            headers: {
                "x-rapidapi-key": rapidKey,
                "x-rapidapi-host": rapidHost,
            },
            timeout: 10000, // 10 second timeout
        };

        const response = await axios.request(options);

        if (response.data && response.data.data) {
            console.log(`✅ Fetched ${response.data.data.length} jobs from JSearch`);
            return response.data.data.map(normalizeJob);
        }

        console.log("⚠️ No jobs in API response");
        return getMockJobs();
    } catch (error: any) {
        console.error("❌ JSearch API Error:", error.message);
        console.log("⚠️ Using mock data as fallback");
        return getMockJobs();
    }
};

const getMockJobs = (): Job[] => {
    return [
        {
            id: "mock-1",
            title: "Frontend Developer",
            company: "Tech Corp",
            description:
                "We are looking for a skilled Frontend Developer with experience in React, Node.js, and TailwindCSS. You will be responsible for building user interfaces and integrating with backend APIs.",
            location: "Remote",
            jobType: "Full-time",
            workMode: "Remote",
            salary: "100k - 120k",
            url: "#",
            postedAt: new Date().toISOString(),
        },
        {
            id: "mock-2",
            title: "Backend Engineer",
            company: "Data Systems",
            description:
                "Join our backend team to build scalable services using Node.js, Redis, and Postgres. Experience with microservices is a plus.",
            location: "New York, NY",
            jobType: "Full-time",
            workMode: "On-site",
            salary: "120k - 140k",
            url: "#",
            postedAt: new Date().toISOString(),
        },
    ].map((j) => normalizeJob(j));
};
