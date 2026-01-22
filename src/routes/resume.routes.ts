import { Router } from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { uploadResume } from "../controllers/resume.controller";

const router = Router();

const uploadDir = path.join(process.cwd(), "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const upload = multer({
  dest: uploadDir,
  limits: { fileSize: 5 * 1024 * 1024 }
});

router.post("/upload-resume", upload.single("resume"), uploadResume);

export default router;
