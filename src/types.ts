export interface Job {
    id: string;
    title: string;
    company: string;
    description: string;
    location: string;
    jobType: string;
    workMode: string;
    salary: string;
    url: string;
    // Allow for other properties from raw APIs
    [key: string]: any;
}

export interface Application {
    jobId: string;
    title: string;
    company: string;
    status: string;
    timestamp: string;
    notes?: string;
}

export interface MatchScore {
    score: number;
    reason: string;
}

export interface ChatResponse {
    jobs: Job[];
    explanation: string;
}
