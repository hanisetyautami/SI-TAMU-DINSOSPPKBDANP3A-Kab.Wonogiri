import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import {
  LayoutDashboard,
  Users,
  FileText,
  Settings,
  User,
  LogOut,
  ClipboardPlus,
} from "lucide-react";

import logoImage from "../assets/si-tamulogo.jpg";


// ========================================
// MENU SIDEBAR
// ========================================
const menus = [
  {
    name: "Dashboard",
    section: "",
    icon: LayoutDashboard,
  },

  // TAMBAHAN REGISTRASI
  {
    name: "Registrasi",
    section: "registrasi",
    icon: ClipboardPlus,
  },

  {
    name: "Data Kunjungan",
    section: "data",
    icon: Users,
  },

  {
    name: "Laporan",
    section: "laporan",
    icon: FileText,
  },

  {
    name: "Pengaturan",
    section: "pengaturan",
    icon: Settings,
  },

  {
    name: "Akun",
    section: "akun",
    icon: User,
  },
];


function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const [namaUser, setNamaUser] = useState("Admin");
  const [roleUser, setRoleUser] = useState("Petugas");


  // ========================================
  // AMBIL DATA USER DARI LOCAL STORAGE
  // ========================================
  useEffect(() => {
    try {
      const storedUser = JSON.parse(
        localStorage.getItem("sitamu_user") || "null"
      );

      if (storedUser) {
        if (storedUser.name) {
          setNamaUser(storedUser.name);
        }

        if (storedUser.role) {
          setRoleUser(storedUser.role);
        }
      }
    } catch (e) {
      console.error(
        "Gagal memuat data user di sidebar:",
        e
      );
    }
  }, []);


  // ========================================
  // SECTION DARI URL
  // ========================================
  const currentSection =
    new URLSearchParams(location.search).get("section") || "";


  // ========================================
  // MENU CLICK
  // ========================================
  const handleMenuClick = (section) => {

    // DASHBOARD
    if (section === "") {
      navigate("/admin");
    }

    // REGISTRASI
    else if (section === "registrasi") {
      navigate("/RegistrationDashboard");
    }

    // MENU LAINNYA
    else {
      navigate(`/admin?section=${section}`);
    }
  };


  // ========================================
  // USERS
  // ========================================
  const handleUsersClick = () => {
    navigate("/admin/users");
  };


  // ========================================
  // LOGOUT
  // ========================================
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("sitamu_token");
    localStorage.removeItem("sitamu_user");

    navigate("/login", {
      replace: true,
    });
  };


  return (
    <aside
      className="
        hidden md:flex
        w-[205px]
        min-h-screen
        bg-[#005B3F]
        text-white
        flex-col
        sticky
        top-0
        left-0
        z-50
        justify-between
      "
    >

      {/* ========================================
          BAGIAN ATAS
      ========================================= */}
      <div>

        {/* ========================================
            LOGO
        ========================================= */}
        <div className="px-4 pt-6 pb-7">

          <div className="flex items-center gap-3">

            <img
              src={logoImage}
              alt="Logo SI-TAMU Dinsos PPKB P3A Kabupaten Wonogiri"
              className="
                w-10
                h-10
                object-contain
                flex-shrink-0
                rounded-md
              "
            />

            <div className="min-w-0">

              <h1
                className="
                  text-[17px]
                  font-bold
                  leading-none
                  tracking-wide
                "
              >
                SI-TAMU
              </h1>

              <p
                className="
                  mt-1
                  text-[7px]
                  font-semibold
                  leading-tight
                  text-white
                  tracking-wide
                "
              >
                DINSOSPPKBP3A
              </p>

              <p
                className="
                  text-[7px]
                  leading-tight
                  text-emerald-200
                  tracking-wide
                "
              >
                KABUPATEN WONOGIRI
              </p>

            </div>

          </div>

        </div>


        {/* ========================================
            MENU UTAMA
        ========================================= */}
        <nav className="px-3 space-y-2">

          {menus.map((menu) => {

            const Icon = menu.icon;

            // CEK MENU AKTIF
            const isActive =
              menu.section === "registrasi"
                ? location.pathname === "/RegistrationDashboard"
                : location.pathname === "/admin" &&
                  currentSection === menu.section;


            return (
              <button
                key={menu.name}
                type="button"
                onClick={() =>
                  handleMenuClick(menu.section)
                }
                className={`
                  w-full
                  flex
                  items-center
                  gap-3
                  px-3.5
                  py-3
                  rounded-lg
                  text-left
                  text-[13px]
                  font-medium
                  transition-all
                  duration-200

                  ${
                    isActive
                      ? "bg-[#0A9F5B] text-white shadow-sm"
                      : "text-emerald-50 hover:bg-[#08754F] hover:text-white"
                  }
                `}
              >

                {/* Diubah agar ikon lebih minimalis dengan ukuran 16 dan strokeWidth 1.5 */}
                <Icon
                  size={16}
                  strokeWidth={1.5}
                  className="flex-shrink-0 opacity-90"
                />

                <span>
                  {menu.name}
                </span>

              </button>
            );

          })}


          {/* ========================================
              MENU USERS
          ========================================= */}
          <button
            type="button"
            onClick={handleUsersClick}
            className={`
              w-full
              flex
              items-center
              gap-3
              px-3.5
              py-3
              rounded-lg
              text-left
              text-[13px]
              font-medium
              transition-all
              duration-200

              ${
                location.pathname === "/admin/users"
                  ? "bg-[#0A9F5B] text-white shadow-sm"
                  : "text-emerald-50 hover:bg-[#08754F] hover:text-white"
              }
            `}
          >

            <Users
              size={16}
              strokeWidth={1.5}
              className="flex-shrink-0 opacity-90"
            />

            <span>
              Users
            </span>

          </button>

        </nav>

      </div>


      {/* ========================================
          BAGIAN BAWAH
      ========================================= */}
      <div className="px-3 pb-5 pt-4">

        {/* ========================================
            INFORMASI USER
        ========================================= */}
        <div
          className="
            mb-3
            rounded-lg
            bg-[#08754F]
            px-3
            py-3
          "
        >

          <div className="flex items-center gap-2">

            <div
              className="
                flex
                h-8
                w-8
                flex-shrink-0
                items-center
                justify-center
                rounded-full
                bg-white
                text-[#08753f]
              "
            >
              <User size={15} strokeWidth={1.75} />
            </div>


            <div className="min-w-0">

              <p
                className="
                  truncate
                  text-[12px]
                  font-semibold
                  text-white
                "
              >
                {namaUser}
              </p>

              <p
                className="
                  truncate
                  text-[10px]
                  text-emerald-200
                "
              >
                {roleUser}
              </p>

            </div>

          </div>

        </div>


        {/* ========================================
            LOGOUT
        ========================================= */}
        <button
          type="button"
          onClick={handleLogout}
          className="
            w-full
            flex
            items-center
            gap-3
            px-3.5
            py-3
            rounded-lg
            text-[13px]
            font-medium
            text-emerald-50
            hover:bg-[#08754F]
            hover:text-white
            transition-all
            duration-200
          "
        >

          <LogOut
            size={16}
            strokeWidth={1.5}
            className="opacity-90"
          />

          <span>
            Keluar
          </span>

        </button>

      </div>

    </aside>
  );
}


export default Sidebar;