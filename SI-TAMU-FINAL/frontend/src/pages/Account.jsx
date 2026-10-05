import React, { useEffect, useState } from "react";
import {
  UserCircle,
  Mail,
  ShieldCheck,
  Lock,
  Save,
  LogOut,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import api from "../services/api";

const Account = () => {
  const [user, setUser] = useState(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState({
    type: "",
    text: "",
  });

  // =====================================================
  // AMBIL DATA AKUN
  // =====================================================
  useEffect(() => {
    fetchAccount();
  }, []);

  const fetchAccount = async () => {
    try {
      setLoading(true);

      const response = await api.get("/auth/me");

      const account = response.data?.data || response.data?.user;

      if (!account) {
        throw new Error("Data akun tidak ditemukan");
      }

      setUser(account);

      setForm({
        name: account.name || account.full_name || "",
        email: account.email || "",
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      console.error("Gagal mengambil data akun:", error);

      setMessage({
        type: "error",
        text:
          error.response?.data?.message ||
          "Gagal mengambil data akun.",
      });
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // HANDLE INPUT
  // =====================================================
  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // =====================================================
  // SIMPAN PERUBAHAN
  // =====================================================
  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage({
      type: "",
      text: "",
    });

    // Validasi nama
    if (!form.name.trim()) {
      setMessage({
        type: "error",
        text: "Nama tidak boleh kosong.",
      });
      return;
    }

    // Validasi email
    if (!form.email.trim()) {
      setMessage({
        type: "error",
        text: "Email tidak boleh kosong.",
      });
      return;
    }

    // Jika ingin mengubah password
    if (
      form.newPassword ||
      form.confirmPassword ||
      form.currentPassword
    ) {
      if (!form.currentPassword) {
        setMessage({
          type: "error",
          text: "Masukkan password saat ini.",
        });
        return;
      }

      if (!form.newPassword) {
        setMessage({
          type: "error",
          text: "Masukkan password baru.",
        });
        return;
      }

      if (form.newPassword.length < 6) {
        setMessage({
          type: "error",
          text: "Password baru minimal 6 karakter.",
        });
        return;
      }

      if (form.newPassword !== form.confirmPassword) {
        setMessage({
          type: "error",
          text: "Konfirmasi password tidak sesuai.",
        });
        return;
      }
    }

    try {
      setSaving(true);

      const response = await api.put("/auth/me", {
        name: form.name,
        email: form.email,
        currentPassword: form.currentPassword || undefined,
        newPassword: form.newPassword || undefined,
      });

      const updatedUser =
        response.data?.data || response.data?.user;

      if (updatedUser) {
        setUser(updatedUser);

        setForm((prev) => ({
          ...prev,
          name: updatedUser.name || updatedUser.full_name || prev.name,
          email: updatedUser.email || prev.email,
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        }));
      }

      setMessage({
        type: "success",
        text:
          response.data?.message ||
          "Data akun berhasil diperbarui.",
      });
    } catch (error) {
      console.error("Gagal memperbarui akun:", error);

      setMessage({
        type: "error",
        text:
          error.response?.data?.message ||
          "Gagal memperbarui akun.",
      });
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // LOGOUT
  // =====================================================
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("loggedInUser");

    window.location.href = "/login";
  };

  // =====================================================
  // LOADING
  // =====================================================
  if (loading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <div className="text-sm text-gray-500">
          Memuat data akun...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[#f5f8f7] p-6 lg:p-7">

      {/* HEADER */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">
          Kelola Akun
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Kelola informasi akun administrator SI-TAMU.
        </p>
      </div>

      <div className="grid max-w-6xl grid-cols-1 gap-6 lg:grid-cols-[360px_1fr]">

        {/* =====================================================
            CARD PROFIL
        ===================================================== */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

          <div className="flex flex-col items-center text-center">

            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-green-50">
              <UserCircle
                size={58}
                strokeWidth={1.7}
                className="text-[#00864F]"
              />
            </div>

            <h2 className="mt-4 text-lg font-bold text-slate-900">
              {user?.name || user?.full_name || form.name}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {user?.email || form.email}
            </p>

            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-green-50 px-4 py-2 text-xs font-semibold text-[#00864F]">
              <ShieldCheck size={15} />
              Administrator
            </div>
          </div>

          <div className="my-6 border-t border-gray-100" />

          {/* INFO */}
          <div className="space-y-4">

            <div>
              <p className="text-[11px] font-semibold uppercase text-gray-400">
                Nama
              </p>

              <p className="mt-1 text-sm font-medium text-slate-700">
                {user?.name || user?.full_name || "-"}
              </p>
            </div>

            <div>
              <p className="text-[11px] font-semibold uppercase text-gray-400">
                Email
              </p>

              <p className="mt-1 break-all text-sm font-medium text-slate-700">
                {user?.email || "-"}
              </p>
            </div>

            <div>
              <p className="text-[11px] font-semibold uppercase text-gray-400">
                Role
              </p>

              <p className="mt-1 text-sm font-medium text-slate-700">
                {user?.role || "admin"}
              </p>
            </div>

            <div>
              <p className="text-[11px] font-semibold uppercase text-gray-400">
                Status
              </p>

              <div className="mt-1 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-green-500" />

                <span className="text-sm font-medium text-green-600">
                  Aktif
                </span>
              </div>
            </div>

          </div>

          {/* LOGOUT */}
          <button
            type="button"
            onClick={handleLogout}
            className="mt-7 flex w-full items-center justify-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-100"
          >
            <LogOut size={17} />
            Keluar
          </button>

        </div>

        {/* =====================================================
            FORM EDIT AKUN
        ===================================================== */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

          <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-900">
              Informasi Akun
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Perbarui informasi administrator dan password akun.
            </p>
          </div>

          {/* MESSAGE */}
          {message.text && (
            <div
              className={`mb-5 flex items-start gap-3 rounded-lg border px-4 py-3 text-sm ${
                message.type === "success"
                  ? "border-green-200 bg-green-50 text-green-700"
                  : "border-red-200 bg-red-50 text-red-700"
              }`}
            >
              {message.type === "success" ? (
                <CheckCircle size={18} className="mt-0.5 shrink-0" />
              ) : (
                <AlertCircle size={18} className="mt-0.5 shrink-0" />
              )}

              <span>{message.text}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>

            {/* NAMA */}
            <div className="mb-5">
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Nama Lengkap
              </label>

              <div className="relative">
                <UserCircle
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-[#00864F] focus:ring-2 focus:ring-green-100"
                  placeholder="Masukkan nama lengkap"
                />
              </div>
            </div>

            {/* EMAIL */}
            <div className="mb-6">
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Email
              </label>

              <div className="relative">
                <Mail
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-[#00864F] focus:ring-2 focus:ring-green-100"
                  placeholder="Masukkan email"
                />
              </div>
            </div>

            <div className="mb-6 border-t border-gray-100 pt-6">

              <div className="mb-5">
                <h3 className="font-semibold text-slate-900">
                  Ubah Password
                </h3>

                <p className="mt-1 text-xs text-gray-500">
                  Kosongkan jika tidak ingin mengubah password.
                </p>
              </div>

              {/* PASSWORD LAMA */}
              <PasswordInput
                label="Password Saat Ini"
                name="currentPassword"
                value={form.currentPassword}
                onChange={handleChange}
                show={showCurrentPassword}
                setShow={setShowCurrentPassword}
              />

              {/* PASSWORD BARU */}
              <PasswordInput
                label="Password Baru"
                name="newPassword"
                value={form.newPassword}
                onChange={handleChange}
                show={showNewPassword}
                setShow={setShowNewPassword}
              />

              {/* KONFIRMASI */}
              <PasswordInput
                label="Konfirmasi Password Baru"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                show={showConfirmPassword}
                setShow={setShowConfirmPassword}
              />

            </div>

            {/* SAVE */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 rounded-lg bg-[#00864F] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#006B45] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Save size={17} />

                {saving ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};

// =====================================================
// PASSWORD INPUT
// =====================================================
const PasswordInput = ({
  label,
  name,
  value,
  onChange,
  show,
  setShow,
}) => {
  return (
    <div className="mb-4">
      <label className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </label>

      <div className="relative">
        <Lock
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />

        <input
          type={show ? "text" : "password"}
          name={name}
          value={value}
          onChange={onChange}
          className="w-full rounded-lg border border-gray-200 bg-white py-3 pl-10 pr-11 text-sm outline-none transition focus:border-[#00864F] focus:ring-2 focus:ring-green-100"
          placeholder={`Masukkan ${label.toLowerCase()}`}
        />

        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          {show ? (
            <EyeOff size={18} />
          ) : (
            <Eye size={18} />
          )}
        </button>
      </div>
    </div>
  );
};

export default Account;