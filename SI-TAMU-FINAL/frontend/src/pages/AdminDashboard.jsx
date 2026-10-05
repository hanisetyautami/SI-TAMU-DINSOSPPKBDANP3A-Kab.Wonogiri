import React, {
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";

import axios from "axios";

import {
  LayoutDashboard,
  Users,
  FileText,
  Settings,
  UserCircle,
  LogOut,
  Menu,
  X,
  Plus,
  Download,
  Search,
  RefreshCw,
  Eye,
  CalendarDays,
  Building2,
  CheckCircle2,
  Clock3,
  UserRound,
  BriefcaseBusiness,
  AlertCircle,
  Pencil,
  Trash2,
} from "lucide-react";

/* =========================================================
   API CONFIG
========================================================= */

const API_URL = "http://localhost:5000/api";
const FILE_URL = "http://localhost:5000";

/* =========================================================
   MENU
========================================================= */

const menuItems = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    id: "visitors",
    label: "Data Kunjungan",
    icon: Users,
  },
  {
    id: "reports",
    label: "Laporan",
    icon: FileText,
  },
  {
    id: "settings",
    label: "Pengaturan",
    icon: Settings,
  },
  {
    id: "account",
    label: "Akun",
    icon: UserCircle,
  },
];

/* =========================================================
   GET USER
========================================================= */

function getStoredUser() {
  try {
    return JSON.parse(
      localStorage.getItem("sitamu_user") ||
        localStorage.getItem("loggedInUser") ||
        localStorage.getItem("user") ||
        "{}"
    );
  } catch {
    return {};
  }
}

/* =========================================================
   GET TOKEN
   Menggunakan sitamu_token sebagai utama
   dan token sebagai fallback
========================================================= */

function getAuthToken() {
  return (
    localStorage.getItem("sitamu_token") ||
    localStorage.getItem("token") ||
    ""
  );
}

/* =========================================================
   NORMALIZE VISITORS
   Mendukung berbagai bentuk response API
========================================================= */

function normalizeVisitors(responseData) {
  if (!responseData) {
    return [];
  }

  /* Array langsung */
  if (Array.isArray(responseData)) {
    return responseData;
  }

  /* { visitors: [] } */
  if (Array.isArray(responseData.visitors)) {
    return responseData.visitors;
  }

  /* { data: [] } */
  if (Array.isArray(responseData.data)) {
    return responseData.data;
  }

  /* { data: { visitors: [] } } */
  if (
    responseData.data &&
    Array.isArray(responseData.data.visitors)
  ) {
    return responseData.data.visitors;
  }

  /* { data: { recent: [] } } */
  if (
    responseData.data &&
    Array.isArray(responseData.data.recent)
  ) {
    return responseData.data.recent;
  }

  /* { data: { rows: [] } } */
  if (
    responseData.data &&
    Array.isArray(responseData.data.rows)
  ) {
    return responseData.data.rows;
  }

  /* { results: [] } */
  if (Array.isArray(responseData.results)) {
    return responseData.results;
  }

  return [];
}

/* =========================================================
   MAIN
========================================================= */

export default function AdminDashboard() {
  const [visitors, setVisitors] = useState([]);

  // FILTER TAMBAHAN: JENIS KUNJUNGAN DAN KECAMATAN
  const [visitCategory, setVisitCategory] = useState("semua");
  const [selectedKecamatan, setSelectedKecamatan] = useState("");

  const [activeMenu, setActiveMenu] =
    useState("dashboard");

  const [searchTerm, setSearchTerm] =
    useState("");

  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [selectedVisitor, setSelectedVisitor] =
    useState(null);

  /* =======================================================
     EDIT DATA KUNJUNGAN
  ======================================================= */

  const [showEditVisitor, setShowEditVisitor] =
    useState(false);

  const [editVisitor, setEditVisitor] =
    useState(null);

  const [editVisitorForm, setEditVisitorForm] =
    useState({
      full_name: "",
      identity_number: "",
      phone: "",
      institution: "",
      position: "",
      email: "",
      address: "",
      department_id: "",
      purpose: "",
      host_name: "",
      notes: "",
      status: "registered",
    });

  const [editVisitorLoading, setEditVisitorLoading] =
    useState(false);

  const [editVisitorError, setEditVisitorError] =
    useState("");
    /* =======================================================
     BUKA EDIT DATA KUNJUNGAN
  ======================================================= */

  const handleEditVisitor = (visitor) => {
    if (!visitor?.id) {
      alert("ID data kunjungan tidak ditemukan.");
      return;
    }

    setEditVisitor(visitor);
    setEditVisitorForm({
      full_name: visitor.full_name || "",
      identity_number: visitor.identity_number || "",
      phone: visitor.phone || "",
      institution: visitor.institution || "",
      position: visitor.position || "",
      email: visitor.email || "",
      address: visitor.address || visitor.alamat || "",
      department_id: visitor.department_id || "",
      purpose: visitor.purpose || "",
      host_name: visitor.host_name || "",
      notes: visitor.notes || "",
      status: visitor.status || "registered",
    });
    setEditVisitorError("");
    setShowEditVisitor(true);
  };

  const handleEditVisitorChange = (e) => {
    const { name, value } = e.target;
    setEditVisitorForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const closeEditVisitor = () => {
    if (editVisitorLoading) return;
    setShowEditVisitor(false);
    setEditVisitor(null);
    setEditVisitorError("");
  };

  const handleSaveEditVisitor = async (e) => {
    e.preventDefault();

    if (!editVisitor?.id) {
      setEditVisitorError("ID data kunjungan tidak ditemukan.");
      return;
    }

    if (!editVisitorForm.full_name.trim()) {
      setEditVisitorError("Nama lengkap wajib diisi.");
      return;
    }

    if (!editVisitorForm.identity_number.trim()) {
      setEditVisitorError("Nomor identitas wajib diisi.");
      return;
    }

    if (!editVisitorForm.purpose.trim()) {
      setEditVisitorError("Keperluan wajib diisi.");
      return;
    }

    try {
      setEditVisitorLoading(true);
      setEditVisitorError("");

      const token = getAuthToken();

      if (!token) {
        throw new Error("Sesi login tidak ditemukan. Silakan login kembali.");
      }

      const response = await axios.put(
        `${API_URL}/visitors/${editVisitor.id}`,
        editVisitorForm,
        {
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data?.success === false) {
        throw new Error(
          response.data?.message ||
            "Gagal memperbarui data kunjungan."
        );
      }

      const updatedVisitor = response.data?.data || {
        ...editVisitor,
        ...editVisitorForm,
      };

      setVisitors((currentVisitors) =>
        currentVisitors.map((item) =>
          String(item.id) === String(editVisitor.id)
            ? { ...item, ...updatedVisitor }
            : item
        )
      );

      setSelectedVisitor((currentVisitor) =>
        currentVisitor &&
        String(currentVisitor.id) === String(editVisitor.id)
          ? { ...currentVisitor, ...updatedVisitor }
          : currentVisitor
      );

      setShowEditVisitor(false);
      setEditVisitor(null);
      setEditVisitorError("");

      alert(
        response.data?.message ||
          "Data kunjungan berhasil diperbarui."
      );
    } catch (error) {
      console.error("UPDATE VISITOR ERROR:", error);
      setEditVisitorError(
        error?.response?.data?.message ||
          error?.message ||
          "Gagal memperbarui data kunjungan."
      );
    } finally {
      setEditVisitorLoading(false);
    }
  };

  /* =======================================================
   UPDATE STATUS KUNJUNGAN
======================================================= */

const updateVisitorStatus = async (
  visitorId,
  newStatus
) => {
  try {
    const token =
      localStorage.getItem("sitamu_token") ||
      localStorage.getItem("token");

    if (!token) {
      alert(
        "Sesi login tidak ditemukan. Silakan login kembali."
      );

      return;
    }

    const response =
      await axios.patch(
        `${API_URL}/visitors/${visitorId}/status`,
        {
          status: newStatus,
        },
        {
          headers: {
            Accept:
              "application/json",

            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${token}`,
          },
        }
      );

    if (
      response.data?.success === false
    ) {
      throw new Error(
        response.data?.message ||
          "Gagal mengubah status."
      );
    }

    // =================================================
    // UPDATE DATA DI STATE TANPA REFRESH HALAMAN
    // =================================================

    setVisitors((currentVisitors) =>
      currentVisitors.map(
        (visitor) =>
          String(visitor.id) ===
          String(visitorId)
            ? {
                ...visitor,
                status: newStatus,
              }
            : visitor
      )
    );

    // =================================================
    // UPDATE DATA YANG SEDANG DIBUKA DI MODAL
    // =================================================

    setSelectedVisitor((currentVisitor) => {
      if (
        !currentVisitor ||
        String(currentVisitor.id) !==
          String(visitorId)
      ) {
        return currentVisitor;
      }

      return {
        ...currentVisitor,
        status: newStatus,
      };
    });

  } catch (error) {

    console.error(
      "UPDATE STATUS ERROR:",
      error
    );

    alert(
      error?.response?.data?.message ||
        error?.message ||
        "Gagal mengubah status kunjungan."
    );
  }
};

  const [showManualModal, setShowManualModal] =
    useState(false);

  const [autoRefresh, setAutoRefresh] =
    useState(false);

  const [user] = useState(
    getStoredUser()
  );

  /* =======================================================
     FETCH VISITORS
  ======================================================= */

  const fetchVisitors = useCallback(
    async () => {
      try {
        setLoading(true);
        setErrorMessage("");

        /* =================================================
           AMBIL TOKEN
        ================================================= */

        const token = getAuthToken();

        /* =================================================
           TOKEN TIDAK ADA
        ================================================= */

        if (!token) {
          setErrorMessage(
            "Sesi login tidak ditemukan. Silakan login kembali."
          );

          setVisitors([]);
          setLoading(false);

          return;
        }

        /* =================================================
           CONFIG AXIOS
        ================================================= */

        const config = {
          headers: {
            Accept:
              "application/json",

            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${token}`,
          },
        };

        /* =================================================
           REQUEST
        ================================================= */

        const response =
          await axios.get(
            `${API_URL}/visitors`,
            config
          );

        /* =================================================
           VALIDASI RESPONSE
        ================================================= */

        if (
          response.data?.success === false
        ) {
          throw new Error(
            response.data?.message ||
              "API gagal mengambil data."
          );
        }

        /* =================================================
           NORMALIZE DATA
        ================================================= */

        const visitorData =
          normalizeVisitors(
            response.data
          );

        /* =================================================
           SET DATA
        ================================================= */

        setVisitors(
          Array.isArray(visitorData)
            ? visitorData
            : []
        );

      } catch (error) {
        console.error(
          "GET VISITORS ERROR:",
          error
        );

        /* =================================================
           401 / 403
        ================================================= */

        if (
          error?.response?.status === 401 ||
          error?.response?.status === 403
        ) {
          setErrorMessage(
            "Sesi login tidak valid atau sudah berakhir. Silakan login kembali."
          );
        }

        /* =================================================
           404
        ================================================= */

        else if (
          error?.response?.status === 404
        ) {
          setErrorMessage(
            "Endpoint /api/visitors tidak ditemukan. Periksa route backend SI-TAMU."
          );
        }

        /* =================================================
           500
        ================================================= */

        else if (
          error?.response?.status >= 500
        ) {
          setErrorMessage(
            error?.response?.data?.message ||
              "Terjadi error pada server/backend."
          );
        }

        /* =================================================
           NETWORK
        ================================================= */

        else if (
          error?.code === "ERR_NETWORK"
        ) {
          setErrorMessage(
            "Backend SI-TAMU tidak dapat dihubungi. Pastikan server berjalan di http://localhost:5000."
          );
        }

        /* =================================================
           ERROR LAIN
        ================================================= */

        else {
          setErrorMessage(
            error?.response?.data?.message ||
              error?.message ||
              "Gagal mengambil data kunjungan."
          );
        }

        setVisitors([]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    fetchVisitors();
  }, [fetchVisitors]);

  /* =======================================================
     AUTO REFRESH
  ======================================================= */

  useEffect(() => {
    if (!autoRefresh) {
      return;
    }

    const interval =
      setInterval(() => {
        fetchVisitors();
      }, 30000);

    return () => {
      clearInterval(interval);
    };
  }, [
    autoRefresh,
    fetchVisitors,
  ]);

  /* =======================================================
     SEARCH + FILTER KUNJUNGAN
  ======================================================= */

  const getVisitorKecamatan = useCallback((visitor) => {
    if (visitor?.kecamatan) {
      return String(visitor.kecamatan).trim();
    }

    const institution = String(visitor?.institution || "");
    const address = String(visitor?.address || visitor?.alamat || "");
    const source = `${institution}, ${address}`;

    const match = source.match(
      /(?:kec(?:amatan)?\.?\s*)([^,;]+)/i
    );

    return match?.[1] ? match[1].trim() : "";
  }, []);

  const kecamatanList = useMemo(() => {
    const result = new Set();

    visitors.forEach((visitor) => {
      const kecamatan = getVisitorKecamatan(visitor);

      if (kecamatan) {
        result.add(kecamatan);
      }
    });

    return Array.from(result).sort((a, b) =>
      a.localeCompare(b, "id")
    );
  }, [visitors, getVisitorKecamatan]);

  const filteredVisitors = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    return visitors.filter((visitor) => {
      const type = String(visitor.visit_type || "")
        .trim()
        .toLowerCase();

      const isDinas = type.includes("dinas");
      const isMasyarakat = type.includes("masyarakat");
      const isUndangan =
        type.includes("undangan") ||
        type === "undangan_tersurat";

      let matchCategory = true;

      if (visitCategory === "dinas") {
        matchCategory = isDinas;
      } else if (visitCategory === "masyarakat") {
        matchCategory = isMasyarakat;
      } else if (visitCategory === "undangan") {
        matchCategory = isUndangan;
      }

      if (!matchCategory) {
        return false;
      }

      const visitorKecamatan = getVisitorKecamatan(visitor)
        .toLowerCase();

      const matchKecamatan =
        !selectedKecamatan ||
        visitorKecamatan === selectedKecamatan.trim().toLowerCase();

      if (!matchKecamatan) {
        return false;
      }

      if (!keyword) {
        return true;
      }

      const values = [
        visitor.full_name,
        visitor.identity_number,
        visitor.institution,
        visitor.purpose,
        visitor.department_name,
        visitor.department,
        visitor.visit_type,
        visitor.status,
        visitor.visit_code,
        visitor.visitor_code,
        visitor.host_name,
        visitor.kecamatan,
        visitor.address,
        visitor.alamat,
        visitor.invitation_number,
        visitor.nomor_surat,
        visitor.invitation_date,
        visitor.tanggal_surat,
        visitor.letter_number,
        visitor.letter_date,
        visitor.letter_subject,
        visitor.invitation_sender,
        visitor.event_date,
        visitor.event_place,
        visitor.letter_file,
        visitor.perihal,
      ];

      return values.some((value) =>
        String(value || "").toLowerCase().includes(keyword)
      );
    });
  }, [
    visitors,
    searchTerm,
    visitCategory,
    selectedKecamatan,
    getVisitorKecamatan,
  ]);

  /* =======================================================
     STATISTICS
  ======================================================= */

  const statistics = useMemo(() => {
    const total =
      visitors.length;

    const dinas =
      visitors.filter(
        (visitor) => {
          const type =
            String(
              visitor.visit_type ||
                ""
            )
              .trim()
              .toLowerCase();

          return type === "dinas";
        }
      ).length;

    const masyarakat =
      visitors.filter(
        (visitor) => {
          const type =
            String(
              visitor.visit_type ||
                ""
            )
              .trim()
              .toLowerCase();

          return (
            type ===
              "masyarakat" ||
            type ===
              "masyarakat biasa"
          );
        }
      ).length;

    const undangan =
      visitors.filter((visitor) => {
        const type = String(visitor.visit_type || "")
          .trim()
          .toLowerCase();

        return (
          type.includes("undangan") ||
          type === "undangan_tersurat"
        );
      }).length;

    const active =
      visitors.filter(
        (visitor) => {
          const status =
            String(
              visitor.status ||
                ""
            )
              .trim()
              .toLowerCase();

          return [
            "checked_in",
            "checked-in",
            "check_in",
            "checkin",
            "active",
            "aktif",
            "sedang berkunjung",
            "sedang_berkunjung",
          ].includes(status);
        }
      ).length;

    return {
      total,
      dinas,
      masyarakat,
      undangan,
      active,
    };
  }, [visitors]);

  /* =======================================================
     MENU
  ======================================================= */

  const handleMenuClick = (
    menu
  ) => {
    setActiveMenu(menu);

    setSidebarOpen(false);

    setSearchTerm("");
  };

  /* =======================================================
     LOGOUT
  ======================================================= */

  const handleLogout = () => {
    localStorage.removeItem(
      "token"
    );

    localStorage.removeItem(
      "sitamu_token"
    );

    localStorage.removeItem(
      "loggedInUser"
    );

    localStorage.removeItem(
      "user"
    );

    localStorage.removeItem(
      "sitamu_user"
    );

    localStorage.removeItem(
      "isAuthenticated"
    );

    window.location.href =
      "/login";
  };

  /* =======================================================
     DOWNLOAD CSV
  ======================================================= */

  const downloadReport = () => {
    if (!visitors.length) {
      alert(
        "Belum ada data kunjungan."
      );

      return;
    }

    const headers = [
      "ID",
      "Kode Pengunjung",
      "Kode Kunjungan",
      "Nama",
      "Jenis Kunjungan",
      "NIK",
      "Telepon",
      "Instansi",
      "Email",
      "Tujuan Bagian",
      "Keperluan",
      "Bertemu Dengan",
      "Status",
      "Tanggal",
    ];

    const rows =
      visitors.map(
        (visitor) => [
          visitor.id || "",

          visitor.visitor_code ||
            "",

          visitor.visit_code ||
            "",

          visitor.full_name ||
            "",

          visitor.visit_type ||
            "",

          visitor.identity_number ||
            "",

          visitor.phone || "",

          visitor.institution ||
            "",

          visitor.email || "",

          visitor.department_name ||
            visitor.department ||
            "",

          visitor.purpose || "",

          visitor.host_name ||
            "",

          visitor.status || "",

          visitor.created_at
            ? new Date(
                visitor.created_at
              ).toLocaleString(
                "id-ID"
              )
            : "",
        ]
      );

    const csv = [
      headers,
      ...rows,
    ]
      .map((row) =>
        row
          .map(
            (value) =>
              `"${String(
                value
              ).replace(
                /"/g,
                '""'
              )}"`
          )
          .join(",")
      )
      .join("\n");

    const blob =
      new Blob(
        [
          "\ufeff" + csv,
        ],
        {
          type:
            "text/csv;charset=utf-8;",
        }
      );

    const url =
      URL.createObjectURL(
        blob
      );

    const link =
      document.createElement(
        "a"
      );

    link.href = url;

    link.download =
      `laporan-kunjungan-${new Date()
        .toISOString()
        .slice(0, 10)}.csv`;

    document.body.appendChild(
      link
    );

    link.click();

    document.body.removeChild(
      link
    );

    URL.revokeObjectURL(
      url
    );
  };

  /* =======================================================
     MANUAL REGISTRATION
  ======================================================= */

  const openManualRegistration =
    () => {
      setShowManualModal(
        true
      );
    };

  /* =======================================================
     DASHBOARD
  ======================================================= */

  const renderDashboard =
    () => (
      <>
        <PageHeader
          title="Dashboard Monitoring Tamu"
          subtitle="Monitoring kunjungan dinas dan masyarakat DINSOSPPKBP3A Wonogiri"
          onManual={
            openManualRegistration
          }
          onDownload={
            downloadReport
          }
        />

        {/* STATISTICS */}

        <div className="mb-7 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-5">

          <StatCard
            title="Total Kunjungan"
            value={
              statistics.total
            }
            icon={Users}
            iconClass="bg-gray-100 text-gray-700"
          />

          <StatCard
            title="Kunjungan Dinas"
            value={
              statistics.dinas
            }
            icon={
              BriefcaseBusiness
            }
            iconClass="bg-green-50 text-green-700"
          />

          <StatCard
            title="Masyarakat Biasa"
            value={
              statistics.masyarakat
            }
            icon={UserRound}
            iconClass="bg-blue-50 text-blue-700"
          />

          <StatCard
            title="Undangan Tersurat"
            value={statistics.undangan}
            icon={FileText}
            iconClass="bg-purple-50 text-purple-700"
          />

          <StatCard
            title="Sedang Berkunjung"
            value={
              statistics.active
            }
            icon={Clock3}
            iconClass="bg-yellow-50 text-yellow-700"
          />

        </div>

        {/* VISITOR DATA */}

        <VisitorSection
          title="Riwayat Data Kunjungan"
          visitors={filteredVisitors.slice(
            0,
            8
          )}
          loading={loading}
          errorMessage={
            errorMessage
          }
          searchTerm={
            searchTerm
          }
          setSearchTerm={
            setSearchTerm
          }
          onRefresh={
            fetchVisitors
          }
          onDetail={
            setSelectedVisitor
          }
          onEdit={
            handleEditVisitor
          }
        />
      </>
    );

  /* =======================================================
     VISITORS
  ======================================================= */

  const renderVisitors =
    () => (
      <>
        <PageHeader
          title="Data Kunjungan"
          subtitle="Kelola seluruh data pengunjung SI-TAMU."
          onManual={
            openManualRegistration
          }
          onDownload={
            downloadReport
          }
        />

        <VisitorSection
          title="Seluruh Data Kunjungan"
          visitors={
            filteredVisitors
          }
          loading={loading}
          errorMessage={
            errorMessage
          }
          searchTerm={
            searchTerm
          }
          setSearchTerm={
            setSearchTerm
          }
          onRefresh={
            fetchVisitors
          }
          onDetail={
            setSelectedVisitor
          }
          onEdit={
            handleEditVisitor
          }
          showVisitFilters={true}
          visitCategory={visitCategory}
          setVisitCategory={setVisitCategory}
          selectedKecamatan={selectedKecamatan}
          setSelectedKecamatan={setSelectedKecamatan}
          kecamatanList={kecamatanList}
        />
      </>
    );

  /* =======================================================
     REPORT
  ======================================================= */

  const renderReports =
    () => (
      <>
        <PageHeader
          title="Laporan Kunjungan"
          subtitle="Rekap data kunjungan SI-TAMU."
          onDownload={
            downloadReport
          }
        />

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-5">

          <StatCard
            title="Total"
            value={
              statistics.total
            }
            icon={Users}
            iconClass="bg-gray-100 text-gray-700"
          />

          <StatCard
            title="Dinas"
            value={
              statistics.dinas
            }
            icon={
              BriefcaseBusiness
            }
            iconClass="bg-green-50 text-green-700"
          />

          <StatCard
            title="Masyarakat"
            value={
              statistics.masyarakat
            }
            icon={UserRound}
            iconClass="bg-blue-50 text-blue-700"
          />

          <StatCard
            title="Undangan Tersurat"
            value={statistics.undangan}
            icon={FileText}
            iconClass="bg-purple-50 text-purple-700"
          />

          <StatCard
            title="Aktif"
            value={
              statistics.active
            }
            icon={
              CheckCircle2
            }
            iconClass="bg-yellow-50 text-yellow-700"
          />

        </div>

        <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-7 shadow-sm">

          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Export Data
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Unduh data kunjungan
                dalam format CSV.
              </p>
            </div>

            <button
              onClick={
                downloadReport
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700"
            >
              <Download
                size={18}
              />

              Unduh Laporan
            </button>

          </div>

        </div>
      </>
    );

  /* =======================================================
     SETTINGS
  ======================================================= */

  const renderSettings =
    () => (
      <>
        <PageHeader
          title="Pengaturan"
          subtitle="Pengaturan dashboard SI-TAMU."
        />

        <section className="max-w-4xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

          {/* AUTO REFRESH */}

          <div className="flex items-center justify-between border-b border-gray-100 p-7">

            <div className="flex items-start gap-4">

              <div className="rounded-xl bg-green-50 p-3 text-green-700">
                <RefreshCw
                  size={22}
                />
              </div>

              <div>
                <h2 className="font-bold text-gray-900">
                  Refresh otomatis
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Perbarui data setiap
                  30 detik.
                </p>
              </div>

            </div>

            <button
              type="button"
              onClick={() =>
                setAutoRefresh(
                  (value) =>
                    !value
                )
              }
              className={`relative h-7 w-12 rounded-full transition ${
                autoRefresh
                  ? "bg-green-600"
                  : "bg-gray-300"
              }`}
            >
              <span
                className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${
                  autoRefresh
                    ? "left-6"
                    : "left-1"
                }`}
              />
            </button>

          </div>

          {/* MANUAL REFRESH */}

          <div className="flex flex-col gap-5 p-7 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <h2 className="font-bold text-gray-900">
                Refresh manual
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Ambil data terbaru
                dari database.
              </p>
            </div>

            <button
              onClick={
                fetchVisitors
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-5 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50"
            >
              <RefreshCw
                size={18}
              />

              Refresh
            </button>

          </div>

        </section>
      </>
    );

  /* =======================================================
     ACCOUNT
  ======================================================= */

  const renderAccount =
    () => (
      <>
        <PageHeader
          title="Akun"
          subtitle="Informasi akun administrator."
        />

        <section className="max-w-4xl rounded-2xl border border-gray-200 bg-white p-7 shadow-sm">

          <div className="flex items-center gap-5 border-b border-gray-100 pb-6">

            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-green-50 text-green-700">
              <UserCircle
                size={40}
              />
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {user?.full_name ||
                  user?.name ||
                  "Administrator"}
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                {user?.email ||
                  "Admin SI-TAMU"}
              </p>
            </div>

          </div>

          <div className="grid gap-4 pt-6 sm:grid-cols-2">

            <InfoBox
              label="Nama"
              value={
                user?.full_name ||
                user?.name ||
                "-"
              }
            />

            <InfoBox
              label="Email"
              value={
                user?.email || "-"
              }
            />

            <InfoBox
              label="Role"
              value={
                user?.role ||
                "Admin"
              }
            />

            <InfoBox
              label="Status"
              value="Aktif"
            />

          </div>

          <button
            onClick={
              handleLogout
            }
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-red-50 px-5 py-3 text-sm font-bold text-red-700 hover:bg-red-100"
          >
            <LogOut
              size={18}
            />

            Keluar
          </button>

        </section>
      </>
    );

  /* =======================================================
     CONTENT
  ======================================================= */

  const content = {
    dashboard:
      renderDashboard,

    visitors:
      renderVisitors,

    reports:
      renderReports,

    settings:
      renderSettings,

    account:
      renderAccount,
  };

  const currentPage =
    content[activeMenu] ||
    renderDashboard;

  /* =======================================================
     RETURN
  ======================================================= */

  return (
    <div className="min-h-screen bg-[#F5F8F6]">

      {/* MOBILE OVERLAY */}

      {sidebarOpen && (
        <div
          onClick={() =>
            setSidebarOpen(
              false
            )
          }
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
        />
      )}

      {/* ===================================================
          SIDEBAR
      =================================================== */}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50
          flex w-[270px] flex-col
          bg-[#075C38]
          text-white
          shadow-xl
          transition-transform
          duration-300
          lg:translate-x-0
          ${
            sidebarOpen
              ? "translate-x-0"
              : "-translate-x-full"
          }
        `}
      >

        {/* LOGO */}

        <div className="p-5">

          <div className="flex items-center justify-between border-b border-white/10 px-2 pb-5">

            <div className="flex items-center gap-3">

              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-red-600 text-[10px] font-black leading-3">
                SI-
                <br />
                TAMU
              </div>

              <div>
                <h1 className="text-sm font-extrabold">
                  SI-TAMU
                </h1>

                <p className="text-[9px] leading-4 text-green-100">
                  DINSOSPPKBP3A
                  <br />
                  WONOGIRI
                </p>
              </div>

            </div>

            <button
              onClick={() =>
                setSidebarOpen(
                  false
                )
              }
              className="rounded-lg p-2 hover:bg-white/10 lg:hidden"
            >
              <X size={20} />
            </button>

          </div>

          {/* MENU */}

          <nav className="mt-7 space-y-2">

            {menuItems.map(
              ({
                id,
                label,
                icon: Icon,
              }) => {

                const active =
                  activeMenu ===
                  id;

                return (
                  <button
                    key={id}
                    onClick={() =>
                      handleMenuClick(
                        id
                      )
                    }
                    className={`
                      flex w-full
                      items-center gap-4
                      rounded-xl
                      px-4 py-3.5
                      text-left
                      text-sm
                      font-semibold
                      transition
                      ${
                        active
                          ? "bg-[#06482D] text-white shadow"
                          : "text-green-100 hover:bg-white/10 hover:text-white"
                      }
                    `}
                  >

                    <Icon
                      size={20}
                      strokeWidth={
                        active
                          ? 2.5
                          : 2
                      }
                    />

                    <span>
                      {label}
                    </span>

                  </button>
                );
              }
            )}

          </nav>

        </div>

        {/* LOGOUT */}

        <div className="mt-auto p-5">

          <button
            onClick={
              handleLogout
            }
            className="flex w-full items-center gap-4 border-t border-white/10 px-3 pt-5 text-sm font-semibold text-red-100 hover:text-white"
          >
            <LogOut
              size={20}
            />

            Keluar
          </button>

        </div>

      </aside>

      {/* ===================================================
          MAIN
      =================================================== */}

      <main className="min-h-screen lg:pl-[270px]">

        {/* MOBILE HEADER */}

        <div className="sticky top-0 z-30 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 lg:hidden">

          <button
            onClick={() =>
              setSidebarOpen(
                true
              )
            }
            className="rounded-xl border border-gray-200 p-2"
          >
            <Menu size={22} />
          </button>

          <div className="text-center">

            <p className="text-sm font-extrabold text-[#075C38]">
              SI-TAMU
            </p>

            <p className="text-[10px] text-gray-500">
              Admin Dashboard
            </p>

          </div>

          <button
            onClick={
              fetchVisitors
            }
            className="rounded-xl border border-gray-200 p-2"
          >
            <RefreshCw
              size={19}
            />
          </button>

        </div>

        {/* CONTENT */}

        <div className="w-full px-5 py-7 sm:px-7 lg:px-8 xl:px-10">

          {currentPage()}

        </div>

      </main>

      {/* ===================================================
          DETAIL
      =================================================== */}

      {selectedVisitor && (
        <VisitorDetailModal
          visitor={
            selectedVisitor
          }
          onClose={() =>
            setSelectedVisitor(
              null
            )
          }
        />
      )}

      {/* ===================================================
          EDIT VISITOR
      =================================================== */}

      {showEditVisitor && (
        <EditVisitorModal
          visitor={editVisitor}
          form={editVisitorForm}
          errorMessage={editVisitorError}
          loading={editVisitorLoading}
          onChange={handleEditVisitorChange}
          onClose={closeEditVisitor}
          onSubmit={handleSaveEditVisitor}
        />
      )}

      {/* ===================================================
          MANUAL
      =================================================== */}

      {showManualModal && (
        <ManualModal
          onClose={() =>
            setShowManualModal(
              false
            )
          }
        />
      )}

    </div>
  );
}

/* =========================================================
   PAGE HEADER
========================================================= */

function PageHeader({
  title,
  subtitle,
  onManual,
  onDownload,
}) {
  return (
    <div className="mb-7 flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">

      <div>

        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
          {title}
        </h1>

        <p className="mt-2 text-sm text-gray-500 sm:text-base">
          {subtitle}
        </p>

      </div>

      <div className="flex flex-wrap gap-3">

        {onManual && (
          <button
            onClick={
              onManual
            }
            className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-green-700"
          >
            <Plus size={18} />

            Registrasi Manual
          </button>
        )}

        {onDownload && (
          <button
            onClick={
              onDownload
            }
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-blue-700"
          >
            <Download
              size={18}
            />

            Unduh Laporan
          </button>
        )}

      </div>

    </div>
  );
}

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
  title,
  value,
  icon: Icon,
  iconClass,
}) {
  return (
    <div className="min-h-[145px] rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

      <div className="flex items-start justify-between">

        <div>

          <p className="text-sm font-semibold text-gray-500">
            {title}
          </p>

          <p className="mt-4 text-4xl font-extrabold text-gray-900">
            {value}
          </p>

        </div>

        <div
          className={`rounded-xl p-3 ${iconClass}`}
        >
          <Icon size={22} />
        </div>

      </div>

    </div>
  );
}

/* =========================================================
   VISITOR SECTION
========================================================= */

function VisitorSection({
  title,
  visitors,
  loading,
  errorMessage,
  searchTerm,
  setSearchTerm,
  onRefresh,
  onDetail,
  onEdit,
  showVisitFilters = false,
  visitCategory = "semua",
  setVisitCategory = () => {},
  selectedKecamatan = "",
  setSelectedKecamatan = () => {},
  kecamatanList = [],
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

      {/* HEADER */}

      <div className="flex flex-col gap-5 border-b border-gray-100 p-6 lg:flex-row lg:items-center lg:justify-between">

        <div>

          <h2 className="text-xl font-bold text-gray-900">
            {title}
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Menampilkan data kunjungan yang tersimpan di database.
          </p>

        </div>

        <div className="flex flex-col gap-3 sm:flex-row">

          <SearchBox
            value={searchTerm}
            onChange={
              setSearchTerm
            }
          />

          <button
            onClick={onRefresh}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            <RefreshCw
              size={18}
            />

            Refresh
          </button>

        </div>

      </div>

      {/* FILTER DATA KUNJUNGAN */}

      {showVisitFilters && (
        <div className="border-b border-gray-100 bg-gray-50/70 px-6 py-5">
          <div className="flex flex-col gap-4">

            <div>
              <h3 className="text-sm font-semibold text-gray-700">
                Filter Data Kunjungan
              </h3>
              <p className="mt-1 text-xs text-gray-500">
                Pilih jenis kunjungan dan kecamatan untuk menampilkan data tertentu.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setVisitCategory("semua")}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                  visitCategory === "semua"
                    ? "bg-gray-800 text-white"
                    : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-100"
                }`}
              >
                Semua Kunjungan
              </button>

              <button
                type="button"
                onClick={() => setVisitCategory("masyarakat")}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                  visitCategory === "masyarakat"
                    ? "bg-blue-600 text-white"
                    : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-100"
                }`}
              >
                Kunjungan Masyarakat
              </button>

              <button
                type="button"
                onClick={() => setVisitCategory("dinas")}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                  visitCategory === "dinas"
                    ? "bg-green-600 text-white"
                    : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-100"
                }`}
              >
                Kunjungan Dinas
              </button>

              <button
                type="button"
                onClick={() => setVisitCategory("undangan")}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                  visitCategory === "undangan"
                    ? "bg-purple-600 text-white"
                    : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-100"
                }`}
              >
                Undangan Tersurat
              </button>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <select
                value={selectedKecamatan}
                onChange={(e) => setSelectedKecamatan(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 sm:max-w-xs"
              >
                <option value="">Semua Kecamatan</option>
                {kecamatanList.map((kecamatan) => (
                  <option key={kecamatan} value={kecamatan}>
                    {kecamatan}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => {
                  setVisitCategory("semua");
                  setSelectedKecamatan("");
                }}
                className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100"
              >
                Reset Filter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ERROR */}

      {errorMessage && (
        <div className="m-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">

          <AlertCircle
            size={20}
            className="mt-0.5 shrink-0"
          />

          <div>

            <p className="font-bold">
              Gagal mengambil data
            </p>

            <p className="mt-1">
              {errorMessage}
            </p>

          </div>

        </div>
      )}

      {/* TABLE */}

      <div className="overflow-x-auto">

        <table className="min-w-[1150px] w-full text-left">

          <thead>

            <tr className="border-b border-gray-100 bg-gray-50 text-xs font-bold uppercase tracking-wide text-gray-500">

              <th className="px-6 py-4">
                Waktu
              </th>

              <th className="px-6 py-4">
                Nama Tamu
              </th>

              <th className="px-6 py-4">
                Jenis
              </th>

              <th className="px-6 py-4">
                Keperluan
              </th>

              <th className="px-6 py-4">
                Tujuan Bagian
              </th>

              <th className="px-6 py-4">
                Status
              </th>

              <th className="px-6 py-4 text-center">
                Aksi
              </th>

            </tr>

          </thead>

          <tbody className="divide-y divide-gray-100">

            {loading ? (
              <tr>

                <td
                  colSpan="7"
                  className="px-6 py-16 text-center text-gray-500"
                >

                  <RefreshCw
                    size={25}
                    className="mx-auto mb-3 animate-spin"
                  />

                  Memuat data
                  kunjungan...

                </td>

              </tr>
            ) : visitors.length > 0 ? (
              visitors.map(
                (visitor) => (
                  <VisitorRow
                    key={
                      visitor.id ||
                      visitor.visit_code ||
                      visitor.visitor_code
                    }
                    visitor={
                      visitor
                    }
                    onDetail={
                      onDetail
                    }
                    onEdit={
                      onEdit
                    }
                  />
                )
              )
            ) : (
              <tr>

                <td
                  colSpan="7"
                  className="px-6 py-16 text-center"
                >

                  <Users
                    size={40}
                    className="mx-auto mb-3 text-gray-300"
                  />

                  <p className="font-semibold text-gray-500">
                    Tidak ada data
                    kunjungan
                    ditemukan.
                  </p>

                </td>

              </tr>
            )}

          </tbody>

        </table>

      </div>

    </section>
  );
}

/* =========================================================
   SEARCH
========================================================= */

function SearchBox({
  value,
  onChange,
}) {
  return (
    <div className="relative w-full sm:w-[320px]">

      <Search
        size={18}
        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
      />

      <input
        value={value}
        onChange={(e) =>
          onChange(
            e.target.value
          )
        }
        placeholder="Cari nama, NIK, atau instansi..."
        className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-11 pr-4 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
      />

    </div>
  );
}

/* =========================================================
   ROW
========================================================= */

function VisitorRow({
  visitor,
  onDetail,
  onEdit,
}) {
  const type =
    String(
      visitor.visit_type ||
        ""
    )
      .trim()
      .toLowerCase();

  const status =
    String(
      visitor.status ||
        ""
    )
      .trim()
      .toLowerCase();

  const isDinas =
    type.includes("dinas");

  const isUndangan =
    type.includes("undangan") ||
    type === "undangan_tersurat";

  const isActive =
    [
      "checked_in",
      "checked-in",
      "check_in",
      "checkin",
      "active",
      "aktif",
      "sedang berkunjung",
      "sedang_berkunjung",
    ].includes(status);

  const isCheckedOut =
    [
      "checked_out",
      "checked-out",
      "check_out",
      "checkout",
      "selesai",
    ].includes(status);

  return (
    <tr className="transition hover:bg-gray-50">

      {/* WAKTU */}

      <td className="whitespace-nowrap px-6 py-5 text-sm text-gray-500">

        <div className="flex items-center gap-2">

          <CalendarDays
            size={16}
            className="text-gray-400"
          />

          {visitor.created_at
            ? new Date(
                visitor.created_at
              ).toLocaleDateString(
                "id-ID"
              )
            : visitor.updated_at
            ? new Date(
                visitor.updated_at
              ).toLocaleDateString(
                "id-ID"
              )
            : "-"}

        </div>

      </td>

      {/* NAMA */}

      <td className="px-6 py-5">

        <p className="font-bold text-gray-900">
          {visitor.full_name ||
            "-"}
        </p>

        <p className="mt-1 text-xs text-gray-400">
          {visitor.institution ||
            "-"}
        </p>

      </td>

      {/* JENIS */}

      <td className="px-6 py-5">

        <span
          className={`inline-flex rounded-full px-3 py-1.5 text-xs font-bold ${
            isUndangan
              ? "bg-purple-50 text-purple-700"
              : isDinas
              ? "bg-green-50 text-green-700"
              : "bg-blue-50 text-blue-700"
          }`}
        >
          {isUndangan
            ? "Undangan Tersurat"
            : isDinas
            ? "Kunjungan Dinas"
            : "Kunjungan Masyarakat"}
        </span>

      </td>

      {/* KEPERLUAN */}

      <td className="max-w-[260px] px-6 py-5 text-sm text-gray-600">

        <span className="line-clamp-2">
          {visitor.purpose ||
            "-"}
        </span>

      </td>

      {/* TUJUAN */}

      <td className="px-6 py-5 text-sm text-gray-600">

        <div className="flex items-center gap-2">

          <Building2
            size={16}
            className="text-gray-400"
          />

          {visitor.department_name ||
            visitor.department ||
            "-"}

        </div>

      </td>

      {/* STATUS */}

      <td className="px-6 py-5">

        <span
          className={`inline-flex rounded-full px-3 py-1.5 text-xs font-bold ${
            isActive
              ? "bg-yellow-50 text-yellow-700"
              : isCheckedOut
              ? "bg-green-50 text-green-700"
              : "bg-gray-100 text-gray-600"
          }`}
        >

          {isActive
            ? "Sedang Berkunjung"
            : isCheckedOut
            ? "Selesai"
            : visitor.status ||
              "Terdaftar"}

        </span>

      </td>

      {/* AKSI */}

      <td className="px-6 py-5 text-center">

        <div className="flex items-center justify-center gap-1">

          <button
            type="button"
            onClick={() =>
              onDetail(visitor)
            }
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold text-blue-600 hover:bg-blue-50"
          >
            <Eye size={16} />
            Detail
          </button>

          {onEdit && visitor.id && (
            <button
              type="button"
              onClick={() =>
                onEdit(visitor)
              }
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold text-green-600 hover:bg-green-50"
              title="Edit data kunjungan"
            >
              <Pencil size={16} />
              Edit
            </button>
          )}

        </div>

      </td>

    </tr>
  );
}

/* =========================================================
   EDIT VISITOR MODAL
========================================================= */

function EditVisitorModal({
  visitor,
  form,
  errorMessage,
  loading,
  onChange,
  onClose,
  onSubmit,
}) {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">

        <div className="flex items-center justify-between border-b border-gray-100 p-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Edit Data Kunjungan
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Perbarui data tamu dan status kunjungan.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-xl p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-50"
          >
            <X size={22} />
          </button>
        </div>

        {errorMessage && (
          <div className="mx-6 mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {errorMessage}
          </div>
        )}

        <form onSubmit={onSubmit} className="overflow-y-auto p-6">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

            <EditInput
              label="Nama Lengkap"
              name="full_name"
              value={form.full_name}
              onChange={onChange}
              required
            />

            <EditInput
              label="No. Identitas"
              name="identity_number"
              value={form.identity_number}
              onChange={onChange}
              required
            />

            <EditInput
              label="No. Telepon"
              name="phone"
              value={form.phone}
              onChange={onChange}
            />

            <EditInput
              label="Instansi / Alamat"
              name="institution"
              value={form.institution}
              onChange={onChange}
            />

            <EditInput
              label="Jabatan / Posisi"
              name="position"
              value={form.position}
              onChange={onChange}
            />

            <EditInput
              label="Email"
              name="email"
              type="email"
              value={form.email}
              onChange={onChange}
            />

            <EditInput
              label="Bertemu Dengan"
              name="host_name"
              value={form.host_name}
              onChange={onChange}
            />

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Status Kunjungan
              </label>
              <input
                type="text"
                name="status"
                value={form.status}
                onChange={onChange}
                placeholder="Masukkan status kunjungan"
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100"
              />
            </div>
          </div>

          <EditTextarea
            label="Alamat Lengkap"
            name="address"
            value={form.address}
            onChange={onChange}
          />

          <EditTextarea
            label="Keperluan"
            name="purpose"
            value={form.purpose}
            onChange={onChange}
            required
          />

          <EditTextarea
            label="Catatan"
            name="notes"
            value={form.notes}
            onChange={onChange}
          />

          {visitor?.visit_type && (
            <div className="mt-5 rounded-xl bg-gray-50 p-4 text-sm text-gray-600">
              <span className="font-semibold">Jenis kunjungan:</span>{" "}
              {visitor.visit_type}
            </div>
          )}

          <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-5">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-[#08753f] px-6 py-3 text-sm font-bold text-white hover:bg-[#075f34] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditInput({
  label,
  name,
  value,
  onChange,
  type = "text",
  required = false,
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-gray-700">
        {label}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100"
      />
    </div>
  );
}

function EditTextarea({
  label,
  name,
  value,
  onChange,
  required = false,
}) {
  return (
    <div className="mt-5">
      <label className="mb-2 block text-sm font-semibold text-gray-700">
        {label}
      </label>
      <textarea
        name={name}
        rows="3"
        value={value}
        onChange={onChange}
        required={required}
        className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100"
      />
    </div>
  );
}

/* =========================================================
   INFO BOX
========================================================= */

function InfoBox({
  label,
  value,
}) {
  return (
    <div className="rounded-xl bg-gray-50 p-4">

      <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-semibold text-gray-800">
        {value}
      </p>

    </div>
  );
}

/* =========================================================
   DETAIL MODAL
========================================================= */

function VisitorDetailModal({
  visitor,
  onClose,
}) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">

      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">

        {/* HEADER */}

        <div className="flex items-center justify-between border-b border-gray-100 p-6">

          <div>

            <h2 className="text-xl font-bold text-gray-900">
              Detail Kunjungan
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Informasi lengkap tamu.
            </p>

          </div>

          <button
            onClick={
              onClose
            }
            className="rounded-xl p-2 text-gray-500 hover:bg-gray-100"
          >
            <X size={21} />
          </button>

        </div>

        {/* DATA */}

        <div className="grid gap-4 p-6 sm:grid-cols-2">

          <InfoBox
            label="Nama Lengkap"
            value={
              visitor.full_name ||
              "-"
            }
          />

          <InfoBox
            label="NIK / Identitas"
            value={
              visitor.identity_number ||
              "-"
            }
          />

          <InfoBox
            label="No. Telepon"
            value={
              visitor.phone || "-"
            }
          />

          <InfoBox
            label="Email"
            value={
              visitor.email || "-"
            }
          />

          <InfoBox
            label="Instansi"
            value={
              visitor.institution ||
              "-"
            }
          />

          <InfoBox
            label="Jenis"
            value={
              visitor.visit_type ||
              "-"
            }
          />

          <InfoBox
            label="Tujuan Bagian"
            value={
              visitor.department_name ||
              visitor.department ||
              "-"
            }
          />

          <InfoBox
            label="Bertemu Dengan"
            value={
              visitor.host_name ||
              "-"
            }
          />

          <InfoBox
            label="Kode Pengunjung"
            value={
              visitor.visitor_code ||
              "-"
            }
          />

          <InfoBox
            label="Kode Kunjungan"
            value={
              visitor.visit_code ||
              "-"
            }
          />

          <InfoBox
            label="Status"
            value={
              visitor.status ||
              "-"
            }
          />

          <InfoBox
            label="Tanggal"
            value={
              visitor.created_at
                ? new Date(
                    visitor.created_at
                  ).toLocaleString(
                    "id-ID"
                  )
                : visitor.updated_at
                ? new Date(
                    visitor.updated_at
                  ).toLocaleString(
                    "id-ID"
                  )
                : "-"
            }
          />

          <div className="sm:col-span-2">

            <InfoBox
              label="Keperluan"
              value={
                visitor.purpose ||
                "-"
              }
            />

          </div>

          {String(visitor.visit_type || "").toLowerCase().includes("undangan") && (
            <div className="sm:col-span-2 rounded-2xl border border-purple-100 bg-purple-50/50 p-4">
              <p className="mb-3 text-sm font-bold text-purple-800">Data Surat Undangan</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <InfoBox label="Instansi / Pengundang" value={visitor.invitation_sender || visitor.institution || "-"} />
                <InfoBox label="Nomor Surat" value={visitor.letter_number || visitor.invitation_number || visitor.nomor_surat || "-"} />
                <InfoBox label="Tanggal Surat" value={visitor.letter_date || visitor.invitation_date || visitor.tanggal_surat || "-"} />
                <InfoBox label="Perihal" value={visitor.letter_subject || visitor.perihal || "-"} />
                <InfoBox label="Tanggal Kegiatan" value={visitor.event_date || "-"} />
                <InfoBox label="Tempat Kegiatan" value={visitor.event_place || "-"} />
              </div>

              {visitor.letter_file && (
                <div className="mt-4 rounded-xl border border-purple-200 bg-white p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">File Surat Undangan</p>
                      <p className="mt-1 break-all text-xs text-gray-500">{String(visitor.letter_file).split("/").pop()}</p>
                    </div>
                    <a
                      href={`${FILE_URL}${String(visitor.letter_file).startsWith("/") ? visitor.letter_file : `/${visitor.letter_file}`}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700"
                    >
                      <Eye size={16} />
                      Lihat / Unduh Surat
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="sm:col-span-2">

            <InfoBox
              label="Catatan"
              value={
                visitor.notes ||
                "-"
              }
            />

          </div>

        </div>

        {/* FOOTER */}

        <div className="flex justify-end border-t border-gray-100 p-6">

          <button
            onClick={
              onClose
            }
            className="rounded-xl bg-gray-100 px-5 py-3 text-sm font-bold text-gray-700 hover:bg-gray-200"
          >
            Tutup
          </button>

        </div>

      </div>

    </div>
  );
}

/* =========================================================
   MANUAL MODAL
========================================================= */

function ManualModal({
  onClose,
}) {
  const handleContinue =
    () => {
      onClose();

      window.location.href =
        "/admin?section=registrasi";
    };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">

      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">

        {/* HEADER */}

        <div className="flex items-center justify-between border-b border-gray-100 p-6">

          <div className="flex items-center gap-3">

            <div className="rounded-xl bg-green-50 p-3 text-green-700">

              <Plus size={21} />

            </div>

            <div>

              <h2 className="font-bold text-gray-900">
                Registrasi Manual
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Tambahkan kunjungan secara
                manual.
              </p>

            </div>

          </div>

          <button
            onClick={
              onClose
            }
            className="rounded-xl p-2 hover:bg-gray-100"
          >
            <X size={20} />
          </button>

        </div>

        {/* CONTENT */}

        <div className="p-6">

          <div className="rounded-xl bg-green-50 p-4 text-sm leading-6 text-green-800">

            Data registrasi manual akan
            disimpan ke tabel
            <strong>
              {" "}
              visitors
            </strong>{" "}
            setelah formulir selesai
            diisi.

          </div>

          <div className="mt-6 flex justify-end gap-3">

            <button
              onClick={
                onClose
              }
              className="rounded-xl bg-gray-100 px-5 py-3 text-sm font-bold text-gray-700 hover:bg-gray-200"
            >
              Batal
            </button>

            <button
              onClick={
                handleContinue
              }
              className="rounded-xl bg-green-600 px-5 py-3 text-sm font-bold text-white hover:bg-green-700"
            >
              Lanjut
            </button>

          </div>

        </div>

      </div>

    </div>
  );
}