import express from "express";
import multer from "multer";

import {
  getVisitors,
  createManualVisit,
  createQrVisit,
  checkInQr,
  checkOut,
} from "../controllers/visitorController.js";

import { authenticate } from "../middleware/auth.js";
import { uploadLetter } from "../middleware/upload.js";

const router = express.Router();

// =====================================================
// MIDDLEWARE UPLOAD SURAT UNDANGAN
// =====================================================

const uploadLetterMiddleware = (req, res, next) => {
  uploadLetter.single("letter_file")(req, res, (error) => {
    if (!error) {
      return next();
    }

    if (
      error instanceof multer.MulterError &&
      error.code === "LIMIT_FILE_SIZE"
    ) {
      return res.status(400).json({
        success: false,
        message: "Ukuran file surat maksimal 5 MB.",
      });
    }

    return res.status(400).json({
      success: false,
      message:
        error.message ||
        "File surat tidak dapat diproses.",
    });
  });
};

// =====================================================
// GET SEMUA VISITOR
// ADMIN SAJA
// =====================================================

router.get(
  "/",
  authenticate,
  getVisitors
);

// =====================================================
// REGISTRASI MANUAL
// ADMIN SAJA
// =====================================================

router.post(
  "/manual",
  authenticate,
  uploadLetterMiddleware,
  createManualVisit
);

// =====================================================
// REGISTRASI PUBLIC
// MASYARAKAT / DINAS / UNDANGAN
// TANPA LOGIN
// =====================================================

router.post(
  "/public/register",
  uploadLetterMiddleware,
  createManualVisit
);

// =====================================================
// REGISTRASI QR
// PUBLIC
// =====================================================

router.post(
  "/qr/register",
  uploadLetterMiddleware,
  createQrVisit
);

// =====================================================
// CHECK-IN QR
// ADMIN / PETUGAS
// =====================================================

router.post(
  "/qr/check-in",
  authenticate,
  checkInQr
);

// =====================================================
// CHECK-OUT
// ADMIN / PETUGAS
// =====================================================

router.patch(
  "/:id/check-out",
  authenticate,
  checkOut
);

export default router;