# SI-TAMU DINSOSPPKBP3A Kabupaten Wonogiri

## Struktur dashboard
1. `/registrasi` — Dashboard/Form Registrasi Pengunjung. QR Code berada di halaman ini dan mengarah ke URL registrasi.
2. `/login` — Login Petugas/Admin.
3. `/admin` — Dashboard Petugas/Admin. Tidak ada QR Code pada dashboard admin.

## Alur pengunjung
Scan QR -> /registrasi -> isi form -> POST /api/visitors/public/register -> MySQL.

## Alur petugas
Login -> /admin -> Dashboard / Data Kunjungan / Registrasi Manual / Laporan.

## Backend
- Node.js + Express
- MySQL
- Port default: 5000

## Frontend
- React + Vite
- React Router
- Tailwind CSS
- Port default: 5173
