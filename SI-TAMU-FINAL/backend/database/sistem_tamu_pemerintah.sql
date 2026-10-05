CREATE DATABASE IF NOT EXISTS sistem_tamu_pemerintah
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE sistem_tamu_pemerintah;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS activity_logs;
DROP TABLE IF EXISTS visits;
DROP TABLE IF EXISTS qr_codes;
DROP TABLE IF EXISTS visitors;
DROP TABLE IF EXISTS departments;
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE users (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('SUPERADMIN','ADMIN','PETUGAS') NOT NULL DEFAULT 'PETUGAS',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE departments (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  description VARCHAR(255),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE visitors (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  visitor_code VARCHAR(30) NOT NULL UNIQUE,
  full_name VARCHAR(150) NOT NULL,
  identity_number VARCHAR(50) NOT NULL,
  phone VARCHAR(30),
  institution VARCHAR(150),
  email VARCHAR(150),
  photo_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_visitor_name (full_name),
  INDEX idx_visitor_identity (identity_number)
) ENGINE=InnoDB;

CREATE TABLE qr_codes (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  visitor_id BIGINT UNSIGNED NOT NULL,
  token VARCHAR(100) NOT NULL UNIQUE,
  valid_from DATETIME NOT NULL,
  valid_until DATETIME NOT NULL,
  is_used BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_qr_visitor
    FOREIGN KEY (visitor_id) REFERENCES visitors(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE visits (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  visit_code VARCHAR(40) NOT NULL UNIQUE,
  visitor_id BIGINT UNSIGNED NOT NULL,
  department_id BIGINT UNSIGNED NOT NULL,
  purpose VARCHAR(255) NOT NULL,
  host_name VARCHAR(150),
  method ENUM('QR_CODE','MANUAL') NOT NULL,
  status ENUM('PENDING','ACTIVE','COMPLETED','CANCELLED')
    NOT NULL DEFAULT 'PENDING',
  scheduled_at DATETIME,
  check_in_at DATETIME,
  check_out_at DATETIME,
  notes TEXT,
  created_by BIGINT UNSIGNED,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_visit_visitor
    FOREIGN KEY (visitor_id) REFERENCES visitors(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,

  CONSTRAINT fk_visit_department
    FOREIGN KEY (department_id) REFERENCES departments(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,

  CONSTRAINT fk_visit_creator
    FOREIGN KEY (created_by) REFERENCES users(id)
    ON DELETE SET NULL ON UPDATE CASCADE,

  INDEX idx_visit_status (status),
  INDEX idx_visit_method (method),
  INDEX idx_visit_created (created_at)
) ENGINE=InnoDB;

CREATE TABLE activity_logs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED,
  action VARCHAR(100) NOT NULL,
  description TEXT,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_log_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

-- Password demo: admin123
INSERT INTO users
(name, email, password_hash, role)
VALUES
(
  'Budi Santoso',
  'admin@pemda.go.id',
  '$2b$10$7EqJtq98hPqEX7fNZaFWoO8g5kR8r4s8Y0W9Xn3m4qY0ZQj7q4z5e',
  'ADMIN'
);

INSERT INTO departments (name, description) VALUES
('Bagian Keuangan', 'Unit pelayanan bagian keuangan'),
('Dinas Perizinan', 'Unit pelayanan perizinan'),
('Bappeda', 'Badan Perencanaan Pembangunan Daerah'),
('Sekretariat Daerah', 'Unit sekretariat daerah');