import multer from "multer";
import os from "os";
import path from "path";
import fs from "fs";

// Use OS temporary directory for uploads (Works on Vercel, Render, Lambda)
const updatedPath = os.tmpdir();

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Ensure directory exists (though /tmp usually does)
        if (!fs.existsSync(updatedPath)) {
            fs.mkdirSync(updatedPath, { recursive: true });
        }
        cb(null, updatedPath);
    },
    filename: (req, file, cb) => {
        // Sanitize filename and add timestamp
        const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_");
        cb(null, `${Date.now()}-${safeName}`);
    },
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedTypes = ["application/pdf", "text/plain"];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        // Reject file
        cb(new Error("Invalid file type. Only PDF and TXT are allowed."));
    }
};

const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter,
});

export default upload;
