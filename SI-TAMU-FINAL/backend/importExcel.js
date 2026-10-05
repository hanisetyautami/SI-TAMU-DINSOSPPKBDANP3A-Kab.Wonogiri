import express from 'express';
import mysql from 'mysql2';
import XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';

// Menyiapkan __dirname untuk ES Module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Konfigurasi Koneksi MySQL
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'sitamu' // Sesuaikan dengan database Anda
});

db.connect((err) => {
    if (err) throw err;
    console.log("Terhubung ke Database MySQL!");

    // Path diarahkan masuk ke folder 'dataset' di dalam backend
    const excelFilePath = path.join(__dirname, 'dataset', 'BUKU TAMU DIGITAL DINAS SOSIAL KAB. WONOGIRI.xlsx');
    
    const workbook = XLSX.readFile(excelFilePath);
    const sheetName = workbook.SheetNames[0];
    const rawData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });

    const rows = rawData.slice(3); 
    console.log(`Memproses ${rows.length} baris data dari Excel...`);

    let insertedCount = 0;

    rows.forEach((row) => {
        const nama = row[1];
        if (!nama) return;

        const no_hp = row[2] ? String(row[2]) : null;
        const tempat_pelayanan = row[3] || 'SLRT';
        const alamat = row[4] || null;
        const rt = row[5] ? String(row[5]) : null;
        const rw = row[6] ? String(row[6]) : null;
        const desa_kelurahan = row[7] || null;
        const kecamatan = row[8] || null;
        const nik = row[9] ? String(row[9]) : null;
        const kk = row[10] ? String(row[10]) : null;
        
        let tanggal_datang = row[11];
        if (typeof tanggal_datang === 'number') {
            tanggal_datang = new Date(Math.round((tanggal_datang - (25567 + 2)) * 86400 * 1000)).toISOString().split('T')[0];
        } else {
            tanggal_datang = '2025-07-01';
        }

        const aduan = row[12] || 'BPJS';
        const status = row[13] || 'SELESAI';

        const query = `
            INSERT INTO buku_tamu_dinsos 
            (nama, no_hp, tempat_pelayanan, alamat, rt, rw, desa_kelurahan, kecamatan, nik, kk, tanggal_datang, aduan, status) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        db.query(query, [nama, no_hp, tempat_pelayanan, alamat, rt, rw, desa_kelurahan, kecamatan, nik, kk, tanggal_datang, aduan, status], (err) => {
            if (!err) {
                insertedCount++;
            }
        });
    });

    setTimeout(() => {
        console.log(`Selesai! Berhasil mengimpor ${insertedCount} data ke database.`);
        db.end();
    }, 3000);
});