import express from "express";

import {
  login,
  register,
  getMe,
  updateMe,
} from "../controllers/authController.js";

import { authenticate } from "../middleware/auth.js";

const router = express.Router();

// ========================================
// LOGIN
// POST /api/auth/login
// ========================================
router.post("/login", login);

// ========================================
// REGISTER
// POST /api/auth/register
// ========================================
router.post("/register", register);

// ========================================
// KELOLA AKUN
// ========================================

// GET DATA AKUN YANG SEDANG LOGIN
// GET /api/auth/me
router.get("/me", authenticate, getMe);

// UPDATE DATA AKUN
// PUT /api/auth/me
router.put("/me", authenticate, updateMe);

export default router;