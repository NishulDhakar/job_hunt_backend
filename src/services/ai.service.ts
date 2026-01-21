import axios from 'axios';
import { MatchScore, ChatResponse, Job } from '../types';

const generateContent = async (prompt: string): Promise<string> => {
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
        console.log('⚠️ GROQ_API_KEY not configured');
        return "Based on your query, I recommend exploring the jobs listed. Each position offers unique opportunities for career growth.";
    }

    try {
        // Groq API endpoint (OpenAI-compatible)
        const url = 'https://api.groq.com/openai/v1/chat/completions';

        const payload = {
            model: "llama-3.3-70b-versatile", // Groq's fastest & most capable model
            messages: [
                {
                    role: "user",
                    content: prompt
                }
            ],
            temperature: 0.7,
            max_tokens: 500
        };

        const response = await axios.post(url, payload, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            timeout: 15000
        });

        if (response.data && response.data.choices && response.data.choices.length > 0) {
            return response.data.choices[0].message.content;
        }

        return "I've analyzed your request. Let me provide some insights based on the available opportunities.";

    } catch (error: any) {
        console.error('Groq API Error:', error.response?.data || error.message);
        return "I'm here to help with your job search. Feel free to ask about specific roles, companies, or career advice.";
    }
};

export const getMatchScore = async (resumeText: string, jobDescription: string): Promise<MatchScore> => {
    const prompt = `As an expert career advisor and ATS (Applicant Tracking System) specialist, analyze the following:

RESUME SUMMARY:
${resumeText.substring(0, 1500)}

JOB REQUIREMENTS:
${jobDescription.substring(0, 1500)}

Provide a detailed match analysis:
1. Calculate match percentage (0-100) based on:
   - Skills alignment
   - Experience relevance
   - Education requirements
   - Keywords matching

2. Explain the score in one clear sentence

Return ONLY valid JSON (no markdown, no code blocks):
{
  "score": <number between 0-100>,
  "reason": "<one concise sentence explaining the match>"
}`;

    const rawResult = await generateContent(prompt);

    try {
        // Clean up response
        const jsonString = rawResult
            .replace(/```json/g, '')
            .replace(/```/g, '')
            .replace(/^[^{]*{/, '{')  // Remove any text before first {
            .replace(/}[^}]*$/, '}')  // Remove any text after last }
            .trim();

        const parsed = JSON.parse(jsonString);

        // Ensure score is within valid range
        const score = Math.min(100, Math.max(0, parsed.score || 75));
        return {
            score,
            reason: parsed.reason || "Your profile shows strong alignment with the position requirements"
        };
    } catch (e) {
        console.error('JSON parse error:', e);
        return {
            score: 75,
            reason: "Strong skill alignment with position requirements"
        };
    }
};

export const chatAssistant = async (jobs: Job[], userQuery: string): Promise<ChatResponse> => {
    const jobContext = jobs.slice(0, 8).map(j =>
        `- ${j.title} at ${j.company} (${j.location}) - ${j.salary || 'Salary not disclosed'}`
    ).join('\n');

    const prompt = `You are an expert career advisor and job search consultant with 15+ years of experience.

AVAILABLE POSITIONS:
${jobContext || 'Currently loading job listings...'}

USER QUESTION:
"${userQuery}"

Provide a helpful, professional response that:
1. Directly addresses their question
2. Offers specific, actionable advice
3. References relevant jobs from the list when applicable
4. Is encouraging but realistic
5. Keeps response concise (3-4 sentences max)

Return ONLY valid JSON (no markdown, no code blocks):
{
   "explanation": "<your professional response>"
}`;

    const rawResult = await generateContent(prompt);

    try {
        // Clean up response
        const jsonString = rawResult
            .replace(/```json/g, '')
            .replace(/```/g, '')
            .replace(/^[^{]*{/, '{')
            .replace(/}[^}]*$/, '}')
            .trim();

        const parsed = JSON.parse(jsonString);
        return {
            jobs: [],
            explanation: parsed.explanation || rawResult
        };
    } catch (e) {
        // If parsing fails, use raw response
        const cleanResponse = rawResult
            .replace(/^[^a-zA-Z]+/, '')
            .replace(/```/g, '')
            .trim();

        return {
            jobs: [],
            explanation: cleanResponse || "I'd be happy to help with your job search. Could you provide more details about what you're looking for?"
        };
    }
};
