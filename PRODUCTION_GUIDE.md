# Production Reliability Guide & Best Practices

## 1. File Uploads (Critical for Cloud Platforms)
You faced 500 errors because Render/Vercel (and other cloud platforms) have **ephemeral filesystems**. They wipe local files after requests or deployments, and often the root directory is read-only.

**The Fix Implemented:**
- Switched `multer` storage to use `os.tmpdir()` (`/tmp`), which is writable in almost all environments (Lambda, Render, etc.).
- Added automatic directory creation check.
- Added file type filtering (PDF/TXT only) for security.
- Added filename sanitization.
- Added automatic file cleanup (unlink) after processing.

**Future Recommendation (S3/Cloudinary):**
For permanent storage (e.g., if you want the user to download the resume later, not just extract text), you **must** use object storage like **AWS S3** or **Cloudinary**.
- **Why?** Local `/tmp` is deleted quickly.
- **How?** Use `multer-s3` or upload the buffer directly to Cloudinary.

## 2. Redis Robustness
Redis failures should not crash your main application flow.
- **The Fix:** Created a `RedisService` wrapper that catches errors.
- **Behavior:** If Redis is down or missing credentials, it logs a warning but allows the API to proceed (returning successful upload, just no caching).

## 3. Logging & Monitoring
- Added structured logs to the upload controller (`console.log` with emojis for visibility).
- You can route these logs to Datadog/Sentry in the future.

## 4. Security Best Practices
- **File Type Validation**: We check `mimetype` to allow only `application/pdf` and `text/plain` to prevent malicious executable uploads.
- **Size Limits**: Enforced 5MB limit to prevent DoS via disk filling.
- **Filename Sanitization**: Replaced special characters in filenames to prevent filesystem exploits.

## 5. Deployment Checklist
- Set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` in your Render/Vercel environment variables.
- Ensure your `package.json` build script is `tsc` (which it is).
- Use a process manager like PM2 if running on a heavy VPS, though `node dist/app.js` is fine for Docker/Render.
