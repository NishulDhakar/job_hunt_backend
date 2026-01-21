import express from 'express';
import { applyJob, updateStatus, getApplications } from '../controllers/applications.controller';

const router = express.Router();

router.post('/apply-job', applyJob);
router.patch('/applications/:jobId', updateStatus);
router.get('/applications', getApplications);

export default router;
