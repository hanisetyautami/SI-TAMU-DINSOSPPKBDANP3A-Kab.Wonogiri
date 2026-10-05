import { useEffect, useState } from "react";

import {
  CheckCircle2,
  Info,
  Send,
  UserRound,
  Phone,
  Building2,
  MapPin,
  FileText,
  ChevronDown,
  Users,
  Landmark,
  CalendarDays,
  Paperclip,
} from "lucide-react";

import api from "../services/api";

const initialForm = {
  visit_type: "dinas",
  full_name: "",
  identity_number: "",
  phone: "",
  institution: "",
  email: "",
  department_id: "",
  purpose: "",
  host_name: "",
  notes: "",
  invitation_sender: "",
  letter_number: "",
  letter_date: "",
  letter_subject: "",
  event_date: "",
  event_place: "",
  letter_file: null,
};

const officialDepartments = [
  { id: "Pelayanan Sosial", name: "Pelayanan Sosial" },
  { id: "Sekretariat", name: "Sekretariat" },
  { id: "Bidang Pemberdayaan dan Rehabilitasi Sosial", name: "Bidang Pemberdayaan dan Rehabilitasi Sosial" },
  { id: "Bidang Perlindungan dan Jaminan Sosial dan Pemberdayaan Perempuan dan Perlindungan Anak", name: "Bidang Perlindungan dan Jaminan Sosial dan Pemberdayaan Perempuan dan Perlindungan Anak" },
  { id: "Bidang Pengendalian Penduduk dan Keluarga Berencana", name: "Bidang Pengendalian Penduduk dan Keluarga Berencana" },
  { id: "Bidang Keluarga Sejahtera", name: "Bidang Keluarga Sejahtera" },
];

export default function RegistrationDashboard() {
  const [form, setForm] = useState(initialForm);

  const [departments, setDepartments] = useState([]);
  const [qr, setQr] = useState("");

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState("");

  // =====================================================
  // AMBIL QR CODE DENGAN FALLBACK OTOMATIS
  // =====================================================

  useEffect(() => {
    api
      .get("/public/registration-qr")
      .then((response) => {
        const qrResult = response.data?.data?.qr_code || response.data?.qr_code;
        if (qrResult) {
          setQr(qrResult);
        } else {
          generateFallbackQr();
        }
      })
      .catch((err) => {
        console.warn("API QR Code tidak tersedia, menggunakan fallback otomatis.");
        generateFallbackQr();
      });
  }, []);

  const generateFallbackQr = () => {
    const currentUrl = window.location.href;
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(currentUrl)}`;
    setQr(qrApiUrl);
  };

  // =====================================================
  // AMBIL DATA DEPARTMENT
  // =====================================================

  useEffect(() => {
    api
      .get("/public/departments")
      .then((response) => {
        const data = Array.isArray(response.data?.data)
          ? response.data.data
          : [];
        setDepartments(data.length ? data : officialDepartments);
      })
      .catch((err) => {
        console.error("Gagal mengambil departments:", err);
        setDepartments(officialDepartments);
      });
  }, []);

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
  // HANDLE JENIS KUNJUNGAN
  // =====================================================

  const handleVisitTypeChange = (type) => {
    setForm((prev) => ({
      ...prev,
      visit_type: type,
      department_id: type === "masyarakat" ? "" : prev.department_id,
      letter_file: type === "undangan_tersurat" ? prev.letter_file : null,
    }));

    setError("");
  };

  // =====================================================
  // HANDLE FILE SURAT
  // =====================================================

  const handleLetterFileChange = (e) => {
    const file = e.target.files?.[0] || null;

    if (!file) {
      setForm((prev) => ({ ...prev, letter_file: null }));
      return;
    }

    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
    ];

    if (!allowedTypes.includes(file.type)) {
      setError("File surat harus PDF, JPG/JPEG, atau PNG.");
      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Ukuran file surat maksimal 5 MB.");
      e.target.value = "";
      return;
    }

    setError("");
    setForm((prev) => ({
      ...prev,
      letter_file: file,
    }));
  };

  // =====================================================
  // SUBMIT FORM
  // =====================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError("");
    setSuccess(null);

    try {
      if (form.visit_type === "undangan_tersurat" && !form.letter_file) {
        setError("File surat undangan wajib diunggah.");
        setLoading(false);
        return;
      }

      const formData = new FormData();

      Object.entries(form).forEach(([key, value]) => {
        if (key === "letter_file") {
          if (value instanceof File) {
            formData.append("letter_file", value);
          }
          return;
        }

        if (value !== null && value !== undefined) {
          formData.append(key, String(value));
        }
      });

     // =====================================================
// KIRIM DATA REGISTRASI + FILE SURAT
// =====================================================

const response = await fetch(
  "http://localhost:5000/api/visitors/public/register",
  {
    method: "POST",
    body: formData,
  }
);

const responseData = await response.json();

if (!response.ok) {
  throw {
    response: {
      data: responseData,
      status: response.status,
    },
  };
}

setSuccess(responseData?.data);

      setSuccess(response.data?.data);
      setForm(initialForm);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (err) {
      console.error("Registrasi gagal:", err);

      setError(
        err.response?.data?.message ||
          "Registrasi gagal. Silakan coba lagi."
      );
    } finally {
      setLoading(false);
    }
  };

  const displayedDepartments =
    form.visit_type === "masyarakat"
      ? departments.filter((department) =>
          String(department.name || "").toLowerCase() === "pelayanan sosial"
        )
      : departments.filter((department) =>
          String(department.name || "").toLowerCase() !== "pelayanan sosial"
        );

  return (
    <main className="min-h-screen bg-[#F4F7F6] text-gray-900">

      {/* HEADER */}
      <header className="w-full border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 md:px-8">
          <div className="flex items-center gap-3">
            <img
              src="/SI-TAMU-logo.jpg"
              alt="Logo SI-TAMU DINSOSPPKBP3A Kabupaten Wonogiri"
              className="h-12 w-12 object-contain"
            />
            <div>
              <h1 className="text-lg font-bold leading-none tracking-wide text-[#006B45]">
                SI-TAMU
              </h1>
              <p className="mt-1 text-[9px] font-semibold uppercase leading-tight text-gray-700">
                DINSOSPPKBP3A
              </p>
              <p className="text-[9px] uppercase leading-tight text-gray-500">
                KABUPATEN WONOGIRI
              </p>
            </div>
          </div>
          <div className="hidden rounded-full bg-[#E8F5EE] px-4 py-2 text-xs font-semibold text-[#006B45] sm:block shadow-sm">
            <i className="fa-solid fa-book-open-reader me-1.5"></i> BUKU TAMU DIGITAL
          </div>
        </div>
      </header>

      {/* CONTENT */}
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-8 md:py-10">

        <section className="mb-7 text-center">
          <div className="mb-3 inline-flex rounded-full bg-[#E7F4EC] px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-[#006B45]">
            DINSOSPPKBP3A Kabupaten Wonogiri
          </div>
          <h2 className="text-2xl font-bold text-gray-900 md:text-3xl">
            Buku Tamu Digital
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-gray-500">
            Silakan isi formulir di bawah ini sebelum memasuki area kantor.
          </p>
        </section>

        {success && (
          <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <CheckCircle2
                size={22}
                className="mt-0.5 shrink-0 text-green-600"
              />
              <div>
                <p className="font-semibold text-green-800">
                  Registrasi berhasil!
                </p>
                <p className="mt-1 text-sm text-green-700">
                  Kode kunjungan:
                  <span className="ml-1 font-bold">
                    {success?.visit_code ||
                      success?.registration_code ||
                      "-"}
                  </span>
                </p>
                {success?.visit_type && (
                  <p className="mt-1 text-xs text-green-700">
                    Jenis kunjungan:{" "}
                    {success.visit_type === "dinas"
                      ? "Kunjungan Dinas"
                      : success.visit_type === "undangan_tersurat"
                      ? "Undangan Tersurat"
                      : "Masyarakat Biasa"}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 shadow-sm">
            <p className="text-sm font-medium text-red-700">
              {error}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.5fr_0.8fr]">

          {/* FORM CARD */}
          <div className="rounded-2xl border-0 bg-white shadow-xl overflow-hidden">
            <div className="text-white text-center py-5 px-6" style={{ background: 'linear-gradient(135deg, #00864F, #0dcaf0)' }}>
              <h3 className="text-lg font-bold mb-1">
                <i className="fa-solid fa-book-open-reader me-2"></i> Formulir Buku Tamu
              </h3>
              <p className="mb-0 text-white/80 text-xs">Silakan lengkapi data kunjungan Anda dengan benar.</p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="p-5 md:p-7"
            >
              <div className="mb-6 border-b border-gray-100 pb-4">
                <p className="text-xs text-gray-500">
                  Kolom bertanda
                  <span className="mx-1 font-bold text-red-500">*</span>
                  wajib diisi.
                </p>
              </div>

              {/* JENIS KUNJUNGAN */}
              <div className="mb-6">
                <label className="mb-3 block text-sm font-semibold text-gray-700">
                  Jenis Kunjungan
                  <span className="ml-1 text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => handleVisitTypeChange("dinas")}
                    className={`flex items-center gap-3 rounded-xl border p-4 text-left transition ${
                      form.visit_type === "dinas"
                        ? "border-[#00864F] bg-[#EAF8F0] ring-1 ring-[#00864F]"
                        : "border-gray-200 bg-white hover:border-[#A8D8BC]"
                    }`}
                  >
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${
                        form.visit_type === "dinas"
                          ? "bg-[#00864F] text-white"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      <Landmark size={21} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        Kunjungan Dinas
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        Untuk pegawai atau instansi
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleVisitTypeChange("masyarakat")}
                    className={`flex items-center gap-3 rounded-xl border p-4 text-left transition ${
                      form.visit_type === "masyarakat"
                        ? "border-[#00864F] bg-[#EAF8F0] ring-1 ring-[#00864F]"
                        : "border-gray-200 bg-white hover:border-[#A8D8BC]"
                    }`}
                  >
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${
                        form.visit_type === "masyarakat"
                          ? "bg-[#00864F] text-white"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      <Users size={21} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        Masyarakat Biasa
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        Untuk masyarakat umum
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleVisitTypeChange("undangan_tersurat")}
                    className={`flex items-center gap-3 rounded-xl border p-4 text-left transition md:col-span-2 ${
                      form.visit_type === "undangan_tersurat"
                        ? "border-purple-600 bg-purple-50 ring-1 ring-purple-600"
                        : "border-gray-200 bg-white hover:border-purple-300"
                    }`}
                  >
                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${
                      form.visit_type === "undangan_tersurat"
                        ? "bg-purple-600 text-white"
                        : "bg-gray-100 text-gray-500"
                    }`}>
                      <FileText size={21} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Undangan Tersurat</p>
                      <p className="mt-1 text-xs text-gray-500">Untuk kunjungan berdasarkan surat undangan resmi</p>
                    </div>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <InputField
                  icon={UserRound}
                  label="Nama Lengkap"
                  name="full_name"
                  value={form.full_name}
                  onChange={handleChange}
                  placeholder="Masukkan nama lengkap"
                  required
                />

                <InputField
                  icon={FileText}
                  label={form.visit_type === "dinas" ? "NIK / NIP" : "NIK"}
                  name="identity_number"
                  value={form.identity_number}
                  onChange={handleChange}
                  placeholder={form.visit_type === "dinas" ? "Masukkan NIK / NIP" : "Masukkan NIK"}
                  required
                />

                <InputField
                  icon={Phone}
                  label="Nomor Telepon / WhatsApp"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="Contoh: 081234567890"
                />

                <InputField
                  icon={Building2}
                  label={
                    form.visit_type === "undangan_tersurat"
                      ? "Instansi / Pihak Pengundang"
                      : form.visit_type === "dinas"
                      ? "Instansi / Dinas"
                      : "Alamat"
                  }
                  name="institution"
                  value={form.institution}
                  onChange={handleChange}
                  placeholder={
                    form.visit_type === "undangan_tersurat"
                      ? "Nama instansi yang mengundang"
                      : form.visit_type === "dinas"
                      ? "Contoh: Dinas Kominfo"
                      : "Masukkan alamat"
                  }
                />

                {/* TUJUAN / BAGIAN DINSOSPPKB DAN P3A */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Tujuan / Bagian yang Dituju
                    <span className="ml-1 text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      name="department_id"
                      value={form.department_id}
                      onChange={handleChange}
                      required
                      className="h-11 w-full appearance-none rounded-lg border border-gray-200 bg-white px-4 pr-10 text-sm text-gray-700 outline-none transition focus:border-[#00864F] focus:ring-2 focus:ring-[#00864F]/10"
                    >
                      <option value="">Pilih bagian / tujuan kunjungan</option>
                      {displayedDepartments.map((department) => (
                        <option key={`department-${department.id}`} value={department.id}>
                          {department.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={17}
                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                  </div>
                  <p className="text-[11px] text-gray-500">
                    Untuk masyarakat, pilih Pelayanan Sosial. Untuk kunjungan dinas/undangan, pilih bagian yang dituju.
                  </p>
                </div>

                <InputField
                  icon={MapPin}
                  label="Nama Pejabat / Pegawai"
                  name="host_name"
                  value={form.host_name}
                  onChange={handleChange}
                  placeholder="Nama pegawai yang ditemui"
                />
              </div>

              {form.visit_type === "undangan_tersurat" && (
                <div className="mt-6 rounded-2xl border border-purple-100 bg-purple-50/50 p-5">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="rounded-xl bg-purple-100 p-2.5 text-purple-700">
                      <FileText size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">Data Surat Undangan</h4>
                      <p className="text-xs text-gray-500">Masukkan informasi yang tercantum pada surat undangan resmi.</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <InputField icon={FileText} label="Nomor Surat" name="letter_number" value={form.letter_number} onChange={handleChange} placeholder="Contoh: 005/123/2026" required />
                    <InputField icon={CalendarDays} label="Tanggal Surat" name="letter_date" type="date" value={form.letter_date} onChange={handleChange} required />
                    <InputField icon={FileText} label="Perihal Surat" name="letter_subject" value={form.letter_subject} onChange={handleChange} placeholder="Perihal undangan" required />
                    <InputField icon={CalendarDays} label="Tanggal Kegiatan" name="event_date" type="date" value={form.event_date} onChange={handleChange} required />
                    <InputField icon={MapPin} label="Tempat Kegiatan" name="event_place" value={form.event_place} onChange={handleChange} placeholder="Tempat pelaksanaan kegiatan" required />
                    <InputField icon={UserRound} label="Nama Pengundang / Penanggung Jawab" name="invitation_sender" value={form.invitation_sender} onChange={handleChange} placeholder="Nama pejabat/pihak pengundang" required />

                    <div className="space-y-2 md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        File Surat Undangan
                        <span className="ml-1 text-red-500">*</span>
                      </label>
                      <div className="rounded-xl border border-dashed border-purple-300 bg-white p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-100 text-purple-700">
                            <Paperclip size={18} />
                          </div>
                          <input
                            type="file"
                            name="letter_file"
                            accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                            onChange={handleLetterFileChange}
                            required
                            className="w-full text-sm text-gray-600 file:mr-4 file:rounded-lg file:border-0 file:bg-purple-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-purple-700"
                          />
                        </div>
                        <p className="mt-2 text-[11px] text-gray-500">PDF, JPG/JPEG, atau PNG. Maksimal 5 MB.</p>
                        {form.letter_file && (
                          <p className="mt-2 text-xs font-medium text-purple-700">File dipilih: {form.letter_file.name}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-5 space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Maksud & Keperluan
                  <span className="ml-1 text-red-500">*</span>
                </label>
                <textarea
                  name="purpose"
                  value={form.purpose}
                  onChange={handleChange}
                  required
                  rows={4}
                  placeholder="Tuliskan keperluan kunjungan Anda secara singkat"
                  className="w-full resize-none rounded-lg border border-gray-200 px-4 py-3 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-[#00864F] focus:ring-2 focus:ring-[#00864F]/10"
                />
              </div>

              <div className="mt-5">
                <InputField
                  icon={FileText}
                  label="Email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Masukkan email Anda"
                />
              </div>

              <div className="mt-5 space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Catatan Tambahan
                </label>
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Catatan tambahan jika diperlukan"
                  className="w-full resize-none rounded-lg border border-gray-200 px-4 py-3 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-[#00864F] focus:ring-2 focus:ring-[#00864F]/10"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#00864F] px-5 text-sm font-semibold text-white shadow-md transition hover:bg-[#006B3F] focus:outline-none focus:ring-2 focus:ring-[#00864F]/30 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Mengirim...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-paper-plane me-1"></i> Kirim Buku Tamu
                  </>
                )}
              </button>
            </form>
          </div>

          {/* QR CODE PANEL */}
          <aside className="h-fit rounded-2xl border border-gray-200 bg-white p-5 shadow-sm md:p-6">
            <div className="mb-5 flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#E7F4EC] text-[#00864F]">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                  <path d="M14 14h3v3h-3z" />
                  <path d="M18 18h3v3h-3z" />
                  <path d="M14 18h2" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Scan QR Code</h3>
                <p className="mt-1 text-xs leading-relaxed text-gray-500">
                  Gunakan kamera HP untuk membuka form registrasi ini.
                </p>
              </div>
            </div>

            <div className="flex justify-center rounded-xl border border-[#A8D8BC] bg-white p-5">
              {qr ? (
                <img src={qr} alt="QR Code Registrasi SI-TAMU" className="h-56 w-56 object-contain" />
              ) : (
                <div className="flex h-56 w-56 items-center justify-center">
                  <div className="text-center">
                    <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#00864F]" />
                    <p className="text-xs text-gray-500">Memuat QR Code...</p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-5 flex gap-3 rounded-lg border border-green-100 bg-green-50 p-3">
              <Info size={18} className="mt-0.5 shrink-0 text-[#00864F]" />
              <p className="text-xs leading-relaxed text-gray-600">
                QR Code ini adalah akses cepat menuju halaman registrasi pengunjung.
              </p>
            </div>

            <div className="mt-4 rounded-lg border border-gray-100 bg-gray-50 p-4">
              <p className="mb-2 text-xs font-semibold text-gray-700">Jenis kunjungan</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <Landmark size={15} className="text-[#00864F]" />
                  <span>Kunjungan Dinas</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <Users size={15} className="text-[#00864F]" />
                  <span>Masyarakat Biasa</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <FileText size={15} className="text-purple-600" />
                  <span>Undangan Tersurat</span>
                </div>
              </div>
            </div>
            <p className="mt-4 text-center text-xs leading-relaxed text-gray-500">
              Silakan scan QR Code yang tersedia di area pelayanan / resepsionis.
            </p>
          </aside>

        </div>
      </div>

      <footer className="mt-4 border-t border-gray-200 bg-white">
        <div className="mx-auto max-w-6xl px-5 py-5 text-center">
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} SI-TAMU DINSOSPPKBP3A Kabupaten Wonogiri. All Rights Reserved.
          </p>
        </div>
      </footer>
    </main>
  );
}

function InputField({
  icon: Icon,
  label,
  name,
  value,
  onChange,
  placeholder,
  required = false,
  type = "text",
}) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-gray-700">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>
      <div className="relative">
        <Icon
          size={17}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          placeholder={placeholder}
          className="h-11 w-full rounded-lg border border-gray-200 bg-white pl-10 pr-4 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-[#00864F] focus:ring-2 focus:ring-[#00864F]/10"
        />
      </div>
    </div>
  );
}