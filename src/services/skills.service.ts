import { ChatGroq } from '@langchain/groq';
import { PromptTemplate } from '@langchain/core/prompts';
import { StructuredOutputParser } from '@langchain/core/output_parsers';
import { z } from 'zod';
import { Skills } from '../types';

const skillsSchema = z.object({
    technical: z.array(z.string()).describe('Technical skills like programming languages, frameworks, databases'),
    soft: z.array(z.string()).describe('Soft skills like leadership, communication, problem-solving'),
    tools: z.array(z.string()).describe('Tools and platforms like Git, Docker, AWS, Jira'),
    industries: z.array(z.string()).describe('Industries or domains like Finance, Healthcare, E-commerce, SaaS')
});

const initChatModel = () => {
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
        throw new Error('GROQ_API_KEY not configured');
    }

    return new ChatGroq({
        apiKey,
        model: 'llama-3.3-70b-versatile',
        temperature: 0.3,  // Lower temperature for more consistent extraction
        maxTokens: 600,
    });
};

export const extractSkillsFromResume = async (resumeText: string): Promise<Skills> => {
    try {
        const parser = StructuredOutputParser.fromZodSchema(skillsSchema);
        const formatInstructions = parser.getFormatInstructions();

        const promptTemplate = PromptTemplate.fromTemplate(`
You are an expert resume parser and ATS specialist.

Extract ALL skills from this resume and categorize them accurately.

RESUME:
{resumeText}

Instructions:
1. **Technical Skills**: Programming languages (JavaScript, Python, Java), frameworks (React, Angular, Django), databases (PostgreSQL, MongoDB), methodologies (Agile, TDD)
2. **Soft Skills**: Leadership, Communication, Problem Solving, Team Collaboration, Time Management
3. **Tools**: Development tools (Git, Docker, Jenkins), cloud platforms (AWS, Azure, GCP), project management (Jira, Trello)
4. **Industries**: Specific domains mentioned like Finance, Healthcare, E-commerce, SaaS, EdTech

Be thorough and extract EVERY skill mentioned. Include variations (e.g., "Node.js" and "Node").

{formatInstructions}
`);

        const prompt = await promptTemplate.format({
            resumeText: resumeText.substring(0, 3000),
            formatInstructions
        });

        const model = initChatModel();
        const response = await model.invoke(prompt);
        const result = await parser.parse(response.content as string);

        // Normalize skills (lowercase, deduplicate)
        return {
            technical: [...new Set(result.technical.map(s => s.toLowerCase()))],
            soft: [...new Set(result.soft.map(s => s.toLowerCase()))],
            tools: [...new Set(result.tools.map(s => s.toLowerCase()))],
            industries: [...new Set(result.industries.map(s => s.toLowerCase()))]
        };

    } catch (error: any) {
        console.error('❌ Skill Extraction Error:', error.message);

        // Fallback: basic keyword extraction
        return extractSkillsBasic(resumeText);
    }
};

export const extractSkillsFromJob = async (jobDescription: string): Promise<Skills> => {
    try {
        const parser = StructuredOutputParser.fromZodSchema(skillsSchema);
        const formatInstructions = parser.getFormatInstructions();

        const promptTemplate = PromptTemplate.fromTemplate(`
You are an expert job description analyzer.

Extract ALL required and preferred skills from this job posting.

JOB DESCRIPTION:
{jobDescription}

Instructions:
1. **Technical Skills**: Required technologies, programming languages, frameworks
2. **Soft Skills**: Required soft skills like leadership, communication
3. **Tools**: Required tools and platforms
4. **Industries**: Industry experience mentioned

Extract both REQUIRED and PREFERRED skills.

{formatInstructions}
`);

        const prompt = await promptTemplate.format({
            jobDescription: jobDescription.substring(0, 2000),
            formatInstructions
        });

        const model = initChatModel();
        const response = await model.invoke(prompt);
        const result = await parser.parse(response.content as string);

        // Normalize skills
        return {
            technical: [...new Set(result.technical.map(s => s.toLowerCase()))],
            soft: [...new Set(result.soft.map(s => s.toLowerCase()))],
            tools: [...new Set(result.tools.map(s => s.toLowerCase()))],
            industries: [...new Set(result.industries.map(s => s.toLowerCase()))]
        };

    } catch (error: any) {
        console.error('❌ Job Skill Extraction Error:', error.message);
        return extractSkillsBasic(jobDescription);
    }
};

export const calculateSkillMatch = (resumeSkills: Skills, jobSkills: Skills): number => {
    // Flatten all skills into arrays
    const resumeAll = [
        ...resumeSkills.technical,
        ...resumeSkills.soft,
        ...resumeSkills.tools,
        ...resumeSkills.industries
    ];

    const jobAll = [
        ...jobSkills.technical,
        ...jobSkills.soft,
        ...jobSkills.tools,
        ...jobSkills.industries
    ];

    if (jobAll.length === 0) return 100; // No requirements = everyone matches
    if (resumeAll.length === 0) return 0; // No skills = no match

    // Count matching skills
    let matches = 0;
    for (const jobSkill of jobAll) {
        // Check for exact match or partial match
        const hasMatch = resumeAll.some(resumeSkill =>
            resumeSkill.includes(jobSkill) || jobSkill.includes(resumeSkill)
        );
        if (hasMatch) matches++;
    }

    // Calculate percentage
    const matchPercentage = (matches / jobAll.length) * 100;
    return Math.round(matchPercentage);
};

const extractSkillsBasic = (text: string): Skills => {
    const lowerText = text.toLowerCase();

    const technicalKeywords = ['javascript', 'typescript', 'python', 'java', 'react', 'angular', 'vue', 'node.js', 'express', 'django', 'flask', 'sql', 'mongodb', 'postgresql'];
    const softKeywords = ['leadership', 'communication', 'problem solving', 'teamwork', 'collaboration', 'time management'];
    const toolKeywords = ['git', 'github', 'docker', 'kubernetes', 'aws', 'azure', 'gcp', 'jira', 'jenkins'];
    const industryKeywords = ['finance', 'healthcare', 'e-commerce', 'saas', 'fintech', 'edtech'];

    return {
        technical: technicalKeywords.filter(k => lowerText.includes(k)),
        soft: softKeywords.filter(k => lowerText.includes(k)),
        tools: toolKeywords.filter(k => lowerText.includes(k)),
        industries: industryKeywords.filter(k => lowerText.includes(k))
    };
};
