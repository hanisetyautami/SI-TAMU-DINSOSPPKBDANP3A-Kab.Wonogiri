import mysql from "mysql2/promise";
import XLSX from "xlsx";
import path from "path";
import { fileURLToPath } from "url";

// ======================================================
// KONFIGURASI PATH
// ======================================================

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ======================================================
// KONFIGURASI DATABASE
// ======================================================

const db = await mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "sitamu",
});

console.log("==========================================");
console.log("Terhubung ke Database MySQL!");
console.log("==========================================");

// ======================================================
// LOKASI FILE EXCEL
// ======================================================

const excelFilePath = path.join(
    __dirname,
    "dataset",
    "BUKU TAMU DIGITAL DINAS SOSIAL KAB. WONOGIRI.xlsx"
);

// ======================================================
// GENERATE KODE PENGUNJUNG
// FORMAT:
// VIS-12345
// ======================================================

async function generateVisitorCode() {
    let kode;
    let exists = true;

    while (exists) {
        const randomNumber = Math.floor(
            10000 + Math.random() * 90000
        );

        kode = `VIS-${randomNumber}`;

        const [rows] = await db.execute(
            `
            SELECT id
            FROM buku_tamu_dinsos
            WHERE kode_pengunjung = ?
            LIMIT 1
            `,
            [kode]
        );

        exists = rows.length > 0;
    }

    return kode;
}

// ======================================================
// CEK KOLOM KODE PENGUNJUNG
// ======================================================

async function ensureVisitorCodeColumn() {
    const [columns] = await db.execute(
        `
        SHOW COLUMNS
        FROM buku_tamu_dinsos
        LIKE 'kode_pengunjung'
        `
    );

    if (columns.length === 0) {
        console.log(
            "Kolom kode_pengunjung belum ada. Menambahkan kolom..."
        );

        await db.execute(
            `
            ALTER TABLE buku_tamu_dinsos
            ADD COLUMN kode_pengunjung VARCHAR(20) UNIQUE AFTER id
            `
        );

        console.log(
            "Kolom kode_pengunjung berhasil ditambahkan."
        );
    } else {
        console.log(
            "Kolom kode_pengunjung sudah tersedia."
        );
    }
}

// ======================================================
// BACA FILE EXCEL
// ======================================================

const workbook = XLSX.readFile(excelFilePath);

const sheetName = workbook.SheetNames[0];

console.log(`Sheet yang digunakan: ${sheetName}`);

const worksheet = workbook.Sheets[sheetName];

const rawData = XLSX.utils.sheet_to_json(
    worksheet,
    {
        header: 1,
        defval: null,
    }
);

// ======================================================
// DATA DIMULAI DARI BARIS KE-4
// sesuai kode import sebelumnya:
// rawData.slice(3)
// ======================================================

const rows = rawData.slice(3);

console.log(
    `Jumlah baris Excel yang diproses: ${rows.length}`
);

// ======================================================
// HITUNG DATA
// ======================================================

let insertedCount = 0;
let skippedCount = 0;
let errorCount = 0;

// ======================================================
// PROSES IMPORT
// ======================================================

try {
    // Pastikan kolom kode pengunjung tersedia
    await ensureVisitorCodeColumn();

    // Mulai transaction
    await db.beginTransaction();

    for (const row of rows) {

        // ----------------------------------------------
        // NAMA
        // ----------------------------------------------

        const nama = row[1];

        // Jika nama kosong, lewati
        if (!nama || String(nama).trim() === "") {
            skippedCount++;
            continue;
        }

        // ----------------------------------------------
        // DATA EXCEL
        // ----------------------------------------------

        const no_hp = row[2]
            ? String(row[2]).trim()
            : null;

        const tempat_pelayanan =
            row[3] || "SLRT";

        const alamat =
            row[4] || null;

        const rt = row[5]
            ? String(row[5]).trim()
            : null;

        const rw = row[6]
            ? String(row[6]).trim()
            : null;

        const desa_kelurahan =
            row[7] || null;

        const kecamatan =
            row[8] || null;

        const nik = row[9]
            ? String(row[9]).trim()
            : null;

        const kk = row[10]
            ? String(row[10]).trim()
            : null;

        // ----------------------------------------------
        // TANGGAL DATANG
        // ----------------------------------------------

        let tanggal_datang = row[11];

        if (typeof tanggal_datang === "number") {

            const excelDate =
                XLSX.SSF.parse_date_code(
                    tanggal_datang
                );

            if (excelDate) {

                const year =
                    String(excelDate.y).padStart(4, "0");

                const month =
                    String(excelDate.m).padStart(2, "0");

                const day =
                    String(excelDate.d).padStart(2, "0");

                tanggal_datang =
                    `${year}-${month}-${day}`;

            } else {

                tanggal_datang = "2025-07-01";
            }

        } else if (
            tanggal_datang instanceof Date
        ) {

            tanggal_datang =
                tanggal_datang
                    .toISOString()
                    .split("T")[0];

        } else if (
            typeof tanggal_datang === "string" &&
            tanggal_datang.trim() !== ""
        ) {

            tanggal_datang =
                tanggal_datang.trim();

        } else {

            tanggal_datang = "2025-07-01";
        }

        // ----------------------------------------------
        // ADUAN
        // ----------------------------------------------

        const aduan =
            row[12] || "BPJS";

        // ----------------------------------------------
        // STATUS
        // ----------------------------------------------

        const status =
            row[13] || "SELESAI";

        // ----------------------------------------------
        // GENERATE KODE PENGUNJUNG
        // ----------------------------------------------

        const kode_pengunjung =
            await generateVisitorCode();

        // ----------------------------------------------
        // INSERT DATABASE
        // ----------------------------------------------

        const query = `
            INSERT INTO buku_tamu_dinsos
            (
                kode_pengunjung,
                nama,
                no_hp,
                tempat_pelayanan,
                alamat,
                rt,
                rw,
                desa_kelurahan,
                kecamatan,
                nik,
                kk,
                tanggal_datang,
                aduan,
                status
            )
            VALUES
            (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        try {

            await db.execute(
                query,
                [
                    kode_pengunjung,
                    nama,
                    no_hp,
                    tempat_pelayanan,
                    alamat,
                    rt,
                    rw,
                    desa_kelurahan,
                    kecamatan,
                    nik,
                    kk,
                    tanggal_datang,
                    aduan,
                    status,
                ]
            );

            insertedCount++;

            console.log(
                `[${insertedCount}] ${kode_pengunjung} - ${nama}`
            );

        } catch (error) {

            errorCount++;

            console.error(
                `Gagal memasukkan data: ${nama}`
            );

            console.error(error.message);
        }
    }

    // ==================================================
    // COMMIT
    // ==================================================

    await db.commit();

    console.log("");
    console.log("==========================================");
    console.log("IMPORT EXCEL SELESAI");
    console.log("==========================================");
    console.log(
        `Berhasil : ${insertedCount} data`
    );
    console.log(
        `Dilewati : ${skippedCount} data`
    );
    console.log(
        `Error    : ${errorCount} data`
    );
    console.log("==========================================");

} catch (error) {

    // ==================================================
    // ROLLBACK JIKA ERROR BESAR
    // ==================================================

    await db.rollback();

    console.error("");
    console.error("==========================================");
    console.error("IMPORT GAGAL");
    console.error("==========================================");
    console.error(error);
    console.error("==========================================");

} finally {

    // ==================================================
    // TUTUP DATABASE
    // ==================================================

    await db.end();

    console.log(
        "Koneksi database ditutup."
    );
}