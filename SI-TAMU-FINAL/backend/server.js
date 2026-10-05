// ======================================================
// LOAD ENVIRONMENT VARIABLES TERLEBIH DAHULU
// ======================================================
import "dotenv/config";

import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

// ======================================================
// ROUTES
// ======================================================
import authRoutes from "./routes/auth.js";
import publicRoutes from "./routes/public.js";
import visitorRoutes from "./routes/visitors.js";

// ======================================================
// APP
// ======================================================
const app = express();

// ======================================================
// PATH ES MODULE
// ======================================================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ======================================================
// CORS
// ======================================================
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

// ======================================================
// BODY PARSER
// ======================================================
app.use(express.json());

// ======================================================
// STATIC FILES - UPLOAD SURAT
// ======================================================
app.use(
  "/uploads",
  express.static(
    path.join(
      __dirname,
      "uploads"
    )
  )
);

// ======================================================
// ROUTES
// ======================================================

// ======================================================
// AUTH
// ======================================================
app.use(
  "/api/auth",
  authRoutes
);

// ======================================================
// PUBLIC
// QR CODE & DEPARTMENTS
// ======================================================
app.use(
  "/api/public",
  publicRoutes
);

// ======================================================
// VISITORS
// ======================================================
app.use(
  "/api/visitors",
  visitorRoutes
);

// ======================================================
// TEST API
// ======================================================
app.get(
  "/",
  (req, res) => {

    res.json({
      success: true,
      message:
        "API SI-TAMU berjalan",
    });

  }
);

// ======================================================
// ERROR HANDLER
// ======================================================
app.use(
  (err, req, res, next) => {

    console.error(
      "SERVER ERROR:",
      err
    );

    res.status(
      err.status || 500
    ).json({

      success: false,

      message:
        err.message ||
        "Terjadi kesalahan server.",

    });

  }
);

// ======================================================
// SERVER
// ======================================================
const PORT =
  process.env.PORT || 5000;

app.listen(
  PORT,
  () => {

    console.log(
      "======================================"
    );

    console.log(
      "     SI-TAMU BACKEND SERVER"
    );

    console.log(
      "======================================"
    );

    console.log(
      `Server berjalan di http://localhost:${PORT}`
    );

    console.log(
      `JWT_SECRET: ${
        process.env.JWT_SECRET
          ? "TERBACA"
          : "TIDAK TERBACA"
      }`
    );

    console.log(
      "======================================"
    );

  }
);