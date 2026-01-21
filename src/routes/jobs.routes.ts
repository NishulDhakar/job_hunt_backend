import express from "express";
import { fetchJobs } from "../controllers/jobs.controller";

const router = express.Router();

router.get("/jobs", fetchJobs);

export default router;
