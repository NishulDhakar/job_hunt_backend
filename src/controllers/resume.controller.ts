import { Request, Response } from 'express';
import extractText from '../utils/extractText';
import redis from '../services/redis.service';
import { extractSkillsFromResume } from '../services/skills.service';

export const uploadResume = async (req: Request, res: Response) => {
  try {
    console.log("📥 Upload hit");

    if (!req.file) {
      console.log("❌ No file received");
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const userId = req.body.userId || "guest";
    console.log("👤 User:", userId);
    console.log("📄 File:", req.file.path);

    // Extract text from PDF
    const text = await extractText(req.file.path, req.file.mimetype);
    console.log("🧠 Text extracted, length:", text.length);

    // Extract skills using LangChain
    console.log("🔍 Extracting skills...");
    const skills = await extractSkillsFromResume(text);
    console.log("✅ Skills extracted:", {
      technical: skills.technical.length,
      soft: skills.soft.length,
      tools: skills.tools.length,
      industries: skills.industries.length
    });

    // Store both resume text and skills in Redis
    await redis.set(`resume:${userId}`, text);
    await redis.set(`skills:${userId}`, skills);
    console.log("🟢 Resume and skills saved to Redis");

    res.json({
      success: true,
      message: "Resume uploaded and processed successfully",
      skills  // Return skills to frontend
    });

  } catch (error: any) {
    console.error("🔥 Upload resume failed:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
