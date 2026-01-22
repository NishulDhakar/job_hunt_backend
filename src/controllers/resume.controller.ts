import { Request, Response } from 'express';
import extractText from '../utils/extractText';
import redis from '../services/redis.service';

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

    const text = await extractText(req.file.path, req.file.mimetype);
    console.log("🧠 Text extracted, length:", text.length);

    await redis.set(`resume:${userId}`, text);
    console.log("🟢 Resume saved to Redis:", `resume:${userId}`);

    res.json({ success: true, message: "Resume uploaded and processed successfully" });

  } catch (error: any) {
    console.error("🔥 Upload resume failed:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
