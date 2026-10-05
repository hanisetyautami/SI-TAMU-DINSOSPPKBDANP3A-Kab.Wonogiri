import jwt from "jsonwebtoken";

// ======================================================
// JWT SECRET
// Harus sama dengan secret yang digunakan saat login
// ======================================================
const JWT_SECRET =
  process.env.JWT_SECRET || "sitamu_secret_key_2026";

// ======================================================
// AUTHENTICATE
// ======================================================
export function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    console.log("========== AUTHENTICATE ==========");
    console.log("Authorization:", authHeader ? "ADA" : "TIDAK ADA");

    // --------------------------------------------------
    // CEK HEADER
    // --------------------------------------------------
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Token tidak ditemukan.",
      });
    }

    // --------------------------------------------------
    // CEK FORMAT BEARER
    // --------------------------------------------------
    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Format token tidak valid.",
      });
    }

    // --------------------------------------------------
    // AMBIL TOKEN
    // --------------------------------------------------
    const token = authHeader.substring(7).trim();

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token kosong.",
      });
    }

    console.log(
      "Token diterima:",
      `${token.substring(0, 20)}...`
    );

    // --------------------------------------------------
    // VERIFY JWT
    // --------------------------------------------------
    const decoded = jwt.verify(
      token,
      JWT_SECRET
    );

    console.log("JWT VALID");
    console.log("User:", decoded);

    // Simpan data user ke request
    req.user = decoded;

    next();

  } catch (error) {
    console.error("JWT ERROR:", error.message);

    return res.status(401).json({
      success: false,
      message:
        error.name === "TokenExpiredError"
          ? "Token sudah kedaluwarsa."
          : "Token tidak valid.",
    });
  }
}


// ======================================================
// AUTHORIZE ROLE
// ======================================================
export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User belum terautentikasi.",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Anda tidak memiliki hak akses.",
      });
    }

    next();
  };
}