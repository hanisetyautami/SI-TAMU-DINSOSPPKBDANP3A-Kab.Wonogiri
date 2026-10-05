import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "../config/db.js";

// ======================================================
// JWT SECRET
// HARUS SAMA DENGAN middleware/auth.js
// ======================================================
const JWT_SECRET =
  process.env.JWT_SECRET || "sitamu_secret_key_2026";


// ======================================================
// REGISTER
// ======================================================
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // --------------------------------------------------
    // VALIDASI
    // --------------------------------------------------
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Nama, email, dan password wajib diisi.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password minimal 6 karakter.",
      });
    }

    // --------------------------------------------------
    // NORMALISASI EMAIL
    // --------------------------------------------------
    const cleanEmail = email.trim().toLowerCase();

    // --------------------------------------------------
    // CEK EMAIL
    // --------------------------------------------------
    const [existingUsers] = await db.execute(
      `
      SELECT id
      FROM users
      WHERE email = ?
      LIMIT 1
      `,
      [cleanEmail]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Email sudah terdaftar.",
      });
    }

    // --------------------------------------------------
    // HASH PASSWORD
    // --------------------------------------------------
    const hashedPassword = await bcrypt.hash(
      password,
      10
    );

    // --------------------------------------------------
    // ROLE DEFAULT
    // --------------------------------------------------
    const role = "admin";

    // --------------------------------------------------
    // INSERT USER
    // --------------------------------------------------
    const [result] = await db.execute(
      `
      INSERT INTO users
        (name, email, password, role)
      VALUES
        (?, ?, ?, ?)
      `,
      [
        name.trim(),
        cleanEmail,
        hashedPassword,
        role,
      ]
    );

    // --------------------------------------------------
    // RESPONSE
    // --------------------------------------------------
    return res.status(201).json({
      success: true,
      message: "Registrasi berhasil.",
      user: {
        id: result.insertId,
        name: name.trim(),
        email: cleanEmail,
        role,
      },
    });

  } catch (error) {
    console.error(
      "REGISTER ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server.",
      error: error.message,
    });
  }
};


// ======================================================
// LOGIN
// ======================================================
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // --------------------------------------------------
    // VALIDASI
    // --------------------------------------------------
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email dan password wajib diisi.",
      });
    }

    // --------------------------------------------------
    // NORMALISASI EMAIL
    // --------------------------------------------------
    const cleanEmail = email.trim().toLowerCase();

    // --------------------------------------------------
    // AMBIL USER
    // --------------------------------------------------
    const [users] = await db.execute(
      `
      SELECT
        id,
        name,
        email,
        password,
        role
      FROM users
      WHERE email = ?
      LIMIT 1
      `,
      [cleanEmail]
    );

    // --------------------------------------------------
    // USER TIDAK DITEMUKAN
    // --------------------------------------------------
    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Email atau password salah.",
      });
    }

    const user = users[0];

    // --------------------------------------------------
    // CEK PASSWORD
    // --------------------------------------------------
    const storedPassword = String(
      user.password || ""
    );

    let passwordValid = false;

    const isBcryptPassword =
      storedPassword.startsWith("$2a$") ||
      storedPassword.startsWith("$2b$") ||
      storedPassword.startsWith("$2y$");

    // --------------------------------------------------
    // BCRYPT
    // --------------------------------------------------
    if (isBcryptPassword) {
      passwordValid = await bcrypt.compare(
        password,
        storedPassword
      );
    }

    // --------------------------------------------------
    // PASSWORD LAMA / PLAIN TEXT
    // --------------------------------------------------
    else {
      passwordValid =
        password === storedPassword;

      // Migrasikan password lama ke bcrypt
      if (passwordValid) {
        const newHash =
          await bcrypt.hash(password, 10);

        await db.execute(
          `
          UPDATE users
          SET password = ?
          WHERE id = ?
          `,
          [
            newHash,
            user.id,
          ]
        );

        console.log(
          `Password ${user.email} berhasil diamankan dengan bcrypt.`
        );
      }
    }

    // --------------------------------------------------
    // PASSWORD SALAH
    // --------------------------------------------------
    if (!passwordValid) {
      return res.status(401).json({
        success: false,
        message: "Email atau password salah.",
      });
    }

    // --------------------------------------------------
    // BUAT JWT
    // --------------------------------------------------
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      JWT_SECRET,
      {
        expiresIn: "8h",
      }
    );

    // --------------------------------------------------
    // RESPONSE
    // --------------------------------------------------
    return res.status(200).json({
      success: true,
      message: "Login berhasil.",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

  } catch (error) {
    console.error(
      "LOGIN ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server.",
      error: error.message,
    });
  }
};


// ======================================================
// KELOLA AKUN
// GET DATA AKUN YANG SEDANG LOGIN
// GET /api/auth/me
// ======================================================
export const getMe = async (req, res) => {
  try {
    // --------------------------------------------------
    // AMBIL ID USER DARI JWT
    // --------------------------------------------------
    const userId = req.user.id;

    // --------------------------------------------------
    // AMBIL DATA USER
    // --------------------------------------------------
    const [users] = await db.execute(
      `
      SELECT
        id,
        name,
        email,
        role
      FROM users
      WHERE id = ?
      LIMIT 1
      `,
      [userId]
    );

    // --------------------------------------------------
    // USER TIDAK DITEMUKAN
    // --------------------------------------------------
    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Akun tidak ditemukan.",
      });
    }

    const user = users[0];

    // --------------------------------------------------
    // RESPONSE
    // --------------------------------------------------
    return res.status(200).json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: "Aktif",
      },
    });

  } catch (error) {
    console.error(
      "GET ME ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Gagal mengambil data akun.",
      error: error.message,
    });
  }
};


// ======================================================
// KELOLA AKUN
// UPDATE DATA AKUN
// PUT /api/auth/me
// ======================================================
export const updateMe = async (req, res) => {
  try {
    // --------------------------------------------------
    // AMBIL ID USER DARI JWT
    // --------------------------------------------------
    const userId = req.user.id;

    const {
      name,
      email,
      currentPassword,
      newPassword,
    } = req.body;

    // --------------------------------------------------
    // VALIDASI NAMA DAN EMAIL
    // --------------------------------------------------
    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: "Nama dan email wajib diisi.",
      });
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    // --------------------------------------------------
    // AMBIL DATA USER
    // --------------------------------------------------
    const [users] = await db.execute(
      `
      SELECT
        id,
        name,
        email,
        password,
        role
      FROM users
      WHERE id = ?
      LIMIT 1
      `,
      [userId]
    );

    // --------------------------------------------------
    // USER TIDAK DITEMUKAN
    // --------------------------------------------------
    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Akun tidak ditemukan.",
      });
    }

    const user = users[0];

    // --------------------------------------------------
    // CEK EMAIL DUPLIKAT
    // --------------------------------------------------
    const [existingEmail] = await db.execute(
      `
      SELECT id
      FROM users
      WHERE email = ?
      AND id != ?
      LIMIT 1
      `,
      [
        cleanEmail,
        userId,
      ]
    );

    if (existingEmail.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Email sudah digunakan oleh akun lain.",
      });
    }

    // --------------------------------------------------
    // UPDATE NAMA DAN EMAIL
    // --------------------------------------------------
    await db.execute(
      `
      UPDATE users
      SET
        name = ?,
        email = ?
      WHERE id = ?
      `,
      [
        cleanName,
        cleanEmail,
        userId,
      ]
    );

    // --------------------------------------------------
    // UPDATE PASSWORD JIKA DIISI
    // --------------------------------------------------
    if (newPassword) {

      // -----------------------------------------------
      // PASSWORD LAMA WAJIB DIISI
      // -----------------------------------------------
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          message: "Password saat ini wajib diisi.",
        });
      }

      // -----------------------------------------------
      // CEK PASSWORD LAMA
      // -----------------------------------------------
      const storedPassword = String(
        user.password || ""
      );

      let passwordValid = false;

      const isBcryptPassword =
        storedPassword.startsWith("$2a$") ||
        storedPassword.startsWith("$2b$") ||
        storedPassword.startsWith("$2y$");

      // -----------------------------------------------
      // PASSWORD BCRYPT
      // -----------------------------------------------
      if (isBcryptPassword) {
        passwordValid = await bcrypt.compare(
          currentPassword,
          storedPassword
        );
      }

      // -----------------------------------------------
      // PASSWORD LAMA / PLAIN TEXT
      // -----------------------------------------------
      else {
        passwordValid =
          currentPassword === storedPassword;
      }

      // -----------------------------------------------
      // PASSWORD LAMA SALAH
      // -----------------------------------------------
      if (!passwordValid) {
        return res.status(401).json({
          success: false,
          message: "Password saat ini salah.",
        });
      }

      // -----------------------------------------------
      // VALIDASI PASSWORD BARU
      // -----------------------------------------------
      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: "Password baru minimal 6 karakter.",
        });
      }

      // -----------------------------------------------
      // HASH PASSWORD BARU
      // -----------------------------------------------
      const hashedPassword =
        await bcrypt.hash(
          newPassword,
          10
        );

      // -----------------------------------------------
      // SIMPAN PASSWORD BARU
      // -----------------------------------------------
      await db.execute(
        `
        UPDATE users
        SET password = ?
        WHERE id = ?
        `,
        [
          hashedPassword,
          userId,
        ]
      );
    }

    // --------------------------------------------------
    // AMBIL DATA USER TERBARU
    // --------------------------------------------------
    const [updatedUsers] = await db.execute(
      `
      SELECT
        id,
        name,
        email,
        role
      FROM users
      WHERE id = ?
      LIMIT 1
      `,
      [userId]
    );

    const updatedUser = updatedUsers[0];

    // --------------------------------------------------
    // RESPONSE
    // --------------------------------------------------
    return res.status(200).json({
      success: true,
      message: "Data akun berhasil diperbarui.",
      data: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        status: "Aktif",
      },
    });

  } catch (error) {
    console.error(
      "UPDATE ACCOUNT ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Gagal memperbarui data akun.",
      error: error.message,
    });
  }
};