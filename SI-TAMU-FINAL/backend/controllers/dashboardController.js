import db from "../config/db.js";

export async function getSummary(req, res) {
  try {
    // Menggunakan IFNULL untuk memastikan nilai ringkasan tidak bernilai null saat tabel kosong
    const [[summary]] = await db.query(`
      SELECT 
        IFNULL(COUNT(*), 0) total, 
        IFNULL(SUM(DATE(created_at) = CURDATE()), 0) today, 
        IFNULL(SUM(MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE())), 0) month_total, 
        IFNULL(SUM(method = 'QR_CODE'), 0) qr_total, 
        IFNULL(SUM(method = 'MANUAL'), 0) manual_total, 
        IFNULL(SUM(status = 'ACTIVE'), 0) active_total 
      FROM visits
    `);

    // Menggunakan LEFT JOIN agar aman jika data relasi visitors/departments belum ada
    const [recent] = await db.query(`
      SELECT 
        vi.id, vi.visit_code, 
        COALESCE(v.full_name, '-') AS full_name, 
        COALESCE(v.institution, '-') AS institution, 
        COALESCE(d.name, '-') AS department_name, 
        vi.purpose, vi.method, vi.status, vi.check_in_at, vi.check_out_at 
      FROM visits vi 
      LEFT JOIN visitors v ON v.id = vi.visitor_id 
      LEFT JOIN departments d ON d.id = vi.department_id 
      ORDER BY vi.created_at DESC 
      LIMIT 8
    `);

    const [chart] = await db.query(`
      SELECT 
        DATE(created_at) label, 
        COUNT(*) total, 
        SUM(method = 'QR_CODE') qr, 
        SUM(method = 'MANUAL') manual 
      FROM visits 
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY) 
      GROUP BY DATE(created_at) 
      ORDER BY label
    `);

    return res.json({ 
      success: true, 
      data: { summary, recent, chart } 
    });
  } catch (e) {
    console.error("Error pada getSummary dashboard:", e);
    return res.status(500).json({ success: false, message: "Gagal mengambil dashboard." });
  }
}