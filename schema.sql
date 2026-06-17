-- ============================================================================
-- CẤU HÌNH CƠ SỞ DỮ LIỆU (DATABASE CONFIGURATION)
-- Bảng mã đề xuất: UTF-8 (utf8mb4)
-- Đối chiếu mặc định (Collation): utf8mb4_unicode_ci
--
-- Ví dụ lệnh khởi tạo cơ sở dữ liệu trên MySQL/MariaDB:
-- CREATE DATABASE quan_ly_hoc_sinh CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- ============================================================================

-- 1. Bảng DanhMucLop
CREATE TABLE IF NOT EXISTS "DanhMucLop" (
    "MaLop" INT PRIMARY KEY,
    "TenLop" VARCHAR(50) NOT NULL,
    "Khoi" INT NOT NULL,
    "NamHoc" VARCHAR(20) NOT NULL,
    "BaseScore" NUMERIC DEFAULT 100
);

-- 2. Bảng DanhMucTuan
CREATE TABLE IF NOT EXISTS "DanhMucTuan" (
    "MaTuan" INT PRIMARY KEY,
    "TenTuan" VARCHAR(50) NOT NULL,
    "NgayBatDau" DATE NOT NULL,
    "NgayKetThuc" DATE NOT NULL
);

-- 3. Bảng QuyDinhThiDua
CREATE TABLE IF NOT EXISTS "QuyDinhThiDua" (
    "MaTieuChi" INT PRIMARY KEY,
    "NoiDung" TEXT NOT NULL,
    "Loai" VARCHAR(10) CHECK ("Loai" IN ('TRU', 'CONG')) NOT NULL,
    "DiemChuyenDoi" NUMERIC NOT NULL,
    "DonViTinh" VARCHAR(50) NOT NULL,
    "is_active" BOOLEAN DEFAULT TRUE
);

-- 4. Bảng DanhSachHocSinh
CREATE TABLE IF NOT EXISTS "DanhSachHocSinh" (
    "MaHocSinh" INT PRIMARY KEY,
    "MaLop" INT REFERENCES "DanhMucLop"("MaLop") ON DELETE SET NULL,
    "HoTen" VARCHAR(255) NOT NULL,
    "NgaySinh" DATE NOT NULL,
    "GioiTinh" VARCHAR(10) NOT NULL
);

-- 5. Bảng NguoiDung
CREATE TABLE IF NOT EXISTS "NguoiDung" (
    "MaNguoiDung" INT PRIMARY KEY,
    "Email" VARCHAR(255) UNIQUE NOT NULL,
    "MatKhauHash" VARCHAR(255) NOT NULL,
    "HoTen" VARCHAR(255) NOT NULL,
    "VaiTro" VARCHAR(50) CHECK ("VaiTro" IN ('ADMIN', 'CO_DO', 'GIAO_VIEN', 'HOC_SINH')) NOT NULL,
    "MaLop" INT REFERENCES "DanhMucLop"("MaLop") ON DELETE SET NULL,
    "TrangThai" BOOLEAN DEFAULT TRUE
);

-- 6. Bảng PhanCongCoDo
CREATE TABLE IF NOT EXISTS "PhanCongCoDo" (
    "MaPhanCong" INT PRIMARY KEY,
    "MaNguoiDung" INT REFERENCES "NguoiDung"("MaNguoiDung") ON DELETE CASCADE,
    "MaTuan" INT REFERENCES "DanhMucTuan"("MaTuan") ON DELETE CASCADE,
    "MaLop" INT REFERENCES "DanhMucLop"("MaLop") ON DELETE CASCADE
);

-- 7. Bảng ChiTietViPhamHocSinh
CREATE TABLE IF NOT EXISTS "ChiTietViPhamHocSinh" (
    "MaChiTiet" INT PRIMARY KEY,
    "MaLop" INT REFERENCES "DanhMucLop"("MaLop") ON DELETE CASCADE,
    "MaHocSinh" INT REFERENCES "DanhSachHocSinh"("MaHocSinh") ON DELETE CASCADE,
    "MaTieuChi" INT REFERENCES "QuyDinhThiDua"("MaTieuChi") ON DELETE CASCADE,
    "MaTuan" INT REFERENCES "DanhMucTuan"("MaTuan") ON DELETE CASCADE,
    "ThuTrongTuan" INT CHECK ("ThuTrongTuan" BETWEEN 2 AND 7) NOT NULL,
    "MaNguoiDungGhiNhan" INT REFERENCES "NguoiDung"("MaNguoiDung") ON DELETE SET NULL,
    "GhiChuChiTiet" TEXT
);

-- 8. Bảng ChiTietThanhTichHocSinh
CREATE TABLE IF NOT EXISTS "ChiTietThanhTichHocSinh" (
    "MaChiTietThanhTich" INT PRIMARY KEY,
    "MaLop" INT REFERENCES "DanhMucLop"("MaLop") ON DELETE CASCADE,
    "MaHocSinh" INT REFERENCES "DanhSachHocSinh"("MaHocSinh") ON DELETE CASCADE,
    "MaTieuChi" INT REFERENCES "QuyDinhThiDua"("MaTieuChi") ON DELETE CASCADE,
    "MaTuan" INT REFERENCES "DanhMucTuan"("MaTuan") ON DELETE CASCADE,
    "ThuTrongTuan" INT CHECK ("ThuTrongTuan" BETWEEN 2 AND 7) NOT NULL,
    "MonHoc" VARCHAR(100),
    "MaNguoiDungGhiNhan" INT REFERENCES "NguoiDung"("MaNguoiDung") ON DELETE SET NULL,
    "GhiChu" TEXT
);

-- 9. Bảng NhatKyViPhamHangNgay
CREATE TABLE IF NOT EXISTS "NhatKyViPhamHangNgay" (
    "MaNhatKy" INT PRIMARY KEY,
    "MaLop" INT REFERENCES "DanhMucLop"("MaLop") ON DELETE CASCADE,
    "MaTuan" INT REFERENCES "DanhMucTuan"("MaTuan") ON DELETE CASCADE,
    "MaTieuChi" INT REFERENCES "QuyDinhThiDua"("MaTieuChi") ON DELETE CASCADE,
    "ThuTrongTuan" INT CHECK ("ThuTrongTuan" BETWEEN 2 AND 7) NOT NULL,
    "SoLuong" INT DEFAULT 0,
    "TongDiemTruPhatSinh" NUMERIC DEFAULT 0
);

-- 10. Bảng ThanhTichHocTapTheoTuan
CREATE TABLE IF NOT EXISTS "ThanhTichHocTapTheoTuan" (
    "MaThanhTich" INT PRIMARY KEY,
    "MaLop" INT REFERENCES "DanhMucLop"("MaLop") ON DELETE CASCADE,
    "MaTuan" INT REFERENCES "DanhMucTuan"("MaTuan") ON DELETE CASCADE,
    "MaTieuChi" INT REFERENCES "QuyDinhThiDua"("MaTieuChi") ON DELETE CASCADE,
    "ThuTrongTuan" INT CHECK ("ThuTrongTuan" BETWEEN 2 AND 7) NOT NULL,
    "SoLuong" INT DEFAULT 0,
    "TongDiemCongPhatSinh" NUMERIC DEFAULT 0
);

-- 11. Bảng TongKetThiDuaTuan
CREATE TABLE IF NOT EXISTS "TongKetThiDuaTuan" (
    "MaTongKet" INT PRIMARY KEY,
    "MaLop" INT REFERENCES "DanhMucLop"("MaLop") ON DELETE CASCADE,
    "MaTuan" INT REFERENCES "DanhMucTuan"("MaTuan") ON DELETE CASCADE,
    "DiemGoc" NUMERIC DEFAULT 100,
    "TongDiemCong" NUMERIC DEFAULT 0,
    "TongDiemTru" NUMERIC DEFAULT 0,
    "DiemTongKet" NUMERIC DEFAULT 100,
    "XepHang" INT
);

-- 12. Bảng NhatKyChamDiem
CREATE TABLE IF NOT EXISTS "NhatKyChamDiem" (
    "MaNhatKy" INT PRIMARY KEY,
    "MaNguoiDung" INT REFERENCES "NguoiDung"("MaNguoiDung") ON DELETE SET NULL,
    "MaLop" INT REFERENCES "DanhMucLop"("MaLop") ON DELETE CASCADE,
    "MaTuan" INT REFERENCES "DanhMucTuan"("MaTuan") ON DELETE CASCADE,
    "LoaiGiaoDich" VARCHAR(10) CHECK ("LoaiGiaoDich" IN ('TRU', 'CONG')) NOT NULL,
    "NoiDungTomTat" TEXT NOT NULL,
    "DiemThayDoi" NUMERIC NOT NULL,
    "ThuTrongTuan" INT CHECK ("ThuTrongTuan" BETWEEN 2 AND 7) NOT NULL,
    "ThoiGianThucHien" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Hỗ trợ Bypass RLS tạm thời cho phát triển
ALTER TABLE "DanhMucLop" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "DanhMucTuan" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "QuyDinhThiDua" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "DanhSachHocSinh" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "NguoiDung" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "PhanCongCoDo" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "ChiTietViPhamHocSinh" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "ChiTietThanhTichHocSinh" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "NhatKyViPhamHangNgay" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "ThanhTichHocTapTheoTuan" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "TongKetThiDuaTuan" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "NhatKyChamDiem" DISABLE ROW LEVEL SECURITY;
