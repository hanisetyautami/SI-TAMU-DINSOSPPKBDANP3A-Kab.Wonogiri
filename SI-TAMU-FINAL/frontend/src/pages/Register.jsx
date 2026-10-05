import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_URL = "http://localhost:5000/api";

export default function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });

    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (
      !formData.name ||
      !formData.email ||
      !formData.password ||
      !formData.confirmPassword
    ) {
      setError("Semua field wajib diisi.");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password minimal 6 karakter.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Konfirmasi password tidak cocok.");
      return;
    }

    try {
      setLoading(true);

      await axios.post(`${API_URL}/auth/register`, {
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });

      setSuccess(
        "Registrasi berhasil. Silakan login menggunakan akun baru."
      );

      setFormData({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
      });

      setTimeout(() => {
        navigate("/login");
      }, 1500);

    } catch (err) {
      console.error("Register error:", err);

      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("Terjadi kesalahan server.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f8f6] flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* LOGO */}
        <div className="text-center mb-7">
          <div className="flex justify-center mb-3">
            <img
              src="/logo-sitamu.png"
              alt="Logo SI-TAMU"
              className="w-32 h-32 object-contain"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          </div>

          <h1 className="text-xl font-bold text-gray-800">
            SI-TAMU DINOSPPKBP3A
          </h1>

          <p className="text-sm text-gray-700">
            KABUPATEN WONOGIRI
          </p>
        </div>

        {/* REGISTER CARD */}
        <div className="bg-white rounded-xl shadow-md p-7">

          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              Daftar Akun
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Buat akun admin SI-TAMU
            </p>
          </div>

          {/* ERROR */}
          {error && (
            <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* SUCCESS */}
          {success && (
            <div className="mb-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit}>

            {/* NAMA */}
            <div className="mb-4">
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Nama Lengkap
              </label>

              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                placeholder="Masukkan nama lengkap"
                autoComplete="name"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-green-700 focus:ring-2 focus:ring-green-100"
              />
            </div>

            {/* EMAIL */}
            <div className="mb-4">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Email
              </label>

              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Masukkan email"
                autoComplete="email"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-green-700 focus:ring-2 focus:ring-green-100"
              />
            </div>

            {/* PASSWORD */}
            <div className="mb-4">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Password
              </label>

              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Minimal 6 karakter"
                autoComplete="new-password"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-green-700 focus:ring-2 focus:ring-green-100"
              />
            </div>

            {/* CONFIRM PASSWORD */}
            <div className="mb-6">
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Konfirmasi Password
              </label>

              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Ulangi password"
                autoComplete="new-password"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-green-700 focus:ring-2 focus:ring-green-100"
              />
            </div>

            {/* REGISTER */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full rounded-lg py-3 text-sm font-semibold text-white transition ${
                loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-green-700 hover:bg-green-800"
              }`}
            >
              {loading ? "Mendaftarkan..." : "Daftar Akun"}
            </button>
          </form>

          {/* BACK TO LOGIN */}
          <div className="mt-6 pt-5 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-500">
              Sudah punya akun?
            </p>

            <button
              type="button"
              onClick={() => navigate("/login")}
              className="mt-1 text-sm font-semibold text-green-700 hover:text-green-800 hover:underline"
            >
              Kembali ke Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}