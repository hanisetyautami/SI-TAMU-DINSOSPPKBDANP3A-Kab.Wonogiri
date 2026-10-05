import React, { useMemo, useState } from "react";
import { Download, Eye, FileCheck2, Search, RefreshCw } from "lucide-react";

const API_BASE = "http://localhost:5000";

const getLetterUrl = (file) => {
  if (!file) return "";
  if (String(file).startsWith("http://") || String(file).startsWith("https://")) return file;
  return `${API_BASE}${String(file).startsWith("/") ? "" : "/"}${file}`;
};

export default function SuratUndangan({ visitors = [], loading, onRefresh }) {
  const [search, setSearch] = useState("");

  const letters = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return visitors.filter((visitor) => {
      const type = String(visitor.visit_type || "").toLowerCase();
      const isLetter = type.includes("undangan") || type === "undangan_tersurat";
      if (!isLetter) return false;
      if (!keyword) return true;
      return [
        visitor.full_name,
        visitor.institution,
        visitor.invitation_sender,
        visitor.letter_number,
        visitor.letter_subject,
        visitor.event_place,
      ].some((value) => String(value || "").toLowerCase().includes(keyword));
    });
  }, [visitors, search]);

  return (
    <>
      <div className="mb-7 flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">Surat Undangan</h1>
          <p className="mt-2 text-sm text-gray-500 sm:text-base">Kelola surat undangan tersurat yang masuk ke SI-TAMU.</p>
        </div>
        <button onClick={onRefresh} className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50">
          <RefreshCw size={18} /> Refresh
        </button>
      </div>

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-gray-100 p-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Daftar Surat Undangan</h2>
            <p className="mt-1 text-sm text-gray-500">Terdapat {letters.length} surat undangan tersurat.</p>
          </div>
          <div className="relative w-full lg:w-[360px]">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari nomor surat, pengundang..." className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-11 pr-4 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[1050px] w-full text-left">
            <thead className="bg-gray-50 text-xs font-bold uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-6 py-4">Nomor Surat</th>
                <th className="px-6 py-4">Pengundang</th>
                <th className="px-6 py-4">Perihal</th>
                <th className="px-6 py-4">Tanggal Kegiatan</th>
                <th className="px-6 py-4">Tempat</th>
                <th className="px-6 py-4 text-center">Surat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan="6" className="px-6 py-16 text-center text-gray-500"><RefreshCw size={25} className="mx-auto mb-3 animate-spin" />Memuat surat...</td></tr>
              ) : letters.length ? letters.map((visitor) => {
                const url = getLetterUrl(visitor.letter_file);
                return (
                  <tr key={visitor.id || visitor.visit_code} className="hover:bg-gray-50">
                    <td className="px-6 py-5 text-sm font-bold text-gray-900">{visitor.letter_number || "-"}</td>
                    <td className="px-6 py-5 text-sm text-gray-700">{visitor.invitation_sender || visitor.institution || "-"}</td>
                    <td className="max-w-[280px] px-6 py-5 text-sm text-gray-600">{visitor.letter_subject || visitor.purpose || "-"}</td>
                    <td className="px-6 py-5 text-sm text-gray-600">{visitor.event_date ? new Date(visitor.event_date).toLocaleDateString("id-ID") : "-"}</td>
                    <td className="px-6 py-5 text-sm text-gray-600">{visitor.event_place || "-"}</td>
                    <td className="px-6 py-5">
                      <div className="flex justify-center gap-2">
                        {url ? (
                          <>
                            <a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-purple-50 px-3 py-2 text-xs font-bold text-purple-700 hover:bg-purple-100"><Eye size={15} /> Lihat</a>
                            <a href={url} download className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100"><Download size={15} /> Unduh</a>
                          </>
                        ) : <span className="text-xs text-gray-400">File tidak tersedia</span>}
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr><td colSpan="6" className="px-6 py-16 text-center"><FileCheck2 size={40} className="mx-auto mb-3 text-gray-300" /><p className="font-semibold text-gray-500">Belum ada surat undangan tersurat.</p></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
