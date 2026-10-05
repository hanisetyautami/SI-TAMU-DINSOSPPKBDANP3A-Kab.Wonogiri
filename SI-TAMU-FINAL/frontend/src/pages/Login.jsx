import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import {
  Mail,
  LockKeyhole,
  LogIn,
  UserPlus,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
} from "lucide-react";

import logoImage from "../assets/si-tamulogo.jpg";

// ========================================
// API
// ========================================

const API_URL = "http://localhost:5000/api";

// ========================================
// LOGIN
// ========================================

export default function Login() {
  const navigate = useNavigate();

  // ======================================
  // FORM
  // ======================================

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  // ======================================
  // STATE
  // ======================================

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] =
    useState(false);

  // ======================================
  // HANDLE INPUT
  // ======================================

  const handleChange = (e) => {
    const {
      name,
      value,
    } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Hapus pesan error saat mengetik
    if (error) {
      setError("");
    }
  };

  // ======================================
  // HANDLE LOGIN
  // ======================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    // ====================================
    // VALIDASI
    // ====================================

    if (
      !formData.email ||
      !formData.password
    ) {
      setError(
        "Email dan password wajib diisi."
      );

      return;
    }

    try {
      setLoading(true);

      // ==================================
      // REQUEST LOGIN
      // ==================================

      const response = await axios.post(
        `${API_URL}/auth/login`,
        {
          email: formData.email.trim(),
          password: formData.password,
        },
        {
          headers: {
            "Content-Type":
              "application/json",
          },
        }
      );

      // ==================================
      // AMBIL RESPONSE
      // ==================================

        const token =
        response.data?.token ||
        response.data?.access_token ||
        response.data?.accessToken ||
        response.data?.data?.token ||
        response.data?.data?.access_token ||
        response.data?.data?.accessToken;

        const user =
        response.data?.user ||
        response.data?.data?.user ||
        null;

        console.log("LOGIN RESPONSE:", response.data);
        console.log("TOKEN YANG DIDAPAT:", token);
        console.log("USER YANG DIDAPAT:", user);
      // ==================================
      // VALIDASI RESPONSE
      // ==================================

      if (!token) {
        setError(
          "Login berhasil tetapi token tidak diterima dari server."
        );

        return;
      }

      // ==================================
      // SIMPAN TOKEN UTAMA SI-TAMU
      // ==================================

      localStorage.setItem(
        "sitamu_token",
        token
      );

      // ==================================
      // SIMPAN USER UTAMA SI-TAMU
      // ==================================

      if (user) {
        localStorage.setItem(
          "sitamu_user",
          JSON.stringify(user)
        );
      }

      // ==================================
      // KOMPATIBILITAS SISTEM LAMA
      // ==================================

      localStorage.setItem(
        "token",
        token
      );

      if (user) {
        localStorage.setItem(
          "user",
          JSON.stringify(user)
        );

        localStorage.setItem(
          "loggedInUser",
          JSON.stringify(user)
        );
      }

      // ==================================
      // LOGIN BERHASIL
      // ==================================

      navigate("/admin", {
        replace: true,
      });

    } catch (err) {
      console.error(
        "Login error:",
        err
      );

      // ==================================
      // ERROR DARI BACKEND
      // ==================================

      if (
        err.response?.data?.message
      ) {
        setError(
          err.response.data.message
        );
      }

      // ==================================
      // 401
      // ==================================

      else if (
        err.response?.status === 401
      ) {
        setError(
          "Email atau password salah."
        );
      }

      // ==================================
      // 400
      // ==================================

      else if (
        err.response?.status === 400
      ) {
        setError(
          "Data login tidak lengkap."
        );
      }

      // ==================================
      // 404
      // ==================================

      else if (
        err.response?.status === 404
      ) {
        setError(
          "Endpoint login tidak ditemukan. Periksa backend."
        );
      }

      // ==================================
      // 500
      // ==================================

      else if (
        err.response?.status === 500
      ) {
        setError(
          "Terjadi kesalahan pada server. Periksa terminal backend."
        );
      }

      // ==================================
      // SERVER TIDAK AKTIF
      // ==================================

      else if (
        err.request &&
        !err.response
      ) {
        setError(
          "Server backend tidak dapat dihubungi."
        );
      }

      // ==================================
      // ERROR LAIN
      // ==================================

      else {
        setError(
          "Terjadi kesalahan saat login."
        );
      }

    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // RENDER
  // ========================================

  return (
    <div className="min-h-screen bg-[#F5F8F6] flex items-center justify-center px-4 py-8">

      <div className="w-full max-w-md">

        {/* ==================================
            LOGO / IDENTITAS
        ================================== */}

        <div className="text-center mb-7">

          <div className="flex justify-center mb-4">

            <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-2xl bg-white p-2 shadow-md ring-1 ring-gray-100 sm:h-32 sm:w-32">

              <img
                src={logoImage}
                alt="Logo SI-TAMU"
                className="h-full w-full object-contain"
              />

            </div>

          </div>

          <h1 className="text-xl font-extrabold tracking-tight text-gray-800 sm:text-2xl">
            SI-TAMU
          </h1>

          <p className="mt-1 text-sm font-semibold text-green-700">
            DINSOSPPKBP3A
          </p>

          <p className="text-sm text-gray-600">
            KABUPATEN WONOGIRI
          </p>

        </div>

        {/* ==================================
            CARD LOGIN
        ================================== */}

        <div className="rounded-2xl bg-white p-6 shadow-lg ring-1 ring-gray-100 sm:p-8">

          {/* ==================================
              TITLE
          ================================== */}

          <div className="mb-7 text-center">

            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50 text-green-700">

              <LogIn
                size={28}
                strokeWidth={2}
              />

            </div>

            <h2 className="text-2xl font-extrabold text-gray-800">
              Login Admin
            </h2>

            <p className="mt-1.5 text-sm text-gray-500">
              Masuk ke dashboard SI-TAMU
            </p>

          </div>

          {/* ==================================
              ERROR
          ================================== */}

          {error && (

            <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">

              <AlertCircle
                size={19}
                className="mt-0.5 shrink-0"
              />

              <span>
                {error}
              </span>

            </div>

          )}

          {/* ==================================
              FORM
          ================================== */}

          <form
            onSubmit={handleSubmit}
          >

            {/* ==================================
                EMAIL
            ================================== */}

            <div className="mb-5">

              <label
                htmlFor="email"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Email
              </label>

              <div className="relative">

                <Mail
                  size={19}
                  strokeWidth={2}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  id="email"
                  name="email"
                  type="email"
                  value={
                    formData.email
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Masukkan email"
                  autoComplete="email"
                  disabled={loading}
                  className="w-full rounded-xl border border-gray-300 bg-white py-3.5 pl-11 pr-4 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 hover:border-gray-400 focus:border-green-700 focus:ring-4 focus:ring-green-100 disabled:cursor-not-allowed disabled:bg-gray-100"
                />

              </div>

            </div>

            {/* ==================================
                PASSWORD
            ================================== */}

            <div className="mb-6">

              <label
                htmlFor="password"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Password
              </label>

              <div className="relative">

                <LockKeyhole
                  size={19}
                  strokeWidth={2}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  id="password"
                  name="password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  value={
                    formData.password
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Masukkan password"
                  autoComplete="current-password"
                  disabled={loading}
                  className="w-full rounded-xl border border-gray-300 bg-white py-3.5 pl-11 pr-12 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 hover:border-gray-400 focus:border-green-700 focus:ring-4 focus:ring-green-100 disabled:cursor-not-allowed disabled:bg-gray-100"
                />

                {/* SHOW / HIDE PASSWORD */}

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      (prev) =>
                        !prev
                    )
                  }
                  disabled={loading}
                  aria-label={
                    showPassword
                      ? "Sembunyikan password"
                      : "Tampilkan password"
                  }
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-lg p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed"
                >

                  {showPassword ? (
                    <EyeOff
                      size={19}
                    />
                  ) : (
                    <Eye
                      size={19}
                    />
                  )}

                </button>

              </div>

            </div>

            {/* ==================================
                LOGIN BUTTON
            ================================== */}

            <button
              type="submit"
              disabled={loading}
              className={`flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold text-white shadow-sm transition ${
                loading
                  ? "cursor-not-allowed bg-gray-400"
                  : "bg-green-700 hover:bg-green-800 active:scale-[0.99]"
              }`}
            >

              {loading ? (
                <>
                  <Loader2
                    size={19}
                    className="animate-spin"
                  />

                  Memproses...
                </>
              ) : (
                <>
                  <LogIn
                    size={19}
                  />

                  Masuk
                </>
              )}

            </button>

          </form>

          {/* ==================================
              REGISTER
          ================================== */}

          <div className="mt-6 border-t border-gray-100 pt-5 text-center">

            <p className="text-sm text-gray-500">
              Belum punya akun?
            </p>

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/register"
                )
              }
              className="mt-2 inline-flex items-center gap-1.5 text-sm font-bold text-green-700 transition hover:text-green-800 hover:underline"
            >

              <UserPlus
                size={17}
              />

              Daftar akun admin

            </button>

          </div>

        </div>

        {/* FOOTER */}

        <p className="mt-6 text-center text-xs text-gray-400">
          SI-TAMU &copy;{" "}
          {new Date().getFullYear()}{" "}
          DINSOSPPKBP3A Kabupaten
          Wonogiri
        </p>

      </div>

    </div>
  );
}