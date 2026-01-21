import dotenv from "dotenv";
dotenv.config();
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

// Routes
import jobsRoutes from './routes/jobs.routes';
import resumeRoutes from './routes/resume.routes';
import matchRoutes from './routes/match.routes';
import applicationsRoutes from './routes/applications.routes';
import chatRoutes from './routes/chat.routes';

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api', jobsRoutes);
app.use('/api', resumeRoutes);
app.use('/api', matchRoutes); // contains /score-jobs
app.use('/api', applicationsRoutes); // contains /apply-job, /applications, /applications/:id
app.use('/api', chatRoutes);

// Health Check
app.get('/', (req: Request, res: Response) => {
    res.json({ status: 'ok', message: 'Job Hunt AI Backend is Running 🚀' });
});

// 404 Handler
app.use((req: Request, res: Response) => {
    res.status(404).json({ success: false, message: 'Endpoint not found' });
});

// Error Handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});

export default app;
