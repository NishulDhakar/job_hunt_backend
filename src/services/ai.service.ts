import { ChatGroq } from '@langchain/groq';
import { PromptTemplate } from '@langchain/core/prompts';
import { StructuredOutputParser } from '@langchain/core/output_parsers';
import { z } from 'zod';
import { MatchScore, ChatResponse, Job } from '../types';

/**
 * Zod schema for job match analysis
 * Ensures structured, type-safe responses from LLM
 */
const matchScoreSchema = z.object({
    score: z.number().min(0).max(100).describe('Match percentage between 0-100 based on skills, experience, education, and keywords'),
    reason: z.string().describe('One concise sentence explaining the overall match quality'),
    strengths: z.array(z.string()).length(3).describe('Exactly 3 key strengths showing why the candidate is a good match'),
    gaps: z.array(z.string()).min(1).max(2).describe('1-2 areas where the candidate could improve or lacks requirements'),
    recommendation: z.string().describe('One actionable sentence advising how to improve candidacy or emphasize strengths')
});

/**
 * Initialize LangChain ChatGroq model
 */
const initChatModel = () => {
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
        throw new Error('GROQ_API_KEY not configured');
    }

    return new ChatGroq({
        apiKey,
        model: 'llama-3.3-70b-versatile',
        temperature: 0.7,
        maxTokens: 800,
    });
};

/**
 * LangChain-powered job match scoring with structured output
 * Provides detailed analysis including strengths, gaps, and recommendations
 */
export const getMatchScore = async (resumeText: string, jobDescription: string): Promise<MatchScore> => {
    try {
        // Initialize the output parser
        const parser = StructuredOutputParser.fromZodSchema(matchScoreSchema);

        // Get format instructions for the LLM
        const formatInstructions = parser.getFormatInstructions();

        // Create the prompt template
        const promptTemplate = PromptTemplate.fromTemplate(`
You are an expert career advisor and ATS (Applicant Tracking System) specialist with 15+ years of experience in resume analysis and job matching.

Analyze the following resume against the job requirements and provide a comprehensive match analysis.

RESUME SUMMARY:
{resumeText}

JOB REQUIREMENTS:
{jobDescription}

Your analysis should include:
1. **Match Score (0-100)**: Calculate based on:
   - Skills alignment (40%)
   - Experience relevance (30%)
   - Education requirements (20%)
   - Keywords matching (10%)

2. **Overall Reason**: One clear, concise sentence explaining the match quality

3. **Strengths**: Identify exactly 3 key points showing why this candidate is a strong match
   - Be specific with years of experience, technologies, or achievements
   - Reference actual items from the resume

4. **Gaps**: Identify 1-2 areas where the candidate falls short
   - Focus on meaningful gaps, not minor details
   - If the match is very strong, mention "nice to have" improvements

5. **Recommendation**: One actionable sentence on how to improve their application or emphasize their strengths

Be honest but encouraging. Focus on actionable insights.

{formatInstructions}
`);

        // Format the prompt with actual data
        const prompt = await promptTemplate.format({
            resumeText: resumeText.substring(0, 1500),
            jobDescription: jobDescription.substring(0, 1500),
            formatInstructions
        });

        // Initialize chat model
        const model = initChatModel();

        // Get response from LLM
        const response = await model.invoke(prompt);

        // Parse the structured output
        const result = await parser.parse(response.content as string);

        return {
            score: Math.min(100, Math.max(0, result.score)),
            reason: result.reason,
            strengths: result.strengths,
            gaps: result.gaps,
            recommendation: result.recommendation
        };

    } catch (error: any) {
        console.error('❌ LangChain Match Score Error:', error.message);

        // Fallback to basic response if LangChain fails
        return {
            score: 75,
            reason: 'Unable to perform detailed analysis at this time. Your profile shows general alignment with the position.',
            strengths: [
                'Relevant industry experience',
                'Core technical skills present',
                'Professional background matches role level'
            ],
            gaps: ['Detailed analysis unavailable'],
            recommendation: 'Review the job description carefully and tailor your application to highlight relevant experience.'
        };
    }
};

/**
 * Legacy chat assistant (keeping existing implementation)
 * TODO: Could be enhanced with LangChain as well
 */
export const chatAssistant = async (jobs: Job[], userQuery: string): Promise<ChatResponse> => {
    try {
        const model = initChatModel();

        const jobContext = jobs.slice(0, 8).map(j =>
            `- ${j.title} at ${j.company} (${j.location}) - ${j.salary || 'Salary not disclosed'}`
        ).join('\\n');

        const promptTemplate = PromptTemplate.fromTemplate(`
You are an expert career advisor and job search consultant with 15+ years of experience.

AVAILABLE POSITIONS:
{jobContext}

USER QUESTION:
"{userQuery}"

Provide a helpful, professional response that:
1. Directly addresses their question
2. Offers specific, actionable advice
3. References relevant jobs from the list when applicable
4. Is encouraging but realistic
5. Keeps response concise (3-4 sentences max)

Respond naturally in plain text, no JSON formatting needed.
`);

        const prompt = await promptTemplate.format({
            jobContext: jobContext || 'Currently loading job listings...',
            userQuery
        });

        const response = await model.invoke(prompt);

        return {
            jobs: [],
            explanation: response.content as string
        };

    } catch (error: any) {
        console.error('❌ Chat Assistant Error:', error.message);
        return {
            jobs: [],
            explanation: "I'd be happy to help with your job search. Could you provide more details about what you're looking for?"
        };
    }
};
