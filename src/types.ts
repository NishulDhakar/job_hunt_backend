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

// Enhanced MatchScore interface with LangChain structured output
export interface MatchScore {
    score: number;
    reason: string;
    strengths?: string[];      // Key matching points (2-3 items)
    gaps?: string[];           // Areas for improvement (1-2 items)
    recommendation?: string;   // Actionable advice
}

// Skills extracted from resume or job description
export interface Skills {
    technical: string[];       // Technical skills (React, Node.js, Python, etc.)
    soft: string[];            // Soft skills (Leadership, Communication, etc.)
    tools: string[];           // Tools/platforms (Git, Docker, AWS, etc.)
    industries: string[];      // Industry experience (Finance, Healthcare, etc.)
}

export interface ChatResponse {
    jobs: Job[];
    explanation: string;
}
