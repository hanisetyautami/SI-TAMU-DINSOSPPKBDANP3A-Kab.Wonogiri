import { useEffect, useState } from "react";
import {
  Users as UsersIcon,
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  UserRound,
  Mail,
  Shield,
  RefreshCw,
} from "lucide-react";
import api from "../services/api";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "petugas",
  });

  // =========================
  // AMBIL DATA USERS
  // =========================
  const loadUsers = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/users");

      const data = response.data;

      if (Array.isArray(data)) {
        setUsers(data);
      } else if (Array.isArray(data.users)) {
        setUsers(data.users);
      } else if (Array.isArray(data.data)) {
        setUsers(data.data);
      } else {
        setUsers([]);
      }
    } catch (err) {
      console.error("Gagal mengambil users:", err);

      setError(
        err.response?.data?.message ||
          "Data users tidak dapat dimuat."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // =========================
  // FORM
  // =========================
  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const openAddModal = () => {
    setEditId(null);

    setForm({
      name: "",
      email: "",
      password: "",
      role: "petugas",
    });

    setError("");
    setShowModal(true);
  };

  const openEditModal = (user) => {
    setEditId(user.id);

    setForm({
      name: user.name || "",
      email: user.email || "",
      password: "",
      role: user.role || "petugas",
    });

    setError("");
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditId(null);
  };

  // =========================
  // SIMPAN USER
  // =========================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      setError("Nama wajib diisi.");
      return;
    }

    if (!form.email.trim()) {
      setError("Email wajib diisi.");
      return;
    }

    if (!editId && !form.password) {
      setError("Password wajib diisi untuk user baru.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      if (editId) {
        const payload = {
          name: form.name,
          email: form.email,
          role: form.role,
        };

        if (form.password) {
          payload.password = form.password;
        }

        await api.put(`/users/${editId}`, payload);
      } else {
        await api.post("/users", {
          name: form.name,
          email: form.email,
          password: form.password,
          role: form.role,
        });
      }

      setShowModal(false);
      setEditId(null);

      await loadUsers();
    } catch (err) {
      console.error("Gagal menyimpan user:", err);

      setError(
        err.response?.data?.message ||
          "User gagal disimpan."
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================
  // HAPUS / NONAKTIFKAN USER
  // =========================
  const handleDelete = async (id) => {
    const yakin = window.confirm(
      "Apakah Anda yakin ingin menonaktifkan user ini?"
    );

    if (!yakin) return;

    try {
      setError("");

      await api.delete(`/users/${id}`);

      await loadUsers();
    } catch (err) {
      console.error("Gagal menonaktifkan user:", err);

      setError(
        err.response?.data?.message ||
          "User gagal dinonaktifkan."
      );
    }
  };

  // =========================
  // FILTER
  // =========================
  const filteredUsers = users.filter((user) => {
    const keyword = search.toLowerCase();

    return (
      user.name?.toLowerCase().includes(keyword) ||
      user.email?.toLowerCase().includes(keyword) ||
      user.role?.toLowerCase().includes(keyword)
    );
  });

  return (
    <div className="min-h-screen bg-[#f5f8f6]">

      {/* HEADER */}
      <div className="border-b border-gray-200 bg-white px-6 py-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

          <div>
            <h1 className="flex items-center gap-3 text-2xl font-bold text-[#07532f]">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#eaf6ef]">
                <UsersIcon size={24} />
              </span>

              Data Users
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Kelola akun admin dan petugas SI-TAMU.
            </p>
          </div>

          <button
            onClick={openAddModal}
            className="flex items-center justify-center gap-2 rounded-xl bg-[#08753f] px-5 py-3 font-semibold text-white transition hover:bg-[#075f34]"
          >
            <Plus size={19} />
            Tambah User
          </button>
        </div>
      </div>

      <main className="p-6">

        {/* ERROR */}
        {error && !showModal && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* STAT */}
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">
                  Total Users
                </p>

                <p className="mt-2 text-3xl font-bold text-gray-800">
                  {users.length}
                </p>
              </div>

              <div className="rounded-xl bg-[#eaf6ef] p-3 text-[#08753f]">
                <UsersIcon size={24} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">
                  Admin
                </p>

                <p className="mt-2 text-3xl font-bold text-gray-800">
                  {
                    users.filter(
                      (user) => user.role === "admin"
                    ).length
                  }
                </p>
              </div>

              <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                <Shield size={24} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">
                  Petugas
                </p>

                <p className="mt-2 text-3xl font-bold text-gray-800">
                  {
                    users.filter(
                      (user) => user.role === "petugas"
                    ).length
                  }
                </p>
              </div>

              <div className="rounded-xl bg-orange-50 p-3 text-orange-600">
                <UserRound size={24} />
              </div>
            </div>
          </div>

        </div>

        {/* TABLE CARD */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">

          {/* SEARCH */}
          <div className="flex flex-col gap-3 border-b border-gray-100 p-5 md:flex-row md:items-center md:justify-between">

            <div>
              <h2 className="font-bold text-gray-800">
                Daftar Users
              </h2>

              <p className="text-sm text-gray-500">
                Akun yang dapat mengakses sistem SI-TAMU.
              </p>
            </div>

            <div className="flex gap-2">

              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  type="text"
                  placeholder="Cari user..."
                  value={search}
                  onChange={(e) =>
                    setSearch(e.target.value)
                  }
                  className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-[#08753f] md:w-64"
                />
              </div>

              <button
                onClick={loadUsers}
                className="flex items-center justify-center rounded-xl border border-gray-200 px-3 text-gray-600 hover:bg-gray-50"
                title="Refresh"
              >
                <RefreshCw size={18} />
              </button>

            </div>
          </div>

          {/* TABLE */}
          <div className="overflow-x-auto">

            {loading ? (
              <div className="flex items-center justify-center py-16 text-gray-500">
                <RefreshCw
                  size={20}
                  className="mr-2 animate-spin"
                />
                Memuat data users...
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="py-16 text-center text-gray-500">
                <UsersIcon
                  size={40}
                  className="mx-auto mb-3 text-gray-300"
                />

                <p>
                  Belum ada data users.
                </p>
              </div>
            ) : (
              <table className="w-full min-w-[700px]">

                <thead className="bg-[#f8faf9]">
                  <tr className="text-left text-sm text-gray-500">

                    <th className="px-6 py-4">
                      No
                    </th>

                    <th className="px-6 py-4">
                      User
                    </th>

                    <th className="px-6 py-4">
                      Email
                    </th>

                    <th className="px-6 py-4">
                      Role
                    </th>

                    <th className="px-6 py-4 text-center">
                      Aksi
                    </th>

                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">

                  {filteredUsers.map((user, index) => (
                    <tr
                      key={user.id}
                      className="text-sm hover:bg-gray-50"
                    >

                      <td className="px-6 py-4 text-gray-500">
                        {index + 1}
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">

                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#eaf6ef] font-bold text-[#08753f]">
                            {user.name
                              ?.charAt(0)
                              ?.toUpperCase()}
                          </div>

                          <div>
                            <p className="font-semibold text-gray-800">
                              {user.name}
                            </p>

                            <p className="text-xs text-gray-400">
                              ID #{user.id}
                            </p>
                          </div>

                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Mail size={16} />
                          {user.email}
                        </div>
                      </td>

                      <td className="px-6 py-4">

                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            user.role === "admin"
                              ? "bg-blue-50 text-blue-700"
                              : "bg-green-50 text-green-700"
                          }`}
                        >
                          {user.role === "admin"
                            ? "Admin"
                            : "Petugas"}
                        </span>

                      </td>

                      <td className="px-6 py-4">

                        <div className="flex justify-center gap-2">

                          <button
                            onClick={() =>
                              openEditModal(user)
                            }
                            className="rounded-lg p-2 text-blue-600 hover:bg-blue-50"
                            title="Edit"
                          >
                            <Pencil size={17} />
                          </button>

                          <button
                            onClick={() =>
                              handleDelete(user.id)
                            }
                            className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                            title="Nonaktifkan"
                          >
                            <Trash2 size={17} />
                          </button>

                        </div>

                      </td>

                    </tr>
                  ))}

                </tbody>

              </table>
            )}

          </div>

        </div>
      </main>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">

          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">

            {/* MODAL HEADER */}
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">

              <div>
                <h2 className="text-lg font-bold text-gray-800">
                  {editId
                    ? "Edit User"
                    : "Tambah User"}
                </h2>

                <p className="text-sm text-gray-500">
                  Isi informasi akun pengguna.
                </p>
              </div>

              <button
                onClick={closeModal}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
              >
                <X size={20} />
              </button>

            </div>

            {/* FORM */}
            <form
              onSubmit={handleSubmit}
              className="space-y-4 p-6"
            >

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              {/* NAME */}
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                  Nama
                </label>

                <div className="relative">
                  <UserRound
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Nama lengkap"
                    className="w-full rounded-xl border border-gray-200 py-3 pl-10 pr-4 outline-none focus:border-[#08753f]"
                  />
                </div>
              </div>

              {/* EMAIL */}
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">
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
                    placeholder="email@sitamu.com"
                    className="w-full rounded-xl border border-gray-200 py-3 pl-10 pr-4 outline-none focus:border-[#08753f]"
                  />
                </div>
              </div>

              {/* PASSWORD */}
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                  Password
                  {editId && (
                    <span className="ml-2 text-xs font-normal text-gray-400">
                      Kosongkan jika tidak ingin mengubah
                    </span>
                  )}
                </label>

                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder={
                    editId
                      ? "Password baru"
                      : "Password"
                  }
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-[#08753f]"
                />
              </div>

              {/* ROLE */}
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                  Role
                </label>

                <div className="relative">
                  <Shield
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <select
                    name="role"
                    value={form.role}
                    onChange={handleChange}
                    className="w-full appearance-none rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 outline-none focus:border-[#08753f]"
                  >
                    <option value="petugas">
                      Petugas
                    </option>

                    <option value="admin">
                      Admin
                    </option>
                  </select>
                </div>
              </div>

              {/* BUTTON */}
              <div className="flex justify-end gap-3 pt-3">

                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-xl border border-gray-200 px-5 py-3 font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 rounded-xl bg-[#08753f] px-5 py-3 font-semibold text-white hover:bg-[#075f34] disabled:opacity-60"
                >
                  {saving && (
                    <RefreshCw
                      size={17}
                      className="animate-spin"
                    />
                  )}

                  {saving
                    ? "Menyimpan..."
                    : editId
                    ? "Simpan Perubahan"
                    : "Tambah User"}
                </button>

              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}