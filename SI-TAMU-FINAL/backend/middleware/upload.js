import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.join(
  __dirname,
  "..",
  "uploads",
  "letters"
);

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, {
    recursive: true,
  });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },

  filename: (_req, file, cb) => {
    const ext = path
      .extname(file.originalname)
      .toLowerCase();

    const safeName = path
      .basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9_-]/g, "-")
      .slice(0, 60);

    cb(
      null,
      `${Date.now()}-${safeName || "surat-undangan"}${ext}`
    );
  },
});

const allowedMimeTypes = [
  "application/pdf",
  "image/jpeg",
  "image/png",
];

const fileFilter = (_req, file, cb) => {
  if (!allowedMimeTypes.includes(file.mimetype)) {
    return cb(
      new Error(
        "File surat harus berformat PDF, JPG/JPEG, atau PNG."
      )
    );
  }

  cb(null, true);
};

export const uploadLetter = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});