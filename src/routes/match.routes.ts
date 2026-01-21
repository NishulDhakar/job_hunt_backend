import express from 'express';
import { scoreJobs } from '../controllers/match.controller';

const router = express.Router();
router.post('/score-jobs', scoreJobs);

export default router;
