import { Router } from "express";
import upload from "../config/multer";
import { uploadResume } from "../controllers/resume.controller";

const router = Router();

router.post("/upload-resume", upload.single("resume"), uploadResume);

export default router;
