import express from 'express';
import { scoreJobs, getScoredJobs } from '../controllers/match.controller';

const router = express.Router();
router.post('/score-jobs', scoreJobs);
router.get('/scored-jobs/:userId', getScoredJobs);

export default router;
