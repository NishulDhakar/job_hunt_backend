import express from 'express';
import { uploadResume } from '../controllers/resume.controller';
import upload from '../middleware/upload.middleware';

const router = express.Router();
router.post('/upload-resume', upload.single('resume'), uploadResume);

export default router;
