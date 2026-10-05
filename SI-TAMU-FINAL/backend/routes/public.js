import express from "express";
import db from "../config/db.js";

const router = express.Router();

// =====================================================
// GET DEPARTMENTS / TUJUAN
// =====================================================
router.get(
  "/departments",
  async (_req, res) => {

    try {

      const [rows] =
        await db.query(`
          SELECT
            id,
            name
          FROM departments
          ORDER BY name ASC
        `);

      return res.json({

        success: true,

        data: rows,

      });

    } catch (error) {

      console.error(
        "GET /public/departments ERROR:",
        error
      );

      return res.status(500).json({

        success: false,

        message:
          "Gagal mengambil data tujuan kunjungan.",

      });

    }

  }
);

// =====================================================
// GET QR REGISTRASI
// QR MENGARAH KE HALAMAN REGISTRASI FRONTEND
// =====================================================
router.get(
  "/registration-qr",
  (req, res) => {

    const frontendUrl =
      process.env.FRONTEND_URL ||
      "http://localhost:5173/registration-dashboard";

    const qrCode =
      `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
        frontendUrl
      )}`;

    return res.json({

      success: true,

      data: {

        qr_code: qrCode,

        url: frontendUrl,

      },

    });

  }
);

export default router;