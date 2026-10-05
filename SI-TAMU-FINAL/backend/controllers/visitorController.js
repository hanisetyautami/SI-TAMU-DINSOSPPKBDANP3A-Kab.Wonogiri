import db from "../config/db.js";

// =====================================================
// GENERATE VISITOR CODE
// =====================================================
const visitorCode = () => {
  const random = Math.floor(
    100000 + Math.random() * 900000
  );

  return `VIS-${random}`;
};

// =====================================================
// GENERATE VISIT CODE
// =====================================================
const visitCode = () => {
  const random = Math.floor(
    100000 + Math.random() * 900000
  );

  return `KUN-${random}`;
};

// =====================================================
// GET VISITORS
// Mendukung:
// - visitors
// - buku_tamu_dinsos
// - Undangan Tersurat
// =====================================================
export const getVisitors = async (
  req,
  res
) => {

  try {

    // =================================================
    // 1. DATA DARI TABEL VISITORS
    // =================================================
    const [visitorsRows] =
      await db.query(`
        SELECT
          v.id,
          v.visitor_code,
          v.visit_code,
          v.full_name,
          v.identity_number,
          v.phone,
          v.institution,
          v.purpose,
          v.visit_type,
          v.status,
          v.created_at,

          v.invitation_sender,
          v.letter_number,
          v.letter_date,
          v.letter_subject,
          v.event_date,
          v.event_place,
          v.letter_file,

          COALESCE(
            d.name,
            v.department_id,
            '-'
          ) AS department_name

        FROM visitors v

        LEFT JOIN departments d
          ON d.id = v.department_id

        ORDER BY v.created_at DESC
      `);

    // =================================================
    // 2. DATA DARI EXCEL / BUKU TAMU LAMA
    // =================================================
    let excelRows = [];

    try {

      const [rows] =
        await db.query(`
          SELECT
            id,

            'EXCEL'
              AS visitor_code,

            '-'
              AS visit_code,

            nama
              AS full_name,

            nik
              AS identity_number,

            no_hp
              AS phone,

            CONCAT(
              COALESCE(
                desa_kelurahan,
                ''
              ),
              ', Kec. ',
              COALESCE(
                kecamatan,
                ''
              )
            ) AS institution,

            aduan
              AS purpose,

            'Masyarakat'
              AS visit_type,

            COALESCE(
              status,
              'registered'
            ) AS status,

            tanggal_datang
              AS created_at,

            tempat_pelayanan
              AS department_name

          FROM buku_tamu_dinsos

          ORDER BY
            tanggal_datang DESC
        `);

      excelRows = rows;

    } catch (error) {

      // Tabel buku_tamu_dinsos boleh belum tersedia
      excelRows = [];

    }

    // =================================================
    // 3. GABUNGKAN DATA
    // =================================================
    const combinedVisitors = [
      ...visitorsRows,
      ...excelRows,
    ].sort(
      (a, b) => {

        return (
          new Date(
            b.created_at || 0
          ) -
          new Date(
            a.created_at || 0
          )
        );

      }
    );

    // =================================================
    // 4. RESPONSE
    // =================================================
    return res.json({

      success: true,

      visitors:
        combinedVisitors,

    });

  } catch (error) {

    console.error(
      "getVisitors ERROR:",
      error
    );

    return res.status(500).json({

      success: false,

      message:
        "Gagal mengambil data kunjungan.",

      error:
        error.message,

    });

  }

};

// =====================================================
// VALIDATE DEPARTMENT
// =====================================================
const validateDepartment = async (
  connection,
  department_id
) => {

  // Masyarakat boleh tidak memiliki tujuan bagian
  if (!department_id) {
    return true;
  }

  // Jika department_id berupa angka
  if (!isNaN(department_id)) {

    const [rows] =
      await connection.query(
        `
          SELECT id
          FROM departments
          WHERE id = ?
          LIMIT 1
        `,
        [department_id]
      );

    return rows.length > 0;

  }

  // Jika berupa nama departemen
  const [rows] =
    await connection.query(
      `
        SELECT id
        FROM departments
        WHERE name = ?
        LIMIT 1
      `,
      [department_id]
    );

  return rows.length > 0;
};

// =====================================================
// RESOLVE DEPARTMENT ID
// =====================================================
const resolveDepartmentId = async (
  connection,
  department_id
) => {

  if (!department_id) {
    return null;
  }

  // Jika sudah berupa ID angka
  if (!isNaN(department_id)) {
    return department_id;
  }

  // Jika berupa nama department
  try {

    const [rows] =
      await connection.query(
        `
          SELECT id
          FROM departments
          WHERE name = ?
          LIMIT 1
        `,
        [department_id]
      );

    if (rows.length > 0) {
      return rows[0].id;
    }

  } catch (error) {

    console.error(
      "resolveDepartmentId ERROR:",
      error
    );

  }

  return null;
};

// =====================================================
// CREATE MANUAL VISIT
// =====================================================
export const createManualVisit =
  async (
    req,
    res
  ) => {

    let connection;

    try {

      connection =
        await db.getConnection();

      const {

        visit_type =
          "masyarakat",

        masyarakat_id =
          null,

        full_name,

        identity_number,

        phone,

        institution,

        position,

        email,

        address,

        department_id,

        purpose,

        host_name,

        notes,

        // ================================
        // DATA UNDANGAN TERSURAT
        // ================================
        invitation_sender,

        letter_number,

        letter_date,

        letter_subject,

        event_date,

        event_place,

      } = req.body;

      // =================================================
      // FILE SURAT
      // =================================================
      const uploadedLetterFile =
        req.file
          ? `/uploads/letters/${req.file.filename}`
          : null;

      // =================================================
      // VALIDASI JENIS KUNJUNGAN
      // =================================================
      if (
        ![
          "dinas",
          "masyarakat",
          "undangan_tersurat",
        ].includes(
          visit_type
        )
      ) {

        return res.status(400).json({

          success: false,

          message:
            "Jenis kunjungan tidak valid.",

        });

      }

      // =================================================
      // VALIDASI DATA DASAR
      // =================================================
      if (
        !full_name ||
        !identity_number ||
        !purpose ||
        (
          [
            "dinas",
            "undangan_tersurat",
          ].includes(
            visit_type
          ) &&
          !department_id
        )
      ) {

        return res.status(400).json({

          success: false,

          message:
            visit_type === "dinas"
              ? "Nama, identitas, tujuan bagian, dan keperluan wajib diisi."
              : "Nama, identitas, dan keperluan wajib diisi.",

        });

      }

      // =================================================
      // VALIDASI INSTANSI
      // =================================================
      if (
        [
          "dinas",
          "undangan_tersurat",
        ].includes(
          visit_type
        ) &&
        !institution
      ) {

        return res.status(400).json({

          success: false,

          message:
            visit_type ===
            "undangan_tersurat"
              ? "Instansi / pihak pengundang wajib diisi."
              : "Instansi / Dinas wajib diisi.",

        });

      }

      // =================================================
      // VALIDASI SURAT UNDANGAN
      // =================================================
      if (
        visit_type ===
          "undangan_tersurat" &&
        (
          !invitation_sender ||
          !letter_number ||
          !letter_date ||
          !letter_subject ||
          !event_date ||
          !event_place
        )
      ) {

        return res.status(400).json({

          success: false,

          message:
            "Data surat undangan, tanggal kegiatan, tempat kegiatan, dan pengundang wajib diisi.",

        });

      }

      // =================================================
      // VALIDASI FILE SURAT
      // =================================================
      if (
        visit_type ===
          "undangan_tersurat" &&
        !uploadedLetterFile
      ) {

        return res.status(400).json({

          success: false,

          message:
            "File surat undangan wajib diunggah.",

        });

      }

      // =================================================
      // VALIDASI DEPARTMENT
      // =================================================
      const departmentExists =
        await validateDepartment(
          connection,
          department_id
        );

      if (!departmentExists) {

        return res.status(400).json({

          success: false,

          message:
            "Tujuan / bagian yang dipilih tidak ditemukan.",

        });

      }

      // =================================================
      // TRANSACTION
      // =================================================
      await connection.beginTransaction();

      const visitor_code =
        visitorCode();

      const visit_code =
        visitCode();

      const finalDepartmentId =
        await resolveDepartmentId(
          connection,
          department_id
        );

      // =================================================
      // INSERT VISITOR
      // =================================================
      const [result] =
        await connection.query(
          `
            INSERT INTO visitors (

              masyarakat_id,
              visit_type,

              visitor_code,
              visit_code,

              full_name,
              identity_number,
              phone,

              institution,
              position,
              email,
              address,

              department_id,

              purpose,
              host_name,
              notes,

              invitation_sender,
              letter_number,
              letter_date,
              letter_subject,
              event_date,
              event_place,
              letter_file,

              registration_type,
              status,
              visit_date

            )

            VALUES (

              ?, ?, ?, ?, ?,
              ?, ?, ?, ?, ?, ?,
              ?, ?, ?, ?,
              ?, ?, ?, ?, ?, ?,
              ?,
              'manual',
              'registered',
              CURDATE()

            )
          `,
          [

            masyarakat_id ||
              null,

            visit_type,

            visitor_code,

            visit_code,

            full_name,

            identity_number,

            phone ||
              null,

            institution ||
              null,

            position ||
              null,

            email ||
              null,

            address ||
              null,

            finalDepartmentId,

            purpose,

            host_name ||
              null,

            notes ||
              null,

            invitation_sender ||
              null,

            letter_number ||
              null,

            letter_date ||
              null,

            letter_subject ||
              null,

            event_date ||
              null,

            event_place ||
              null,

            uploadedLetterFile,

          ]
        );

      // =================================================
      // INSERT VISIT LOG
      // =================================================
      await connection.query(
        `
          INSERT INTO visit_logs (
            visitor_id,
            action,
            description
          )

          VALUES (
            ?,
            'registration',
            ?
          )
        `,
        [
          result.insertId,

          `Registrasi manual ${visit_type}`,

        ]
      );

      // =================================================
      // COMMIT
      // =================================================
      await connection.commit();

      // =================================================
      // RESPONSE
      // =================================================
      return res.status(201).json({

        success: true,

        message:
          "Kunjungan berhasil didaftarkan.",

        data: {

          id:
            result.insertId,

          visitor_code,

          visit_code,

          visit_type,

          letter_file:
            uploadedLetterFile,

        },

      });

    } catch (error) {

      if (connection) {

        try {

          await connection.rollback();

        } catch (rollbackError) {

          console.error(
            "Rollback error:",
            rollbackError
          );

        }

      }

      console.error(
        "createManualVisit ERROR:",
        error
      );

      return res.status(500).json({

        success: false,

        message:
          "Gagal membuat kunjungan.",

        error:
          error.message,

      });

    } finally {

      if (connection) {
        connection.release();
      }

    }

  };

// =====================================================
// CREATE QR VISIT
// =====================================================
export const createQrVisit =
  async (
    req,
    res
  ) => {

    let connection;

    try {

      connection =
        await db.getConnection();

      const {

        visit_type =
          "masyarakat",

        masyarakat_id =
          null,

        full_name,

        identity_number,

        phone,

        institution,

        position,

        email,

        address,

        department_id,

        purpose,

        host_name,

        notes,

        // ================================
        // DATA UNDANGAN
        // ================================
        invitation_sender,

        letter_number,

        letter_date,

        letter_subject,

        event_date,

        event_place,

      } = req.body;

      // =================================================
      // FILE SURAT
      // =================================================
      const uploadedLetterFile =
        req.file
          ? `/uploads/letters/${req.file.filename}`
          : null;

      // =================================================
      // VALIDASI JENIS
      // =================================================
      if (
        ![
          "dinas",
          "masyarakat",
          "undangan_tersurat",
        ].includes(
          visit_type
        )
      ) {

        return res.status(400).json({

          success: false,

          message:
            "Jenis kunjungan tidak valid.",

        });

      }

      // =================================================
      // VALIDASI DATA DASAR
      // =================================================
      if (
        !full_name ||
        !identity_number ||
        !purpose ||
        (
          [
            "dinas",
            "undangan_tersurat",
          ].includes(
            visit_type
          ) &&
          !department_id
        )
      ) {

        return res.status(400).json({

          success: false,

          message:
            visit_type === "dinas"
              ? "Nama, identitas, tujuan bagian, dan keperluan wajib diisi."
              : "Nama, identitas, dan keperluan wajib diisi.",

        });

      }

      // =================================================
      // VALIDASI INSTANSI
      // =================================================
      if (
        [
          "dinas",
          "undangan_tersurat",
        ].includes(
          visit_type
        ) &&
        !institution
      ) {

        return res.status(400).json({

          success: false,

          message:
            visit_type ===
            "undangan_tersurat"
              ? "Instansi / pihak pengundang wajib diisi."
              : "Instansi / Dinas wajib diisi.",

        });

      }

      // =================================================
      // VALIDASI SURAT
      // =================================================
      if (
        visit_type ===
          "undangan_tersurat" &&
        (
          !invitation_sender ||
          !letter_number ||
          !letter_date ||
          !letter_subject ||
          !event_date ||
          !event_place
        )
      ) {

        return res.status(400).json({

          success: false,

          message:
            "Data surat undangan, tanggal kegiatan, tempat kegiatan, dan pengundang wajib diisi.",

        });

      }

      // =================================================
      // VALIDASI FILE SURAT
      // =================================================
      if (
        visit_type ===
          "undangan_tersurat" &&
        !uploadedLetterFile
      ) {

        return res.status(400).json({

          success: false,

          message:
            "File surat undangan wajib diunggah.",

        });

      }

      // =================================================
      // VALIDASI DEPARTMENT
      // =================================================
      const departmentExists =
        await validateDepartment(
          connection,
          department_id
        );

      if (!departmentExists) {

        return res.status(400).json({

          success: false,

          message:
            "Tujuan / bagian yang dipilih tidak ditemukan.",

        });

      }

      // =================================================
      // TRANSACTION
      // =================================================
      await connection.beginTransaction();

      const visitor_code =
        visitorCode();

      const visit_code =
        visitCode();

      const qr_token =
        `${visit_code}-${Date.now()}`;

      const finalDepartmentId =
        await resolveDepartmentId(
          connection,
          department_id
        );

      // =================================================
      // INSERT VISITOR QR
      // =================================================
      const [result] =
        await connection.query(
          `
            INSERT INTO visitors (

              masyarakat_id,
              visit_type,

              visitor_code,
              visit_code,

              full_name,
              identity_number,
              phone,

              institution,
              position,
              email,
              address,

              department_id,

              purpose,
              host_name,
              notes,

              invitation_sender,
              letter_number,
              letter_date,
              letter_subject,
              event_date,
              event_place,
              letter_file,

              registration_type,
              qr_token,
              status,
              visit_date

            )

            VALUES (

              ?, ?, ?, ?, ?,
              ?, ?, ?, ?, ?, ?,
              ?, ?, ?, ?,
              ?, ?, ?, ?, ?, ?,
              ?,
              'qr',
              ?,
              'registered',
              CURDATE()

            )
          `,
          [

            masyarakat_id ||
              null,

            visit_type,

            visitor_code,

            visit_code,

            full_name,

            identity_number,

            phone ||
              null,

            institution ||
              null,

            position ||
              null,

            email ||
              null,

            address ||
              null,

            finalDepartmentId,

            purpose,

            host_name ||
              null,

            notes ||
              null,

            invitation_sender ||
              null,

            letter_number ||
              null,

            letter_date ||
              null,

            letter_subject ||
              null,

            event_date ||
              null,

            event_place ||
              null,

            uploadedLetterFile,

            qr_token,

          ]
        );

      // =================================================
      // VISIT LOG
      // =================================================
      await connection.query(
        `
          INSERT INTO visit_logs (
            visitor_id,
            action,
            description
          )

          VALUES (
            ?,
            'registration',
            ?
          )
        `,
        [

          result.insertId,

          `Registrasi QR ${visit_type}`,

        ]
      );

      // =================================================
      // COMMIT
      // =================================================
      await connection.commit();

      // =================================================
      // RESPONSE
      // =================================================
      return res.status(201).json({

        success: true,

        message:
          "Registrasi QR berhasil.",

        data: {

          id:
            result.insertId,

          visitor_code,

          visit_code,

          qr_token,

          visit_type,

          letter_file:
            uploadedLetterFile,

        },

      });

    } catch (error) {

      if (connection) {

        try {

          await connection.rollback();

        } catch (rollbackError) {

          console.error(
            "Rollback error:",
            rollbackError
          );

        }

      }

      console.error(
        "createQrVisit ERROR:",
        error
      );

      return res.status(500).json({

        success: false,

        message:
          "Gagal membuat registrasi QR.",

        error:
          error.message,

      });

    } finally {

      if (connection) {
        connection.release();
      }

    }

  };

// =====================================================
// CHECK-IN QR
// =====================================================
export const checkInQr =
  async (
    req,
    res
  ) => {

    let connection;

    try {

      connection =
        await db.getConnection();

      const {
        qr_token
      } = req.body;

      if (!qr_token) {

        return res.status(400).json({

          success: false,

          message:
            "QR token wajib dikirim.",

        });

      }

      // =================================================
      // CARI DATA
      // =================================================
      const [rows] =
        await connection.query(
          `
            SELECT *
            FROM visitors
            WHERE qr_token = ?
            LIMIT 1
          `,
          [qr_token]
        );

      if (rows.length === 0) {

        return res.status(404).json({

          success: false,

          message:
            "QR Code tidak ditemukan.",

        });

      }

      const visitor =
        rows[0];

      // =================================================
      // VALIDASI STATUS
      // =================================================
      if (
        visitor.status ===
        "checked_in"
      ) {

        return res.status(400).json({

          success: false,

          message:
            "Tamu sudah melakukan check-in.",

        });

      }

      if (
        visitor.status ===
        "checked_out"
      ) {

        return res.status(400).json({

          success: false,

          message:
            "Kunjungan sudah selesai.",

        });

      }

      // =================================================
      // TRANSACTION
      // =================================================
      await connection.beginTransaction();

      // CHECK IN
      await connection.query(
        `
          UPDATE visitors

          SET
            status = 'checked_in',
            check_in = NOW()

          WHERE id = ?
        `,
        [visitor.id]
      );

      // LOG
      await connection.query(
        `
          INSERT INTO visit_logs (
            visitor_id,
            action,
            description
          )

          VALUES (
            ?,
            'check_in',
            ?
          )
        `,
        [
          visitor.id,

          "Tamu melakukan check-in melalui QR Code.",

        ]
      );

      await connection.commit();

      // =================================================
      // RESPONSE
      // =================================================
      return res.json({

        success: true,

        message:
          "Check-in berhasil.",

        data: {

          ...visitor,

          status:
            "checked_in",

        },

      });

    } catch (error) {

      if (connection) {

        try {

          await connection.rollback();

        } catch (rollbackError) {

          console.error(
            "Rollback error:",
            rollbackError
          );

        }

      }

      console.error(
        "checkInQr ERROR:",
        error
      );

      return res.status(500).json({

        success: false,

        message:
          "Gagal melakukan check-in.",

        error:
          error.message,

      });

    } finally {

      if (connection) {
        connection.release();
      }

    }

  };

// =====================================================
// CHECK-OUT
// =====================================================
export const checkOut =
  async (
    req,
    res
  ) => {

    let connection;

    try {

      connection =
        await db.getConnection();

      const {
        id
      } = req.params;

      // =================================================
      // CARI VISITOR
      // =================================================
      const [rows] =
        await connection.query(
          `
            SELECT *
            FROM visitors
            WHERE id = ?
            LIMIT 1
          `,
          [id]
        );

      if (rows.length === 0) {

        return res.status(404).json({

          success: false,

          message:
            "Data kunjungan tidak ditemukan.",

        });

      }

      const visitor =
        rows[0];

      // =================================================
      // VALIDASI STATUS
      // =================================================
      if (
        visitor.status !==
        "checked_in"
      ) {

        return res.status(400).json({

          success: false,

          message:
            "Tamu belum melakukan check-in.",

        });

      }

      // =================================================
      // TRANSACTION
      // =================================================
      await connection.beginTransaction();

      // CHECK OUT
      await connection.query(
        `
          UPDATE visitors

          SET
            status = 'checked_out',
            check_out = NOW()

          WHERE id = ?
        `,
        [id]
      );

      // LOG
      await connection.query(
        `
          INSERT INTO visit_logs (
            visitor_id,
            action,
            description
          )

          VALUES (
            ?,
            'check_out',
            ?
          )
        `,
        [
          id,

          "Tamu melakukan check-out.",

        ]
      );

      await connection.commit();

      // =================================================
      // RESPONSE
      // =================================================
      return res.json({

        success: true,

        message:
          "Check-out berhasil.",

      });

    } catch (error) {

      if (connection) {

        try {

          await connection.rollback();

        } catch (rollbackError) {

          console.error(
            "Rollback error:",
            rollbackError
          );

        }

      }

      console.error(
        "checkOut ERROR:",
        error
      );

      return res.status(500).json({

        success: false,

        message:
          "Gagal melakukan check-out.",

        error:
          error.message,

      });

    } finally {

      if (connection) {
        connection.release();
      }

    }

  };