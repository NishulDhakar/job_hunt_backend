# AI Job Tracker – Backend

Node.js backend that powers job fetching, resume storage, AI matching, application tracking, and AI chat.

## Tech Stack
- Node.js + Express
- Redis (Upstash)
- Groq AI
- JSearch (RapidAPI)

## Setup

```bash
npm install
npm run dev
```

## Create .env:

```bash
PORT=5001
GROQ_API_KEY=
RAPID_API_KEY=
RAPID_API_HOST=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

APIs
```bash
GET  /api/jobs
POST /api/upload-resume
POST /api/apply-job
GET  /api/applications
POST /api/chat
```

Redis is used as a lightweight database to store:

- Resume text
- Jobs
- Applications
- AI scores

