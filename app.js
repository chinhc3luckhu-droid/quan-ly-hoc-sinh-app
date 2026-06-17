/**
 * HỆ THỐNG THI ĐUA HỌC ĐƯỜNG (TDHD SYSTEM)
 * File: app.js
 * Logic vận hành toàn bộ Frontend và Cơ sở dữ liệu mô phỏng LocalStorage (11 bảng).
 */

// ============================================================================
// 0. CẤU HÌNH KẾT NỐI SUPABASE (ONLINE SYNC)
// ============================================================================
const SUPABASE_URL = "https://ityrvtsglaszhirogpig.supabase.co";
const SUPABASE_KEY = "sb_publishable_Xgu15PoWEk0ndO4zKJYGRA_u0dr2Bri";

let supabaseClient = null;
if (typeof supabase !== 'undefined' && SUPABASE_URL && SUPABASE_KEY) {
    try {
        supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        console.log("Supabase Client đã được khởi tạo thành công.");
    } catch (err) {
        console.error("Lỗi khởi tạo Supabase Client:", err);
    }
}

// ============================================================================
// 1. CẤU HÌNH TIÊU CHÍ THI ĐUA CHUẨN (Trích từ hình ảnh Quy chế)
// ============================================================================
const DEFAULT_CRITERIA = [
    // Nhóm 1: Điểm trừ (Vi phạm)
    { MaTieuChi: 1, NoiDung: "Không tập trung thứ 2 (Theo buổi)", Loai: "TRU", DiemChuyenDoi: 10, DonViTinh: "/buổi" },
    { MaTieuChi: 2, NoiDung: "Không tập trung thứ 2 (Theo học sinh)", Loai: "TRU", DiemChuyenDoi: 2, DonViTinh: "/HS" },
    { MaTieuChi: 3, NoiDung: "Thể dục giữa giờ (Theo lớp)", Loai: "TRU", DiemChuyenDoi: 10, DonViTinh: "/lớp" },
    { MaTieuChi: 4, NoiDung: "Đồng phục, áo Đoàn", Loai: "TRU", DiemChuyenDoi: 3, DonViTinh: "/HS" },
    { MaTieuChi: 5, NoiDung: "Đi học muộn, vào lớp muộn", Loai: "TRU", DiemChuyenDoi: 5, DonViTinh: "/HS" },
    { MaTieuChi: 6, NoiDung: "Vệ sinh lớp, khu vực", Loai: "TRU", DiemChuyenDoi: 10, DonViTinh: "/buổi" },
    { MaTieuChi: 7, NoiDung: "Sinh hoạt 15' (Không sinh hoạt)", Loai: "TRU", DiemChuyenDoi: 10, DonViTinh: "/buổi" },
    { MaTieuChi: 8, NoiDung: "Sinh hoạt 15' (Không sinh hoạt theo học sinh hoặc làm ồn)", Loai: "TRU", DiemChuyenDoi: 3, DonViTinh: "/HS" },
    { MaTieuChi: 9, NoiDung: "Hành vi: Hút thuốc", Loai: "TRU", DiemChuyenDoi: 20, DonViTinh: "/HS" },
    { MaTieuChi: 10, NoiDung: "Hành vi: Nói tục, chửi bậy", Loai: "TRU", DiemChuyenDoi: 20, DonViTinh: "/HS" },
    { MaTieuChi: 11, NoiDung: "Hành vi: Đánh nhau, trộm cắp, phá tài sản", Loai: "TRU", DiemChuyenDoi: 50, DonViTinh: "/HS" },
    { MaTieuChi: 12, NoiDung: "Hành vi: Vô lễ với giáo viên", Loai: "TRU", DiemChuyenDoi: 50, DonViTinh: "/HS" },
    { MaTieuChi: 13, NoiDung: "Thiếu đồ dùng học tập", Loai: "TRU", DiemChuyenDoi: 2, DonViTinh: "/HS" },
    { MaTieuChi: 14, NoiDung: "Không đội mũ bảo hiểm", Loai: "TRU", DiemChuyenDoi: 5, DonViTinh: "/HS" },
    { MaTieuChi: 15, NoiDung: "Nghỉ học không phép (KP)", Loai: "TRU", DiemChuyenDoi: 5, DonViTinh: "/HS/buổi" },
    { MaTieuChi: 16, NoiDung: "Nghỉ học có phép", Loai: "TRU", DiemChuyenDoi: 2, DonViTinh: "/HS/buổi" },
    { MaTieuChi: 17, NoiDung: "Bỏ tiết, sử dụng điện thoại trong giờ", Loai: "TRU", DiemChuyenDoi: 10, DonViTinh: "/HS/tiết" },
    { MaTieuChi: 18, NoiDung: "Không chuẩn bị bài ở nhà (Theo lớp)", Loai: "TRU", DiemChuyenDoi: 30, DonViTinh: "/lớp" },
    { MaTieuChi: 19, NoiDung: "Không chuẩn bị bài ở nhà (Theo học sinh)", Loai: "TRU", DiemChuyenDoi: 3, DonViTinh: "/HS" },
    { MaTieuChi: 20, NoiDung: "Kiểm tra miệng: Kém", Loai: "TRU", DiemChuyenDoi: 5, DonViTinh: "/HS" },
    { MaTieuChi: 21, NoiDung: "Kiểm tra miệng: Yếu", Loai: "TRU", DiemChuyenDoi: 2, DonViTinh: "/HS" },
    { MaTieuChi: 22, NoiDung: "Giờ học: Yếu", Loai: "TRU", DiemChuyenDoi: 15, DonViTinh: "/tiết" },
    { MaTieuChi: 23, NoiDung: "Giờ học: Trung bình", Loai: "TRU", DiemChuyenDoi: 10, DonViTinh: "/tiết" },
    { MaTieuChi: 24, NoiDung: "Làm việc riêng (Theo lớp)", Loai: "TRU", DiemChuyenDoi: 30, DonViTinh: "/lớp" },
    { MaTieuChi: 25, NoiDung: "Làm việc riêng (Theo học sinh)", Loai: "TRU", DiemChuyenDoi: 3, DonViTinh: "/HS" },
    { MaTieuChi: 26, NoiDung: "Quy định khác: Không đeo thẻ học sinh", Loai: "TRU", DiemChuyenDoi: 5, DonViTinh: "/HS" },
    { MaTieuChi: 27, NoiDung: "Quy định khác: Đỗ xe ở cổng trường", Loai: "TRU", DiemChuyenDoi: 5, DonViTinh: "/HS" },
    { MaTieuChi: 28, NoiDung: "Quy định khác: Tự ý đổi chỗ ngồi", Loai: "TRU", DiemChuyenDoi: 10, DonViTinh: "/HS/tiết" },
    { MaTieuChi: 29, NoiDung: "Quy định khác: Ngủ gật trong giờ học", Loai: "TRU", DiemChuyenDoi: 3, DonViTinh: "/HS" },

    // Nhóm 2: Điểm cộng (Thành tích)
    { MaTieuChi: 101, NoiDung: "Điểm kiểm tra miệng: Giỏi", Loai: "CONG", DiemChuyenDoi: 10, DonViTinh: "/HS" },
    { MaTieuChi: 102, NoiDung: "Điểm kiểm tra miệng: Khá", Loai: "CONG", DiemChuyenDoi: 3, DonViTinh: "/HS" },
    { MaTieuChi: 103, NoiDung: "Giờ học: Tốt", Loai: "CONG", DiemChuyenDoi: 5, DonViTinh: "/tiết" },
    { MaTieuChi: 104, NoiDung: "Giờ học: Khá", Loai: "CONG", DiemChuyenDoi: 2, DonViTinh: "/tiết" },
    { MaTieuChi: 105, NoiDung: "Đạt buổi học tốt", Loai: "CONG", DiemChuyenDoi: 30, DonViTinh: "/buổi" }
];

const CLASSES = [
    { MaLop: 1, TenLop: "10A", Khoi: 10, NamHoc: "2025-2026", BaseScore: 100 },
    { MaLop: 2, TenLop: "10B", Khoi: 10, NamHoc: "2025-2026", BaseScore: 100 },
    { MaLop: 3, TenLop: "10C", Khoi: 10, NamHoc: "2025-2026", BaseScore: 100 },
    { MaLop: 4, TenLop: "10D", Khoi: 10, NamHoc: "2025-2026", BaseScore: 100 },
    { MaLop: 5, TenLop: "11A", Khoi: 11, NamHoc: "2025-2026", BaseScore: 100 },
    { MaLop: 6, TenLop: "11B", Khoi: 11, NamHoc: "2025-2026", BaseScore: 100 },
    { MaLop: 7, TenLop: "11C", Khoi: 11, NamHoc: "2025-2026", BaseScore: 100 },
    { MaLop: 8, TenLop: "11D", Khoi: 11, NamHoc: "2025-2026", BaseScore: 100 },
    { MaLop: 9, TenLop: "12A", Khoi: 12, NamHoc: "2025-2026", BaseScore: 100 },
    { MaLop: 10, TenLop: "12B", Khoi: 12, NamHoc: "2025-2026", BaseScore: 100 },
    { MaLop: 11, TenLop: "12C", Khoi: 12, NamHoc: "2025-2026", BaseScore: 100 },
    { MaLop: 12, TenLop: "12D", Khoi: 12, NamHoc: "2025-2026", BaseScore: 100 },
    { MaLop: 13, TenLop: "12E", Khoi: 12, NamHoc: "2025-2026", BaseScore: 100 }
];

const WEEKS = [
    { MaTuan: 1, TenTuan: "Tuần 1", NgayBatDau: "2025-09-01", NgayKetThuc: "2025-09-06" },
    { MaTuan: 2, TenTuan: "Tuần 2", NgayBatDau: "2025-09-08", NgayKetThuc: "2025-09-13" },
    { MaTuan: 3, TenTuan: "Tuần 3", NgayBatDau: "2025-09-15", NgayKetThuc: "2025-09-20" }
];

// Dữ liệu dùng để sinh tên tự nhiên Tiếng Việt
const HO = ["Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Vũ", "Phan", "Đỗ", "Bùi", "Trịnh"];
const DEM_NAM = ["Văn", "Đức", "Quang", "Minh", "Tiến", "Hữu", "Xuân", "Thành", "Duy", "Anh"];
const DEM_NU = ["Thị", "Hồng", "Ngọc", "Quỳnh", "Hoài", "Thu", "Mai", "Cát", "Phương", "Khánh"];
const TEN_NAM = ["An", "Cường", "Đạt", "Hải", "Khải", "Minh", "Liêm", "Nam", "Phúc", "Quân", "Sơn", "Tâm", "Việt", "Anh", "Bảo", "Dũng", "Thắng", "Hùng", "Tuấn", "Phong"];
const TEN_NU = ["Bình", "Giang", "Huyền", "Lan", "Mai", "Oanh", "Uyên", "Yến", "Trang", "Linh", "Hà", "Phương", "Thảo", "Vy", "Nhi", "Vân", "Tú", "Hân", "Như", "Diệp"];

// Cờ đỏ cố định cho mỗi lớp (Học sinh #1 và #2 của mỗi lớp)
const CODO_DEFAULTS = {
    1: [{ HoTen: "Nguyễn Văn An", Email: "an.codo10a@school.edu.vn" }, { HoTen: "Lê Thị Bình", Email: "binh.codo10a@school.edu.vn" }],
    2: [{ HoTen: "Trần Quốc Cường", Email: "cuong.codo10b@school.edu.vn" }, { HoTen: "Phạm Minh Đạt", Email: "dat.codo10b@school.edu.vn" }],
    3: [{ HoTen: "Hoàng Thu Giang", Email: "giang.codo10c@school.edu.vn" }, { HoTen: "Đỗ Duy Hải", Email: "hai.codo10c@school.edu.vn" }],
    4: [{ HoTen: "Vũ Khánh Huyền", Email: "huyen.codo10d@school.edu.vn" }, { HoTen: "Bùi Quang Khải", Email: "khai.codo10d@school.edu.vn" }],
    5: [{ HoTen: "Trịnh Đức Minh", Email: "minh.codo11a@school.edu.vn" }, { HoTen: "Nguyễn Thị Lan", Email: "lan.codo11a@school.edu.vn" }],
    6: [{ HoTen: "Phan Thanh Liêm", Email: "liem.codo11b@school.edu.vn" }, { HoTen: "Ngô Quỳnh Mai", Email: "mai.codo11b@school.edu.vn" }],
    7: [{ HoTen: "Đặng Hoài Nam", Email: "nam.codo11c@school.edu.vn" }, { HoTen: "Võ Thị Oanh", Email: "oanh.codo11c@school.edu.vn" }],
    8: [{ HoTen: "Đỗ Hồng Phúc", Email: "phuc.codo11d@school.edu.vn" }, { HoTen: "Bùi Công Phượng", Email: "phuong.codo11d@school.edu.vn" }],
    9: [{ HoTen: "Nguyễn Minh Quân", Email: "quan.codo12a@school.edu.vn" }, { HoTen: "Lê Hồng Sơn", Email: "son.codo12a@school.edu.vn" }],
    10: [{ HoTen: "Phạm Minh Tâm", Email: "tam.codo12b@school.edu.vn" }, { HoTen: "Trần Thu Uyên", Email: "uyen.codo12b@school.edu.vn" }],
    11: [{ HoTen: "Vũ Hữu Việt", Email: "viet.codo12c@school.edu.vn" }, { HoTen: "Nguyễn Hải Yến", Email: "yen.codo12c@school.edu.vn" }],
    12: [{ HoTen: "Hoàng Trọng Anh", Email: "anh.codo12d@school.edu.vn" }, { HoTen: "Đặng Quốc Bảo", Email: "bao.codo12d@school.edu.vn" }],
    13: [{ HoTen: "Bùi Tiến Dũng", Email: "dung.codo12e@school.edu.vn" }, { HoTen: "Nguyễn Hữu Thắng", Email: "thang.codo12e@school.edu.vn" }]
};

// ============================================================================
// 2. KHỞI TẠO CƠ SỞ DỮ LIỆU LOCALSTORAGE (MÔ PHỎNG 11 BẢNG)
// ============================================================================
class MockDatabase {
    static async loadFromFile() {
        if (supabaseClient) {
            try {
                console.log("Đang tải dữ liệu từ Supabase...");
                const tableKeys = [
                    { localKey: "TDHD_DanhMucLop", dbTable: "DanhMucLop" },
                    { localKey: "TDHD_DanhMucTuan", dbTable: "DanhMucTuan" },
                    { localKey: "TDHD_QuyDinhThiDua", dbTable: "QuyDinhThiDua" },
                    { localKey: "TDHD_DanhSachHocSinh", dbTable: "DanhSachHocSinh" },
                    { localKey: "TDHD_NguoiDung", dbTable: "NguoiDung" },
                    { localKey: "TDHD_PhanCongCoDo", dbTable: "PhanCongCoDo" },
                    { localKey: "TDHD_ChiTietViPhamHocSinh", dbTable: "ChiTietViPhamHocSinh" },
                    { localKey: "TDHD_ChiTietThanhTichHocSinh", dbTable: "ChiTietThanhTichHocSinh" },
                    { localKey: "TDHD_NhatKyViPhamHangNgay", dbTable: "NhatKyViPhamHangNgay" },
                    { localKey: "TDHD_ThanhTichHocTapTheoTuan", dbTable: "ThanhTichHocTapTheoTuan" },
                    { localKey: "TDHD_TongKetThiDuaTuan", dbTable: "TongKetThiDuaTuan" },
                    { localKey: "TDHD_NhatKyChamDiem", dbTable: "NhatKyChamDiem" }
                ];

                const promises = tableKeys.map(async (t) => {
                    const { data, error } = await supabaseClient.from(t.dbTable).select("*");
                    if (error) throw error;
                    return { key: t.localKey, data: data || [] };
                });

                const results = await Promise.all(promises);
                const lopResult = results.find(r => r.key === "TDHD_DanhMucLop");
                if (lopResult && lopResult.data.length > 0) {
                    results.forEach(r => {
                        localStorage.setItem(r.key, JSON.stringify(r.data));
                    });
                    localStorage.setItem("TDHD_initialized", "true");
                    console.log("Tải dữ liệu từ Supabase thành công!");
                    return true;
                } else {
                    console.warn("Supabase trống (chưa di cư dữ liệu). Tiến hành tải dữ liệu từ db.json...");
                }
            } catch (err) {
                console.error("Lỗi khi tải dữ liệu từ Supabase, chuyển sang offline mode:", err.message);
            }
        }

        try {
            const response = await fetch("db.json");
            if (!response.ok) throw new Error("Could not fetch db.json");
            const data = await response.json();
            for (const [key, value] of Object.entries(data)) {
                localStorage.setItem(key, typeof value === "string" ? value : JSON.stringify(value));
            }
            localStorage.setItem("TDHD_initialized", "true");
            console.log("Cơ sở dữ liệu đã tải từ db.json vào localStorage.");
            return true;
        } catch (e) {
            console.warn("Không thể tải db.json, sử dụng dữ liệu bộ nhớ tạm:", e.message);
            return false;
        }
    }

    static async syncTableToSupabase(localKey, dbTable, pkName, useUpsert = false) {
        if (!supabaseClient) return;
        try {
            const data = JSON.parse(localStorage.getItem(localKey) || "[]");
            console.log(`[Sync] Đang đồng bộ bảng ${dbTable} lên Supabase (${data.length} bản ghi)...`);
            if (useUpsert) {
                if (data.length > 0) {
                    const { error } = await supabaseClient.from(dbTable).upsert(data);
                    if (error) throw error;
                }
            } else {
                // Xóa sạch và chèn lại để giữ đồng bộ tuyệt đối (tránh bản ghi mồ côi)
                const { error: deleteError } = await supabaseClient.from(dbTable).delete().gte(pkName, 1);
                if (deleteError) throw deleteError;

                if (data.length > 0) {
                    const { error: insertError } = await supabaseClient.from(dbTable).insert(data);
                    if (insertError) throw insertError;
                }
            }
            console.log(`[Sync] Đồng bộ bảng ${dbTable} THÀNH CÔNG!`);
        } catch (err) {
            console.error(`[Sync Error] Không thể đồng bộ bảng ${dbTable}:`, err.message);
        }
    }

    static syncAllTransactionData() {
        if (!supabaseClient) return;
        // Thực hiện bất đồng bộ chạy nền
        MockDatabase.syncTableToSupabase("TDHD_ChiTietViPhamHocSinh", "ChiTietViPhamHocSinh", "MaChiTiet");
        MockDatabase.syncTableToSupabase("TDHD_ChiTietThanhTichHocSinh", "ChiTietThanhTichHocSinh", "MaChiTietThanhTich");
        MockDatabase.syncTableToSupabase("TDHD_NhatKyViPhamHangNgay", "NhatKyViPhamHangNgay", "MaNhatKy");
        MockDatabase.syncTableToSupabase("TDHD_ThanhTichHocTapTheoTuan", "ThanhTichHocTapTheoTuan", "MaThanhTich");
        MockDatabase.syncTableToSupabase("TDHD_TongKetThiDuaTuan", "TongKetThiDuaTuan", "MaTongKet");
        MockDatabase.syncTableToSupabase("TDHD_NhatKyChamDiem", "NhatKyChamDiem", "MaNhatKy");
    }

    static init() {
        if (localStorage.getItem("TDHD_initialized")) {
            return;
        }

        // Bảng 3: DanhMucLop
        localStorage.setItem("TDHD_DanhMucLop", JSON.stringify(CLASSES));

        // Bảng 5: DanhMucTuan
        localStorage.setItem("TDHD_DanhMucTuan", JSON.stringify(WEEKS));

        // Bảng 6: QuyDinhThiDua
        localStorage.setItem("TDHD_QuyDinhThiDua", JSON.stringify(DEFAULT_CRITERIA));

        // Bảng 4: DanhSachHocSinh (260 học sinh - 20hs/lớp) & Bảng 1: NguoiDung
        const hocSinhList = [];
        const nguoiDungList = [
            { MaNguoiDung: 1, Email: "admin@school.edu.vn", MatKhauHash: "admin123", HoTen: "Thầy Tuấn - Admin", VaiTro: "ADMIN", MaLop: null, TrangThai: true }
        ];

        let studentIdCounter = 1;
        let userIdCounter = 2;

        CLASSES.forEach(lop => {
            const defaults = CODO_DEFAULTS[lop.MaLop];
            const birthYear = lop.Khoi === 10 ? 2010 : (lop.Khoi === 11 ? 2009 : 2008);

            for (let i = 1; i <= 20; i++) {
                let hoTen = "";
                let gioiTinh = "";
                let isCodo = false;
                let codoEmail = "";

                if (i <= 2) {
                    // Học sinh cờ đỏ cố định
                    hoTen = defaults[i - 1].HoTen;
                    gioiTinh = i === 1 ? "Nam" : "Nữ";
                    isCodo = true;
                    codoEmail = defaults[i - 1].Email;
                } else {
                    // Sinh ngẫu nhiên tên Tiếng Việt
                    gioiTinh = Math.random() > 0.5 ? "Nam" : "Nữ";
                    const randomHo = HO[Math.floor(Math.random() * HO.length)];
                    const randomDem = gioiTinh === "Nam" ? DEM_NAM[Math.floor(Math.random() * DEM_NAM.length)] : DEM_NU[Math.floor(Math.random() * DEM_NU.length)];
                    const randomTen = gioiTinh === "Nam" ? TEN_NAM[Math.floor(Math.random() * TEN_NAM.length)] : TEN_NU[Math.floor(Math.random() * TEN_NU.length)];
                    hoTen = `${randomHo} ${randomDem} ${randomTen}`;
                }

                const birthDate = `${birthYear}-0${Math.floor(Math.random() * 9) + 1}-${Math.floor(Math.random() * 20) + 10}`;

                hocSinhList.push({
                    MaHocSinh: studentIdCounter,
                    MaLop: lop.MaLop,
                    HoTen: hoTen,
                    NgaySinh: birthDate,
                    GioiTinh: gioiTinh
                });

                if (isCodo) {
                    nguoiDungList.push({
                        MaNguoiDung: userIdCounter++,
                        Email: codoEmail,
                        MatKhauHash: "codo123",
                        HoTen: hoTen,
                        VaiTro: "CO_DO",
                        MaLop: lop.MaLop,
                        TrangThai: true
                    });
                }

                studentIdCounter++;
            }

            // Tạo thêm 1 tài khoản Giáo viên chủ nhiệm lớp
            nguoiDungList.push({
                MaNguoiDung: userIdCounter++,
                Email: `gv.${lop.TenLop.toLowerCase()}@school.edu.vn`,
                MatKhauHash: "gv123",
                HoTen: `Cô Hương - GVCN ${lop.TenLop}`,
                VaiTro: "GIAO_VIEN",
                MaLop: lop.MaLop,
                TrangThai: true
            });
        });

        localStorage.setItem("TDHD_DanhSachHocSinh", JSON.stringify(hocSinhList));
        localStorage.setItem("TDHD_NguoiDung", JSON.stringify(nguoiDungList));

        // Bảng 2: PhanCongCoDo (Xoay tua 3 tuần)
        const phanCongList = [];
        let pcId = 1;

        WEEKS.forEach(tuan => {
            const shift1 = tuan.MaTuan === 1 ? 1 : (tuan.MaTuan === 2 ? 3 : 5);
            const shift2 = tuan.MaTuan === 1 ? 2 : (tuan.MaTuan === 2 ? 4 : 6);

            CLASSES.forEach((lop, index) => {
                // Lấy cờ đỏ 1 và cờ đỏ 2 của lớp này từ danh sách người dùng
                const codo1 = nguoiDungList.find(u => u.MaLop === lop.MaLop && u.VaiTro === "CO_DO" && u.Email.includes("_1"));
                const codo2 = nguoiDungList.find(u => u.MaLop === lop.MaLop && u.VaiTro === "CO_DO" && u.Email.includes("_2"));

                // Tính toán lớp chéo bằng modulo
                const targetLopIndex1 = (index + shift1) % CLASSES.length;
                const targetLopIndex2 = (index + shift2) % CLASSES.length;

                if (codo1) {
                    phanCongList.push({
                        MaPhanCong: pcId++,
                        MaNguoiDung: codo1.MaNguoiDung,
                        MaTuan: tuan.MaTuan,
                        MaLop: CLASSES[targetLopIndex1].MaLop
                    });
                }
                if (codo2) {
                    phanCongList.push({
                        MaPhanCong: pcId++,
                        MaNguoiDung: codo2.MaNguoiDung,
                        MaTuan: tuan.MaTuan,
                        MaLop: CLASSES[targetLopIndex2].MaLop
                    });
                }
            });
        });
        localStorage.setItem("TDHD_PhanCongCoDo", JSON.stringify(phanCongList));

        // Bảng 7: ChiTietViPhamHocSinh & Bảng 8: ChiTietThanhTichHocSinh (Sinh mẫu Tuần 1 sinh động)
        const viPhamList = [];
        const thanhTichList = [];
        let vpId = 1;
        let ttId = 1;

        // Sinh dữ liệu mẫu Tuần 1 để khớp với Podium và rankings mẫu trong index.html
        CLASSES.forEach(lop => {
            // Cờ đỏ đi chấm lớp này tuần 1
            const pc1 = phanCongList.find(p => p.MaLop === lop.MaLop && p.MaTuan === 1);
            const codoUser = pc1 ? nguoiDungList.find(u => u.MaNguoiDung === pc1.MaNguoiDung) : nguoiDungList[1];
            const hsLop = hocSinhList.filter(h => h.MaLop === lop.MaLop);

            if (lop.TenLop === "12D") {
                // Hạng 1 Tuần 1: Giờ học tốt nhiều (22 giờ tốt), ít phạt
                // Thưởng: 22 Giờ tốt (+5) = +110 điểm. 10 điểm giỏi miệng = +100 điểm. Tổng cộng = +210.
                for (let day = 2; day <= 7; day++) {
                    thanhTichList.push({
                        MaChiTietThanhTich: ttId++,
                        MaLop: lop.MaLop,
                        MaHocSinh: null,
                        MaTieuChi: 103, // Giờ tốt
                        MaTuan: 1,
                        ThuTrongTuan: day,
                        MonHoc: "Toán học",
                        MaNguoiDungGhiNhan: codoUser.MaNguoiDung,
                        GhiChu: "Giờ học tốt xuất sắc"
                    });
                }
                // Thêm 16 giờ tốt khác rải rác
                for (let k = 0; k < 16; k++) {
                    thanhTichList.push({
                        MaChiTietThanhTich: ttId++,
                        MaLop: lop.MaLop,
                        MaHocSinh: null,
                        MaTieuChi: 103,
                        MaTuan: 1,
                        ThuTrongTuan: (k % 5) + 2,
                        MonHoc: "Vật lý",
                        MaNguoiDungGhiNhan: codoUser.MaNguoiDung,
                        GhiChu: "Phát biểu tích cực"
                    });
                }
                // Thêm 7 điểm giỏi miệng
                for (let k = 0; k < 7; k++) {
                    const hs = hsLop[k % hsLop.length];
                    thanhTichList.push({
                        MaChiTietThanhTich: ttId++,
                        MaLop: lop.MaLop,
                        MaHocSinh: hs.MaHocSinh,
                        MaTieuChi: 101, // Giỏi miệng
                        MaTuan: 1,
                        ThuTrongTuan: (k % 5) + 2,
                        MonHoc: "Hóa học",
                        MaNguoiDungGhiNhan: codoUser.MaNguoiDung,
                        GhiChu: "Kiểm tra miệng đạt 10 điểm"
                    });
                }
                // Phạt: bị trừ 21 điểm (1 Vệ sinh lớp muộn -10, 1 Đi học muộn -5, 2 Đeo thẻ -10... tổng = 25)
                viPhamList.push({
                    MaChiTiet: vpId++,
                    MaLop: lop.MaLop,
                    MaHocSinh: null,
                    MaTieuChi: 6, // Vệ sinh lớp
                    MaTuan: 1,
                    ThuTrongTuan: 2,
                    MaNguoiDungGhiNhan: codoUser.MaNguoiDung,
                    GhiChuChiTiet: "Vệ sinh lớp muộn"
                });
                viPhamList.push({
                    MaChiTiet: vpId++,
                    MaLop: lop.MaLop,
                    MaHocSinh: hsLop[2].MaHocSinh,
                    MaTieuChi: 5, // Đi muộn
                    MaTuan: 1,
                    ThuTrongTuan: 2,
                    MaNguoiDungGhiNhan: codoUser.MaNguoiDung,
                    GhiChuChiTiet: "Đi học muộn 10 phút"
                });
                viPhamList.push({
                    MaChiTiet: vpId++,
                    MaLop: lop.MaLop,
                    MaHocSinh: hsLop[3].MaHocSinh,
                    MaTieuChi: 26, // Không đeo thẻ
                    MaTuan: 1,
                    ThuTrongTuan: 4,
                    MaNguoiDungGhiNhan: codoUser.MaNguoiDung,
                    GhiChuChiTiet: "Không đeo thẻ học sinh"
                });
                viPhamList.push({
                    MaChiTiet: vpId++,
                    MaLop: lop.MaLop,
                    MaHocSinh: hsLop[4].MaHocSinh,
                    MaTieuChi: 26, // Không đeo thẻ
                    MaTuan: 1,
                    ThuTrongTuan: 4,
                    MaNguoiDungGhiNhan: codoUser.MaNguoiDung,
                    GhiChuChiTiet: "Không đeo thẻ học sinh"
                });
            }
            else if (lop.TenLop === "12B") {
                // Hạng 2 Tuần 1: Thưởng: 19 Giờ tốt (+95), 10 điểm khá miệng (+30) = +125. Phạt: -18 điểm (1 Thể dục -10, 1 Đi muộn -5, 1 Đồ dùng -2? ...).
                for (let k = 0; k < 19; k++) {
                    thanhTichList.push({
                        MaChiTietThanhTich: ttId++,
                        MaLop: lop.MaLop,
                        MaHocSinh: null,
                        MaTieuChi: 103,
                        MaTuan: 1,
                        ThuTrongTuan: (k % 5) + 2,
                        MonHoc: "Sinh học",
                        MaNguoiDungGhiNhan: codoUser.MaNguoiDung,
                        GhiChu: "Lớp học tốt"
                    });
                }
                for (let k = 0; k < 10; k++) {
                    const hs = hsLop[k % hsLop.length];
                    thanhTichList.push({
                        MaChiTietThanhTich: ttId++,
                        MaLop: lop.MaLop,
                        MaHocSinh: hs.MaHocSinh,
                        MaTieuChi: 102, // Khá miệng (+3)
                        MaTuan: 1,
                        ThuTrongTuan: (k % 5) + 2,
                        MonHoc: "Lịch sử",
                        MaNguoiDungGhiNhan: codoUser.MaNguoiDung,
                        GhiChu: "Trả lời tốt"
                    });
                }
                viPhamList.push({
                    MaChiTiet: vpId++,
                    MaLop: lop.MaLop,
                    MaHocSinh: null,
                    MaTieuChi: 3, // Thể dục giữa giờ (-10)
                    MaTuan: 1,
                    ThuTrongTuan: 3,
                    MaNguoiDungGhiNhan: codoUser.MaNguoiDung,
                    GhiChuChiTiet: "Tập thể dục lộn xộn"
                });
                viPhamList.push({
                    MaChiTiet: vpId++,
                    MaLop: lop.MaLop,
                    MaHocSinh: hsLop[5].MaHocSinh,
                    MaTieuChi: 5, // Đi muộn (-5)
                    MaTuan: 1,
                    ThuTrongTuan: 3,
                    MaNguoiDungGhiNhan: codoUser.MaNguoiDung,
                    GhiChuChiTiet: "Đi học muộn"
                });
                viPhamList.push({
                    MaChiTiet: vpId++,
                    MaLop: lop.MaLop,
                    MaHocSinh: hsLop[6].MaHocSinh,
                    MaTieuChi: 29, // Ngủ gật (-3)
                    MaTuan: 1,
                    ThuTrongTuan: 5,
                    MaNguoiDungGhiNhan: codoUser.MaNguoiDung,
                    GhiChuChiTiet: "Ngủ gật trong giờ"
                });
            }
            else if (lop.TenLop === "12A") {
                // Hạng 3 Tuần 1: Thưởng: 27 giờ tốt (+135). Phạt: -16 điểm.
                for (let k = 0; k < 27; k++) {
                    thanhTichList.push({
                        MaChiTietThanhTich: ttId++,
                        MaLop: lop.MaLop,
                        MaHocSinh: null,
                        MaTieuChi: 103,
                        MaTuan: 1,
                        ThuTrongTuan: (k % 5) + 2,
                        MonHoc: "Địa lý",
                        MaNguoiDungGhiNhan: codoUser.MaNguoiDung,
                        GhiChu: "Lớp học tốt"
                    });
                }
                viPhamList.push({
                    MaChiTiet: vpId++,
                    MaLop: lop.MaLop,
                    MaHocSinh: hsLop[10].MaHocSinh,
                    MaTieuChi: 17, // Điện thoại (-10)
                    MaTuan: 1,
                    ThuTrongTuan: 5,
                    MaNguoiDungGhiNhan: codoUser.MaNguoiDung,
                    GhiChuChiTiet: "Sử dụng điện thoại"
                });
                viPhamList.push({
                    MaChiTiet: vpId++,
                    MaLop: lop.MaLop,
                    MaHocSinh: hsLop[11].MaHocSinh,
                    MaTieuChi: 14, // Mũ bảo hiểm (-5)
                    MaTuan: 1,
                    ThuTrongTuan: 6,
                    MaNguoiDungGhiNhan: codoUser.MaNguoiDung,
                    GhiChuChiTiet: "Không đội mũ bảo hiểm"
                });
            }
            else if (lop.TenLop === "11C") {
                // Đuôi bảng Tuần 1: Phạt cực nặng: -172 điểm. Thưởng: ít.
                // 15 lỗi đi học muộn = -75, 4 nghỉ học KP = -20, 2 bỏ tiết = -20, 1 đánh nhau = -50, 1 vô lễ GV = -50... tổng điểm trừ lớn.
                for (let k = 0; k < 15; k++) {
                    viPhamList.push({
                        MaChiTiet: vpId++,
                        MaLop: lop.MaLop,
                        MaHocSinh: hsLop[k % hsLop.length].MaHocSinh,
                        MaTieuChi: 5, // Đi muộn
                        MaTuan: 1,
                        ThuTrongTuan: (k % 5) + 2,
                        MaNguoiDungGhiNhan: codoUser.MaNguoiDung,
                        GhiChuChiTiet: "Đi muộn nề nếp"
                    });
                }
                viPhamList.push({
                    MaChiTiet: vpId++,
                    MaLop: lop.MaLop,
                    MaHocSinh: hsLop[2].MaHocSinh,
                    MaTieuChi: 11, // Đánh nhau, phá tài sản (-50)
                    MaTuan: 1,
                    ThuTrongTuan: 4,
                    MaNguoiDungGhiNhan: codoUser.MaNguoiDung,
                    GhiChuChiTiet: "Làm hỏng bàn ghế học sinh"
                });
                viPhamList.push({
                    MaChiTiet: vpId++,
                    MaLop: lop.MaLop,
                    MaHocSinh: hsLop[3].MaHocSinh,
                    MaTieuChi: 12, // Vô lễ GV (-50)
                    MaTuan: 1,
                    ThuTrongTuan: 5,
                    MaNguoiDungGhiNhan: codoUser.MaNguoiDung,
                    GhiChuChiTiet: "Cãi lời giáo viên bộ môn"
                });
            }
            else {
                // Các lớp khác sinh ngẫu nhiên vừa phải
                const numThong = Math.floor(Math.random() * 8) + 5; // 5 - 12 giờ tốt
                for (let k = 0; k < numThong; k++) {
                    thanhTichList.push({
                        MaChiTietThanhTich: ttId++,
                        MaLop: lop.MaLop,
                        MaHocSinh: null,
                        MaTieuChi: 103,
                        MaTuan: 1,
                        ThuTrongTuan: (k % 5) + 2,
                        MonHoc: "Tin học",
                        MaNguoiDungGhiNhan: codoUser.MaNguoiDung,
                        GhiChu: "Lớp học tốt"
                    });
                }
                const numPhat = Math.floor(Math.random() * 5); // 0 - 4 lỗi đi muộn
                for (let k = 0; k < numPhat; k++) {
                    viPhamList.push({
                        MaChiTiet: vpId++,
                        MaLop: lop.MaLop,
                        MaHocSinh: hsLop[k % hsLop.length].MaHocSinh,
                        MaTieuChi: 5, // Đi muộn
                        MaTuan: 1,
                        ThuTrongTuan: (k % 5) + 2,
                        MaNguoiDungGhiNhan: codoUser.MaNguoiDung,
                        GhiChuChiTiet: "Đi học muộn"
                    });
                }
            }
        });

        // Lưu vào LocalStorage
        localStorage.setItem("TDHD_ChiTietViPhamHocSinh", JSON.stringify(viPhamList));
        localStorage.setItem("TDHD_ChiTietThanhTichHocSinh", JSON.stringify(thanhTichList));

        // Sinh dữ liệu mẫu cho NhatKyChamDiem
        const nhatKyList = [];
        let nkcdId = 1;
        const students = hocSinhList;
        const criteria = DEFAULT_CRITERIA;

        viPhamList.forEach(v => {
            const tc = criteria.find(c => c.MaTieuChi === v.MaTieuChi);
            const hs = v.MaHocSinh ? students.find(s => s.MaHocSinh === v.MaHocSinh) : null;
            const targetName = hs ? hs.HoTen : "Tập thể lớp";
            const tcName = tc ? tc.NoiDung : "Vi phạm";
            const score = tc ? tc.DiemChuyenDoi : 0;
            const weekObj = WEEKS.find(w => w.MaTuan === v.MaTuan);
            const thoiGian = new Date(new Date(weekObj ? weekObj.NgayBatDau : "2025-09-01").getTime() + (v.ThuTrongTuan - 2) * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000).toISOString();

            nhatKyList.push({
                MaNhatKy: nkcdId++,
                MaNguoiDung: v.MaNguoiDungGhiNhan,
                MaLop: v.MaLop,
                MaTuan: v.MaTuan,
                LoaiGiaoDich: "TRU",
                NoiDungTomTat: `${tcName} · ${hs ? 'Học sinh' : 'Đối tượng'}: ${targetName}`,
                DiemThayDoi: -score,
                ThuTrongTuan: v.ThuTrongTuan,
                ThoiGianThucHien: thoiGian
            });
        });

        thanhTichList.forEach(t => {
            const tc = criteria.find(c => c.MaTieuChi === t.MaTieuChi);
            const hs = t.MaHocSinh ? students.find(s => s.MaHocSinh === t.MaHocSinh) : null;
            const targetName = hs ? hs.HoTen : "Tập thể lớp";
            const tcName = tc ? tc.NoiDung : "Thành tích";
            const score = tc ? tc.DiemChuyenDoi : 0;
            const weekObj = WEEKS.find(w => w.MaTuan === t.MaTuan);
            const thoiGian = new Date(new Date(weekObj ? weekObj.NgayBatDau : "2025-09-01").getTime() + (t.ThuTrongTuan - 2) * 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000).toISOString();

            nhatKyList.push({
                MaNhatKy: nkcdId++,
                MaNguoiDung: t.MaNguoiDungGhiNhan,
                MaLop: t.MaLop,
                MaTuan: t.MaTuan,
                LoaiGiaoDich: "CONG",
                NoiDungTomTat: `${tcName} · ${hs ? 'Học sinh' : 'Đối tượng'}: ${targetName}`,
                DiemThayDoi: score,
                ThuTrongTuan: t.ThuTrongTuan,
                ThoiGianThucHien: thoiGian
            });
        });

        localStorage.setItem("TDHD_NhatKyChamDiem", JSON.stringify(nhatKyList));

        // Báo hiệu đã khởi tạo database thành công
        localStorage.setItem("TDHD_initialized", "true");

        // Tự động chạy tổng hợp điểm cho cả 3 tuần để cập nhật các bảng tổng hợp và bảng chốt xếp hạng
        MockDatabase.recalculateAllWeeks();
    }

    // Tự động tổng hợp dữ liệu giao dịch chi tiết sang bảng tổng hợp tĩnh và tính xếp hạng
    static recalculateAllWeeks() {
        const viPhams = JSON.parse(localStorage.getItem("TDHD_ChiTietViPhamHocSinh") || "[]");
        let thanhTichs = JSON.parse(localStorage.getItem("TDHD_ChiTietThanhTichHocSinh") || "[]");
        const classes = JSON.parse(localStorage.getItem("TDHD_DanhMucLop") || "[]");
        const criteria = JSON.parse(localStorage.getItem("TDHD_QuyDinhThiDua") || "[]");

        // 1. Xóa sạch các bản ghi 'Đạt buổi học tốt' (105) cũ để tính toán lại từ đầu
        thanhTichs = thanhTichs.filter(t => t.MaTieuChi !== 105);
        let nextTtId = thanhTichs.length > 0 ? Math.max(...thanhTichs.map(t => t.MaChiTietThanhTich)) + 1 : 1;

        // 2. Tự động quét và chèn bản ghi 'Đạt buổi học tốt' (105) nếu số tiết học tốt đạt tối đa
        WEEKS.forEach(tuan => {
            const weekId = tuan.MaTuan;
            classes.forEach(lop => {
                for (let thu = 2; thu <= 7; thu++) {
                    const maxP = (thu === 2 || thu === 7) ? 4 : 5;
                    const countTot = thanhTichs.filter(t => t.MaLop === lop.MaLop && t.MaTuan === weekId && t.ThuTrongTuan === thu && t.MaTieuChi === 103).length;

                    if (countTot >= maxP) {
                        thanhTichs.push({
                            MaChiTietThanhTich: nextTtId++,
                            MaLop: lop.MaLop,
                            MaHocSinh: null,
                            MaTieuChi: 105, // Đạt buổi học tốt
                            MaTuan: weekId,
                            ThuTrongTuan: thu,
                            MonHoc: "Học tập",
                            MaNguoiDungGhiNhan: 1, // Admin / Hệ thống
                            GhiChu: `Tự động đạt: Đủ ${countTot}/${maxP} tiết Tốt`
                        });
                    }
                }
            });
        });

        // Lưu lại danh sách chi tiết thành tích mới đã cập nhật vào LocalStorage
        localStorage.setItem("TDHD_ChiTietThanhTichHocSinh", JSON.stringify(thanhTichs));

        const nhatKyViPham = [];
        const thanhTichTuan = [];
        const tongKetTuan = [];

        let nkId = 1;
        let tttId = 1;
        let tkId = 1;

        WEEKS.forEach(tuan => {
            const weekId = tuan.MaTuan;

            // 1. Tổng hợp điểm trừ hàng ngày (Bảng 9)
            // Gom nhóm: MaLop, MaTieuChi, ThuTrongTuan
            classes.forEach(lop => {
                const lopVps = viPhams.filter(v => v.MaLop === lop.MaLop && v.MaTuan === weekId);
                const groupedVps = {};

                lopVps.forEach(v => {
                    const key = `${v.MaTieuChi}_${v.ThuTrongTuan}`;
                    if (!groupedVps[key]) {
                        groupedVps[key] = { MaTieuChi: v.MaTieuChi, ThuTrongTuan: v.ThuTrongTuan, SoLuong: 0 };
                    }
                    groupedVps[key].SoLuong++;
                });

                Object.values(groupedVps).forEach(g => {
                    const tc = criteria.find(c => c.MaTieuChi === g.MaTieuChi);
                    const diemTru = tc ? tc.DiemChuyenDoi : 0;
                    nhatKyViPham.push({
                        MaNhatKy: nkId++,
                        MaLop: lop.MaLop,
                        MaTuan: weekId,
                        MaTieuChi: g.MaTieuChi,
                        ThuTrongTuan: g.ThuTrongTuan,
                        SoLuong: g.SoLuong,
                        TongDiemTruPhatSinh: g.SoLuong * diemTru
                    });
                });
            });

            // 2. Tổng hợp điểm cộng hàng ngày (Bảng 10)
            classes.forEach(lop => {
                const lopTts = thanhTichs.filter(t => t.MaLop === lop.MaLop && t.MaTuan === weekId);
                const groupedTts = {};

                lopTts.forEach(t => {
                    const key = `${t.MaTieuChi}_${t.ThuTrongTuan}`;
                    if (!groupedTts[key]) {
                        groupedTts[key] = { MaTieuChi: t.MaTieuChi, ThuTrongTuan: t.ThuTrongTuan, SoLuong: 0 };
                    }
                    groupedTts[key].SoLuong++;
                });

                Object.values(groupedTts).forEach(g => {
                    const tc = criteria.find(c => c.MaTieuChi === g.MaTieuChi);
                    const diemCong = tc ? tc.DiemChuyenDoi : 0;
                    thanhTichTuan.push({
                        MaThanhTich: tttId++,
                        MaLop: lop.MaLop,
                        MaTuan: weekId,
                        MaTieuChi: g.MaTieuChi,
                        ThuTrongTuan: g.ThuTrongTuan,
                        SoLuong: g.SoLuong,
                        TongDiemCongPhatSinh: g.SoLuong * diemCong
                    });
                });
            });

            // 3. Tổng kết và tự xếp hạng tuần (Bảng 11)
            const classScores = [];
            classes.forEach(lop => {
                const totalMinus = nhatKyViPham
                    .filter(nk => nk.MaLop === lop.MaLop && nk.MaTuan === weekId)
                    .reduce((sum, item) => sum + item.TongDiemTruPhatSinh, 0);

                const totalPlus = thanhTichTuan
                    .filter(tt => tt.MaLop === lop.MaLop && tt.MaTuan === weekId)
                    .reduce((sum, item) => sum + item.TongDiemCongPhatSinh, 0);

                const finalScore = lop.BaseScore + totalPlus - totalMinus;

                classScores.push({
                    MaLop: lop.MaLop,
                    DiemGoc: lop.BaseScore,
                    TongDiemCong: totalPlus,
                    TongDiemTru: totalMinus,
                    DiemTongKet: finalScore
                });
            });

            // Đánh thứ hạng giảm dần (Hàm DENSE_RANK)
            classScores.sort((a, b) => b.DiemTongKet - a.DiemTongKet);
            let activeRank = 1;
            let prevScore = null;

            classScores.forEach((cs, rankIndex) => {
                if (prevScore !== null && cs.DiemTongKet < prevScore) {
                    activeRank = rankIndex + 1;
                }
                prevScore = cs.DiemTongKet;

                tongKetTuan.push({
                    MaTongKet: tkId++,
                    MaLop: cs.MaLop,
                    MaTuan: weekId,
                    DiemGoc: cs.DiemGoc,
                    TongDiemCong: cs.TongDiemCong,
                    TongDiemTru: cs.TongDiemTru,
                    DiemTongKet: cs.DiemTongKet,
                    XepHang: activeRank
                });
            });
        });

        localStorage.setItem("TDHD_NhatKyViPhamHangNgay", JSON.stringify(nhatKyViPham));
        localStorage.setItem("TDHD_ThanhTichHocTapTheoTuan", JSON.stringify(thanhTichTuan));
        localStorage.setItem("TDHD_TongKetThiDuaTuan", JSON.stringify(tongKetTuan));
    }
}

// ============================================================================
// 3. TRÌNH QUẢN LÝ TRẠNG THÁI GIAO DIỆN (UI STATE MANAGER)
// ============================================================================
class AppStateManager {
    constructor() {
        this.currentRole = "ADMIN"; // Vai trò mặc định giả lập
        this.currentWeekId = 1;      // Tuần mặc định
        this.activeTab = "dashboard"; // Tab active hiện tại
        this.currentSelectedClassId = 5; // Mặc định lớp 11A bên Hồ sơ học sinh
        this.currentUser = null;

        this.initDOM();
        this.bindEvents();
        this.syncRole();
        this.renderAll();
    }

    initDOM() {
        // Dropdown giả lập đóng vai và chọn tuần
        this.roleSelector = document.getElementById("role-selector");
        this.weekSelector = document.getElementById("select-week");

        // Các tab view
        this.tabs = document.querySelectorAll(".nav-item");
        this.tabViews = document.querySelectorAll(".tab-view");

        // User profile widget elements
        this.userDisplayName = document.getElementById("user-display-name");
        this.userDisplayRole = document.getElementById("user-display-role");

        // Lưới Ghi Sổ Trực Ma Trận
        this.scoringSelectWeek = document.getElementById("scoring-select-week");
        this.scoringSelectLop = document.getElementById("scoring-select-lop");
        this.scoringAssignmentHelper = document.getElementById("scoring-assignment-helper");
        this.scoringMatrixContainer = document.getElementById("scoring-matrix-container");
        this.violationMatrixTbody = document.getElementById("violation-matrix-tbody");
        this.achievementMatrixTbody = document.getElementById("achievement-matrix-tbody");
        this.btnSaveMatrix = document.getElementById("btn-save-matrix");
        this.recentLogsList = document.getElementById("recent-logs-list");

        // Bảng Tổng Hợp Vi Phạm
        this.summarySelectWeek = document.getElementById("summary-select-week");
        this.summarySelectLop = document.getElementById("summary-select-lop");
        this.summaryMatrixContainer = document.getElementById("summary-matrix-container");
        this.summaryMatrixTitle = document.getElementById("summary-matrix-title");
        this.summaryMatrixTbody = document.getElementById("summary-matrix-tbody");

        // Bảng Tổng Hợp Điểm Trừ Lớp Học (ở Bảng Xếp Hạng)
        this.dashboardSummaryTheadTr = document.getElementById("dashboard-violation-summary-thead-tr");
        this.dashboardSummaryTbody = document.getElementById("dashboard-violation-summary-tbody");

        // Bảng Tổng Hợp Điểm Cộng Lớp Học (ở Bảng Xếp Hạng)
        this.dashboardAchievementSummaryTheadTr = document.getElementById("dashboard-achievement-summary-thead-tr");
        this.dashboardAchievementSummaryTbody = document.getElementById("dashboard-achievement-summary-tbody");

        // Dialog phân công mới và cảnh báo an toàn
        this.alertDialog = document.getElementById("alert-dialog");
        this.btnCloseDialog = document.getElementById("btn-close-dialog");

        this.assignDialog = document.getElementById("assignment-form-dialog");
        this.assignForm = document.getElementById("assignment-dialog-form");
        this.assignCodoSelect = document.getElementById("assign-codo");
        this.assignWeekSelect = document.getElementById("assign-week");
        this.assignLopSelect = document.getElementById("assign-lop");
        this.btnCancelAssign = document.getElementById("btn-cancel-assign-dialog");

        // Dialog thống kê chi tiết vi phạm
        this.violationDetailDialog = document.getElementById("violation-detail-dialog");
        this.violationDetailTitle = document.getElementById("violation-detail-title");
        this.violationDetailTbody = document.getElementById("violation-detail-tbody");
        this.btnCloseViolationDetail = document.getElementById("btn-close-violation-detail");

        // Các nút phân quyền đặc biệt của Admin
        this.btnAddAssignment = document.getElementById("btn-add-assignment");
        this.btnSaveAssignments = document.getElementById("btn-save-assignments");
        this.btnAddCriterion = document.getElementById("btn-add-criterion");
        this.btnAddStudent = document.getElementById("btn-add-student");
        this.btnRecalculate = document.getElementById("btn-recalculate");

        // Báo lỗi form radio
        this.radioLoaiTru = document.getElementById("label-loai-tru");
        this.radioLoaiCong = document.getElementById("label-loai-cong");

        // Dialog thêm tiêu chí mới
        this.criterionDialog = document.getElementById("criterion-form-dialog");
        this.criterionForm = document.getElementById("criterion-dialog-form");
        this.criterionContent = document.getElementById("criterion-content");
        this.criterionType = document.getElementById("criterion-type");
        this.criterionScore = document.getElementById("criterion-score");
        this.criterionUnit = document.getElementById("criterion-unit");
        this.btnCancelCriterion = document.getElementById("btn-cancel-criterion-dialog");
        this.btnSaveRegulations = document.getElementById("btn-save-regulations");

        // Dialog thêm học sinh mới
        this.studentDialog = document.getElementById("student-form-dialog");
        this.studentForm = document.getElementById("student-dialog-form");
        this.studentNameInput = document.getElementById("student-name");
        this.studentDobInput = document.getElementById("student-dob");
        this.studentGenderSelect = document.getElementById("student-gender");
        this.btnCancelStudent = document.getElementById("btn-cancel-student-dialog");
        this.btnSaveStudents = document.getElementById("btn-save-students");

        // Elements for Import Student Dialog
        this.btnDownloadTemplateStudent = document.getElementById("btn-download-template-student");
        this.btnImportStudentModal = document.getElementById("btn-import-student-modal");
        this.importDialog = document.getElementById("student-import-dialog");
        this.importForm = document.getElementById("student-import-form");
        this.importFileInput = document.getElementById("student-file-input");
        this.importPreviewContainer = document.getElementById("import-preview-container");
        this.importPreviewTbody = document.getElementById("import-preview-tbody");
        this.importSummaryText = document.getElementById("import-summary-text");
        this.btnCancelImportDialog = document.getElementById("btn-cancel-import-dialog");
        this.btnSubmitImportStudents = document.getElementById("btn-submit-import-students");

        this.studentDetailDialog = document.getElementById("student-detail-dialog");
        this.studentDetailTitle = document.getElementById("student-detail-title");
        this.studentDetailTbody = document.getElementById("student-detail-tbody");
        this.btnCloseStudentDetail = document.getElementById("btn-close-student-detail");

        this.regulationsState = null;
        this.editingCriterionId = null;
        this.studentsState = null;
        this.editingStudentId = null;
        this.tempImportedStudents = [];
    }

    bindEvents() {
        // Đăng vai trò
        this.roleSelector.addEventListener("change", (e) => {
            this.currentRole = e.target.value;
            this.regulationsState = null;
            this.studentsState = null;
            this.syncRole();
            this.renderAll();
        });

        // Đăng ký tuần
        this.weekSelector.addEventListener("change", (e) => {
            this.currentWeekId = parseInt(e.target.value);
            this.renderAll();
        });

        // Đổi tab điều hướng
        this.tabs.forEach(tab => {
            tab.addEventListener("click", () => {
                this.tabs.forEach(t => t.classList.remove("active"));
                tab.classList.add("active");

                const targetTab = tab.getAttribute("data-tab");
                this.activeTab = targetTab;

                this.tabViews.forEach(view => {
                    view.classList.remove("active");
                    if (view.id === `tab-${targetTab}`) {
                        view.classList.add("active");
                    }
                });

                this.renderTab(targetTab);
            });
        });

        // Thay đổi Lớp hoặc Tuần trong Tab Ghi Sổ Trực -> Tải và hiển thị Ma trận tương ứng
        if (this.scoringSelectLop) {
            this.scoringSelectLop.addEventListener("change", () => {
                this.loadMatrixData();
            });
        }
        if (this.scoringSelectWeek) {
            this.scoringSelectWeek.addEventListener("change", () => {
                this.loadMatrixData();
            });
        }

        // Bấm lưu toàn bộ bảng điểm ma trận
        if (this.btnSaveMatrix) {
            this.btnSaveMatrix.addEventListener("click", () => {
                this.saveMatrixData();
            });
        }

        // Thay đổi Lớp hoặc Tuần trong Bảng Tổng Hợp Vi Phạm -> Tải thống kê
        if (this.summarySelectLop) {
            this.summarySelectLop.addEventListener("change", () => {
                this.loadSummaryMatrixData();
            });
        }
        if (this.summarySelectWeek) {
            this.summarySelectWeek.addEventListener("change", () => {
                this.loadSummaryMatrixData();
            });
        }

        // Đóng hộp thoại cảnh báo an toàn
        this.btnCloseDialog.addEventListener("click", () => {
            this.alertDialog.close();
        });

        // Đóng hộp thoại chi tiết vi phạm
        if (this.btnCloseViolationDetail) {
            this.btnCloseViolationDetail.addEventListener("click", () => {
                this.violationDetailDialog.close();
            });
        }

        // Đóng hộp thoại chi tiết học sinh
        if (this.btnCloseStudentDetail) {
            this.btnCloseStudentDetail.addEventListener("click", () => {
                this.studentDetailDialog.close();
            });
        }

        // Nút phân công trực mới của Admin
        if (this.btnAddAssignment) {
            this.btnAddAssignment.addEventListener("click", () => {
                this.openAssignDialog();
            });
        }

        // Nút lưu phân công trực chéo dạng bảng
        if (this.btnSaveAssignments) {
            this.btnSaveAssignments.addEventListener("click", () => {
                this.saveAssignmentsData();
            });
        }

        // Hủy popup phân công
        this.btnCancelAssign.addEventListener("click", () => {
            this.assignDialog.close();
        });

        // Submit form phân công mới của Admin
        this.assignForm.addEventListener("submit", (e) => {
            e.preventDefault();
            this.handleAssignSubmit();
        });

        // Nút tính lại điểm thủ công của Admin
        if (this.btnRecalculate) {
            this.btnRecalculate.addEventListener("click", () => {
                MockDatabase.recalculateAllWeeks();
                this.renderAll();
                alert("Đã cập nhật tính lại toàn bộ điểm và xếp hạng tuần!");
            });
        }

        // Nút thêm tiêu chí mới của Admin
        if (this.btnAddCriterion) {
            this.btnAddCriterion.addEventListener("click", () => {
                this.editingCriterionId = null;
                const dialogTitle = this.criterionDialog.querySelector("h3");
                if (dialogTitle) dialogTitle.textContent = "Thêm Tiêu Chí Thi Đua Mới";
                this.criterionContent.value = "";
                this.criterionType.value = "TRU";
                this.criterionScore.value = "";
                this.criterionUnit.value = "";
                this.criterionDialog.showModal();
            });
        }

        // Hủy popup thêm tiêu chí
        if (this.btnCancelCriterion) {
            this.btnCancelCriterion.addEventListener("click", () => {
                this.criterionDialog.close();
            });
        }

        // Submit form thêm tiêu chí của Admin
        if (this.criterionForm) {
            this.criterionForm.addEventListener("submit", (e) => {
                e.preventDefault();
                this.handleCriterionSubmit();
            });
        }

        // Nút lưu thực hiện bộ quy chế thi đua
        if (this.btnSaveRegulations) {
            this.btnSaveRegulations.addEventListener("click", () => {
                if (this.currentRole !== "ADMIN") return;
                if (!this.regulationsState) {
                    this.regulationsState = JSON.parse(localStorage.getItem("TDHD_QuyDinhThiDua") || "[]");
                }
                localStorage.setItem("TDHD_QuyDinhThiDua", JSON.stringify(this.regulationsState));
                
                // Đồng bộ lên Supabase
                MockDatabase.syncTableToSupabase("TDHD_QuyDinhThiDua", "QuyDinhThiDua", "MaTieuChi", true);
                
                alert("Đã lưu và đồng bộ toàn bộ quy chế thi đua học đường thành công!");
                this.renderRegulationsTab();
            });
        }

        // Sự kiện Dialog thêm học sinh mới
        if (this.btnAddStudent) {
            this.btnAddStudent.addEventListener("click", () => {
                this.editingStudentId = null;
                const dialogTitle = this.studentDialog.querySelector("h3");
                if (dialogTitle) dialogTitle.textContent = "Thêm Học Sinh Mới";
                this.studentNameInput.value = "";
                this.studentDobInput.value = "";
                this.studentGenderSelect.value = "Nam";
                this.studentDialog.showModal();
            });
        }

        if (this.btnCancelStudent) {
            this.btnCancelStudent.addEventListener("click", () => {
                this.studentDialog.close();
            });
        }

        if (this.studentForm) {
            this.studentForm.addEventListener("submit", (e) => {
                e.preventDefault();
                this.handleStudentSubmit();
            });
        }

        // Nút lưu thực hiện thay đổi danh sách học sinh
        if (this.btnSaveStudents) {
            this.btnSaveStudents.addEventListener("click", () => {
                if (this.currentRole !== "ADMIN") return;
                if (!this.studentsState) {
                    this.studentsState = JSON.parse(localStorage.getItem("TDHD_DanhSachHocSinh") || "[]");
                }
                localStorage.setItem("TDHD_DanhSachHocSinh", JSON.stringify(this.studentsState));
                
                // Đồng bộ lên Supabase
                MockDatabase.syncTableToSupabase("TDHD_DanhSachHocSinh", "DanhSachHocSinh", "MaHocSinh", true);
                
                alert("Đã lưu và đồng bộ toàn bộ danh sách học sinh thành công!");
                this.renderStudentsTab();
            });
        }

        // Sự kiện import học sinh từ file Excel/CSV mẫu
        if (this.btnDownloadTemplateStudent) {
            this.btnDownloadTemplateStudent.addEventListener("click", () => {
                const sep = "sep=,\n";
                const headers = "Họ tên,Ngày sinh,Giới tính\n";
                const rows = "Nguyễn Văn A,15/05/2009,Nam\nTrần Thị B,24/10/2009,Nữ\nLê Văn C,08/12/2009,Nam";
                const csvContent = sep + headers + rows;
                const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.setAttribute("href", url);
                link.setAttribute("download", "mau_import_hoc_sinh.csv");
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            });
        }

        if (this.btnImportStudentModal) {
            this.btnImportStudentModal.addEventListener("click", () => {
                this.tempImportedStudents = [];
                this.importFileInput.value = "";
                this.importPreviewContainer.style.display = "none";
                this.importSummaryText.textContent = "";
                this.importSummaryText.style.color = "var(--text-muted)";
                this.btnSubmitImportStudents.disabled = true;
                this.importDialog.showModal();
            });
        }

        if (this.btnCancelImportDialog) {
            this.btnCancelImportDialog.addEventListener("click", () => {
                this.importDialog.close();
            });
        }

        if (this.importFileInput) {
            this.importFileInput.addEventListener("change", (e) => {
                const file = e.target.files[0];
                if (!file) return;

                const reader = new FileReader();
                reader.onload = (evt) => {
                    this.processCSVText(evt.target.result);
                };
                reader.readAsText(file, "UTF-8");
            });
        }


        if (this.importForm) {
            this.importForm.addEventListener("submit", (e) => {
                e.preventDefault();
                if (this.tempImportedStudents.length === 0) return;

                if (!this.studentsState) {
                    this.studentsState = JSON.parse(localStorage.getItem("TDHD_DanhSachHocSinh") || "[]");
                }

                let nextId = this.studentsState.length > 0 ? Math.max(...this.studentsState.map(s => s.MaHocSinh)) + 1 : 1;

                this.tempImportedStudents.forEach(item => {
                    this.studentsState.push({
                        MaHocSinh: nextId++,
                        HoTen: item.HoTen,
                        MaLop: this.currentSelectedClassId,
                        NgaySinh: item.NgaySinh,
                        GioiTinh: item.GioiTinh,
                        is_active: true
                    });
                });

                this.importDialog.close();
                this.renderStudentsTab();
            });
        }
    }

    syncRole() {
        // Tìm tài khoản người dùng mẫu tương ứng vai trò
        const users = JSON.parse(localStorage.getItem("TDHD_NguoiDung") || "[]");

        if (this.currentRole === "ADMIN") {
            this.currentUser = users.find(u => u.VaiTro === "ADMIN");
            this.userDisplayName.textContent = "Thầy Tuấn";
            this.userDisplayRole.textContent = "Admin - Tổng Phụ Trách";

            // Hiển thị các nút Quản trị
            if (this.btnAddAssignment) this.btnAddAssignment.style.display = "inline-flex";
            if (this.btnAddCriterion) this.btnAddCriterion.style.display = "inline-flex";
            if (this.btnAddStudent) this.btnAddStudent.style.display = "inline-flex";
            if (this.btnDownloadTemplateStudent) this.btnDownloadTemplateStudent.style.display = "inline-flex";
            if (this.btnImportStudentModal) this.btnImportStudentModal.style.display = "inline-flex";
            document.getElementById("nav-scoring").style.display = "inline-flex";
            document.getElementById("nav-assignments").style.display = "inline-flex";
        }
        else if (this.currentRole === "CO_DO") {
            // Đóng vai cờ đỏ Trần Đức Minh lớp 11A
            this.currentUser = users.find(u => u.VaiTro === "CO_DO" && u.HoTen === "Trịnh Đức Minh");
            this.userDisplayName.textContent = this.currentUser.HoTen;
            this.userDisplayRole.textContent = "Học Sinh Cờ Đỏ (11A)";

            // Ẩn các nút quản trị, ẩn tab phân công
            if (this.btnAddAssignment) this.btnAddAssignment.style.display = "none";
            if (this.btnAddCriterion) this.btnAddCriterion.style.display = "none";
            if (this.btnAddStudent) this.btnAddStudent.style.display = "none";
            if (this.btnDownloadTemplateStudent) this.btnDownloadTemplateStudent.style.display = "none";
            if (this.btnImportStudentModal) this.btnImportStudentModal.style.display = "none";
            document.getElementById("nav-scoring").style.display = "inline-flex";
            document.getElementById("nav-assignments").style.display = "none";
        }
        else if (this.currentRole === "GIAO_VIEN") {
            // Giáo viên chủ nhiệm lớp 11A
            this.currentUser = users.find(u => u.VaiTro === "GIAO_VIEN" && u.MaLop === 5);
            this.userDisplayName.textContent = this.currentUser.HoTen;
            this.userDisplayRole.textContent = "GVCN lớp 11A";

            if (this.btnAddAssignment) this.btnAddAssignment.style.display = "none";
            if (this.btnAddCriterion) this.btnAddCriterion.style.display = "none";
            if (this.btnAddStudent) this.btnAddStudent.style.display = "none";
            if (this.btnDownloadTemplateStudent) this.btnDownloadTemplateStudent.style.display = "none";
            if (this.btnImportStudentModal) this.btnImportStudentModal.style.display = "none";
            document.getElementById("nav-scoring").style.display = "none";
            document.getElementById("nav-assignments").style.display = "none";
        }
        else if (this.currentRole === "HOC_SINH") {
            // Học sinh lớp 11A
            this.currentUser = users.find(u => u.VaiTro === "HOC_SINH" && u.MaLop === 5);
            this.userDisplayName.textContent = "Học sinh 11A";
            this.userDisplayRole.textContent = "Thành viên lớp 11A";

            if (this.btnAddAssignment) this.btnAddAssignment.style.display = "none";
            if (this.btnAddCriterion) this.btnAddCriterion.style.display = "none";
            if (this.btnAddStudent) this.btnAddStudent.style.display = "none";
            if (this.btnDownloadTemplateStudent) this.btnDownloadTemplateStudent.style.display = "none";
            if (this.btnImportStudentModal) this.btnImportStudentModal.style.display = "none";
            document.getElementById("nav-scoring").style.display = "none";
            document.getElementById("nav-assignments").style.display = "none";
        }
    }

    renderAll() {
        this.renderTab(this.activeTab);
    }

    renderTab(tabName) {
        switch (tabName) {
            case "dashboard":
                this.renderDashboardTab();
                break;
            case "scoring":
                this.renderScoringTab();
                break;
            case "violation-summary":
                this.renderViolationSummaryTab();
                break;
            case "assignments":
                this.renderAssignmentsTab();
                break;
            case "regulations":
                this.renderRegulationsTab();
                break;
            case "students":
                this.renderStudentsTab();
                break;
        }
    }

    // ============================================================================
    // 4. RENDER TAB 1: BẢNG XẾP HẠNG & PODIUM
    // ============================================================================
    renderDashboardTab() {
        const summaries = JSON.parse(localStorage.getItem("TDHD_TongKetThiDuaTuan") || "[]");
        const classes = JSON.parse(localStorage.getItem("TDHD_DanhMucLop") || "[]");

        // Lọc tổng hợp tuần hiện tại
        const weekSummaries = summaries.filter(s => s.MaTuan === this.currentWeekId);

        // Map tên lớp vào bản ghi
        const rankData = weekSummaries.map(s => {
            const lop = classes.find(c => c.MaLop === s.MaLop);
            return {
                ...s,
                TenLop: lop ? lop.TenLop : "Không rõ",
                Khoi: lop ? lop.Khoi : 10
            };
        });

        // Sắp xếp theo thứ hạng
        rankData.sort((a, b) => a.XepHang - b.XepHang);

        // 1. Render Podium (Top 3)
        const podium1 = rankData[0];
        const podium2 = rankData[1];
        const podium3 = rankData[2];

        const p1Card = document.getElementById("podium-1");
        const p2Card = document.getElementById("podium-2");
        const p3Card = document.getElementById("podium-3");

        if (podium1) {
            p1Card.querySelector(".class-name").textContent = podium1.TenLop;
            p1Card.querySelector(".score-value").textContent = podium1.DiemTongKet.toFixed(1);
            p1Card.querySelector(".stats").textContent = `Cộng: +${podium1.TongDiemCong.toFixed(1)} | Trừ: -${podium1.TongDiemTru.toFixed(1)}`;
            p1Card.style.opacity = "1";
        } else {
            p1Card.style.opacity = "0.3";
        }

        if (podium2) {
            p2Card.querySelector(".class-name").textContent = podium2.TenLop;
            p2Card.querySelector(".score-value").textContent = podium2.DiemTongKet.toFixed(1);
            p2Card.querySelector(".stats").textContent = `Cộng: +${podium2.TongDiemCong.toFixed(1)} | Trừ: -${podium2.TongDiemTru.toFixed(1)}`;
            p2Card.style.opacity = "1";
        } else {
            p2Card.style.opacity = "0.3";
        }

        if (podium3) {
            p3Card.querySelector(".class-name").textContent = podium3.TenLop;
            p3Card.querySelector(".score-value").textContent = podium3.DiemTongKet.toFixed(1);
            p3Card.querySelector(".stats").textContent = `Cộng: +${podium3.TongDiemCong.toFixed(1)} | Trừ: -${podium3.TongDiemTru.toFixed(1)}`;
            p3Card.style.opacity = "1";
        } else {
            p3Card.style.opacity = "0.3";
        }

        // 1B. Render Bottom Podium (Bottom 3)
        const bp1Card = document.getElementById("bottom-podium-1");
        const bp2Card = document.getElementById("bottom-podium-2");
        const bp3Card = document.getElementById("bottom-podium-3");

        const bottom1 = rankData[rankData.length - 1]; // Hạng chót (13)
        const bottom2 = rankData[rankData.length - 2]; // Hạng kế chót (12)
        const bottom3 = rankData[rankData.length - 3]; // Hạng ba từ dưới lên (11)

        if (bottom1) {
            bp1Card.querySelector(".class-name").textContent = bottom1.TenLop;
            bp1Card.querySelector(".score-value").textContent = bottom1.DiemTongKet.toFixed(1);
            bp1Card.querySelector(".stats").textContent = `Cộng: +${bottom1.TongDiemCong.toFixed(1)} | Trừ: -${bottom1.TongDiemTru.toFixed(1)}`;
            bp1Card.querySelector(".podium-rank").textContent = bottom1.XepHang;
            bp1Card.style.opacity = "1";
        } else {
            bp1Card.style.opacity = "0.3";
        }

        if (bottom2) {
            bp2Card.querySelector(".class-name").textContent = bottom2.TenLop;
            bp2Card.querySelector(".score-value").textContent = bottom2.DiemTongKet.toFixed(1);
            bp2Card.querySelector(".stats").textContent = `Cộng: +${bottom2.TongDiemCong.toFixed(1)} | Trừ: -${bottom2.TongDiemTru.toFixed(1)}`;
            bp2Card.querySelector(".podium-rank").textContent = bottom2.XepHang;
            bp2Card.style.opacity = "1";
        } else {
            bp2Card.style.opacity = "0.3";
        }

        if (bottom3) {
            bp3Card.querySelector(".class-name").textContent = bottom3.TenLop;
            bp3Card.querySelector(".score-value").textContent = bottom3.DiemTongKet.toFixed(1);
            bp3Card.querySelector(".stats").textContent = `Cộng: +${bottom3.TongDiemCong.toFixed(1)} | Trừ: -${bottom3.TongDiemTru.toFixed(1)}`;
            bp3Card.querySelector(".podium-rank").textContent = bottom3.XepHang;
            bp3Card.style.opacity = "1";
        } else {
            bp3Card.style.opacity = "0.3";
        }

        // 2. Render Full Rankings Table Body
        const tbody = document.getElementById("rankings-tbody");
        tbody.innerHTML = "";

        rankData.forEach(row => {
            const tr = document.createElement("tr");

            // Style nổi bật cho Top 3
            if (row.XepHang === 1) tr.classList.add("gold-row");
            else if (row.XepHang === 2) tr.classList.add("silver-row");
            else if (row.XepHang === 3) tr.classList.add("bronze-row");

            tr.innerHTML = `
                <td>
                    <span class="rank-badge rank-${row.XepHang}">${row.XepHang}</span>
                </td>
                <td><strong>${row.TenLop}</strong></td>
                <td>Khối ${row.Khoi}</td>
                <td>${row.DiemGoc}</td>
                <td class="score-plus">+${row.TongDiemCong}</td>
                <td class="score-minus">-${row.TongDiemTru}</td>
                <td><strong>${row.DiemTongKet.toFixed(1)}</strong></td>
                <td>
                    <button class="btn btn-icon btn-sm btn-view-class" data-class="${row.MaLop}">
                        <span class="material-symbols-rounded">visibility</span>
                    </button>
                </td>
            `;

            // Bấm xem chi tiết lớp học sẽ tự động dẫn sang Tab Hồ Sơ Học Sinh
            tr.querySelector(".btn-view-class").addEventListener("click", () => {
                this.currentSelectedClassId = row.MaLop;
                document.querySelector('[data-tab="students"]').click();
            });

            tbody.appendChild(tr);
        });

        // 3. Phân tích lỗi vi phạm phổ biến & hoạt động tích cực bên Sidebar
        this.renderStatsSidebar();

        // 4. Render Bảng Tổng Hợp Điểm Trừ Lớp Học toàn trường
        this.renderDashboardSummaryMatrix();

        // 5. Render Bảng Tổng Hợp Điểm Cộng Lớp Học toàn trường
        this.renderDashboardAchievementSummaryMatrix();
    }

    renderDashboardSummaryMatrix() {
        const classes = JSON.parse(localStorage.getItem("TDHD_DanhMucLop") || "[]");
        const criteria = JSON.parse(localStorage.getItem("TDHD_QuyDinhThiDua") || "[]").filter(c => c.Loai === "TRU" && c.is_active !== false);
        const nhatKyViPhams = JSON.parse(localStorage.getItem("TDHD_NhatKyViPhamHangNgay") || "[]").filter(nk => nk.MaTuan === this.currentWeekId);

        // 1. Render Columns (Lớp học)
        this.dashboardSummaryTheadTr.innerHTML = "";

        const thCriteria = document.createElement("th");
        thCriteria.style.minWidth = "250px";
        thCriteria.style.textAlign = "left";
        thCriteria.textContent = "Tiêu Chí Vi Phạm Quy Chế";
        this.dashboardSummaryTheadTr.appendChild(thCriteria);

        classes.forEach(lop => {
            const th = document.createElement("th");
            th.style.textAlign = "center";
            th.textContent = lop.TenLop;
            this.dashboardSummaryTheadTr.appendChild(th);
        });

        const thTotal = document.createElement("th");
        thTotal.style.background = "oklch(100% 0 0 / 2%)";
        thTotal.style.color = "var(--text-primary)";
        thTotal.style.fontWeight = "700";
        thTotal.style.textAlign = "center";
        thTotal.style.width = "110px";
        thTotal.textContent = "Tổng Lượt Lỗi";
        this.dashboardSummaryTheadTr.appendChild(thTotal);

        // 2. Render Rows (Tiêu chí vi phạm)
        this.dashboardSummaryTbody.innerHTML = "";
        const colTotals = new Array(classes.length).fill(0); // Lưu tổng số điểm trừ của từng lớp
        let grandTotalPoints = 0;

        criteria.forEach(tc => {
            const tr = document.createElement("tr");

            // Cột 1: Tên tiêu chí
            const tdCriteria = document.createElement("td");
            tdCriteria.innerHTML = `<span style="color:var(--text-muted);font-family:monospace;font-size:0.75rem;margin-right:6px;">${tc.MaTieuChi.toString().padStart(3, '0')}</span><strong>${tc.NoiDung}</strong> <span class="badge badge-danger" style="margin-left:6px;font-size:0.65rem;">-${tc.DiemChuyenDoi}đ/${tc.DonViTinh.split('/').pop()}</span>`;
            tr.appendChild(tdCriteria);

            let rowTotalQty = 0;

            // Các cột lớp học
            classes.forEach((lop, classIdx) => {
                const logs = nhatKyViPhams.filter(nk => nk.MaLop === lop.MaLop && nk.MaTieuChi === tc.MaTieuChi);
                const classQty = logs.reduce((sum, item) => sum + item.SoLuong, 0);

                rowTotalQty += classQty;
                colTotals[classIdx] += classQty * tc.DiemChuyenDoi; // Cộng dồn số điểm trừ của lớp

                const td = document.createElement("td");
                td.style.textAlign = "center";

                if (classQty > 0) {
                    td.innerHTML = `<span style="font-weight:700; color:var(--text-primary);">${classQty}</span>`;
                } else {
                    td.innerHTML = `<span style="color:var(--text-muted); opacity:0.15;">-</span>`;
                }
                tr.appendChild(td);
            });

            // Cột cuối: Tổng số lượt vi phạm của tiêu chí này (Tổng số lượng)
            const tdRowQty = document.createElement("td");
            tdRowQty.style.textAlign = "center";
            tdRowQty.style.fontWeight = "700";
            tdRowQty.style.color = "var(--text-primary)";
            tdRowQty.style.background = "oklch(100% 0 0 / 1.5%)";

            if (rowTotalQty > 0) {
                tdRowQty.textContent = rowTotalQty;
            } else {
                tdRowQty.innerHTML = `<span style="color:var(--text-muted); opacity:0.35;">-</span>`;
            }
            tr.appendChild(tdRowQty);

            this.dashboardSummaryTbody.appendChild(tr);
        });

        // 3. Render Bottom Row (Tổng số điểm trừ của từng lớp)
        const trFooter = document.createElement("tr");
        trFooter.style.borderTop = "2px solid var(--border-card)";
        trFooter.style.background = "oklch(60% 0.19 25 / 1.5%)";

        const tdFooterLabel = document.createElement("td");
        tdFooterLabel.innerHTML = `<strong>Tổng Điểm Bị Trừ</strong>`;
        tdFooterLabel.style.color = "var(--danger-color)";
        trFooter.appendChild(tdFooterLabel);

        classes.forEach((lop, classIdx) => {
            const td = document.createElement("td");
            td.style.textAlign = "center";
            td.style.fontWeight = "800";
            td.style.color = "var(--danger-color)";

            const points = colTotals[classIdx];
            grandTotalPoints += points;

            if (points > 0) {
                td.textContent = `-${points.toFixed(1)}đ`;
            } else {
                td.innerHTML = `<span style="color:var(--text-muted); opacity:0.35;">0đ</span>`;
            }
            trFooter.appendChild(td);
        });

        const tdGrandPoints = document.createElement("td");
        tdGrandPoints.style.textAlign = "center";
        tdGrandPoints.style.fontWeight = "800";
        tdGrandPoints.style.color = "var(--danger-color)";
        tdGrandPoints.style.background = "oklch(60% 0.19 25 / 8%)";

        if (grandTotalPoints > 0) {
            tdGrandPoints.textContent = `-${grandTotalPoints.toFixed(1)}đ`;
        } else {
            tdGrandPoints.textContent = "0đ";
        }
        trFooter.appendChild(tdGrandPoints);

        this.dashboardSummaryTbody.appendChild(trFooter);
    }

    renderDashboardAchievementSummaryMatrix() {
        const classes = JSON.parse(localStorage.getItem("TDHD_DanhMucLop") || "[]");
        const criteria = JSON.parse(localStorage.getItem("TDHD_QuyDinhThiDua") || "[]").filter(c => c.Loai === "CONG" && c.is_active !== false);
        const nhatKyThanhTichs = JSON.parse(localStorage.getItem("TDHD_ThanhTichHocTapTheoTuan") || "[]").filter(nk => nk.MaTuan === this.currentWeekId);

        if (!this.dashboardAchievementSummaryTheadTr || !this.dashboardAchievementSummaryTbody) return;

        // 1. Render Columns (Tiêu chí điểm cộng)
        this.dashboardAchievementSummaryTheadTr.innerHTML = "";

        const thClass = document.createElement("th");
        thClass.style.minWidth = "150px";
        thClass.style.textAlign = "left";
        thClass.textContent = "Lớp Học";
        this.dashboardAchievementSummaryTheadTr.appendChild(thClass);

        criteria.forEach(tc => {
            const th = document.createElement("th");
            th.style.textAlign = "center";
            th.innerHTML = `<strong>${tc.NoiDung}</strong><br><span class="text-green" style="font-size:0.7rem;font-weight:normal;">+${tc.DiemChuyenDoi}đ/${tc.DonViTinh.split('/').pop()}</span>`;
            this.dashboardAchievementSummaryTheadTr.appendChild(th);
        });

        const thTotalQty = document.createElement("th");
        thTotalQty.style.background = "oklch(100% 0 0 / 2%)";
        thTotalQty.style.color = "var(--text-primary)";
        thTotalQty.style.fontWeight = "700";
        thTotalQty.style.textAlign = "center";
        thTotalQty.style.width = "120px";
        thTotalQty.textContent = "Tổng Lượt Cộng";
        this.dashboardAchievementSummaryTheadTr.appendChild(thTotalQty);

        // 2. Render Rows (Lớp học)
        this.dashboardAchievementSummaryTbody.innerHTML = "";
        const colTotals = new Array(criteria.length).fill(0); // Lưu tổng điểm cộng của từng tiêu chí
        let grandTotalPoints = 0;

        classes.forEach(lop => {
            const tr = document.createElement("tr");

            // Cột 1: Tên lớp học
            const tdClass = document.createElement("td");
            tdClass.innerHTML = `<strong>Lớp ${lop.TenLop}</strong>`;
            tr.appendChild(tdClass);

            let rowTotalQty = 0;

            // Các cột tiêu chí thưởng
            criteria.forEach((tc, criteriaIdx) => {
                const logs = nhatKyThanhTichs.filter(nk => nk.MaLop === lop.MaLop && nk.MaTieuChi === tc.MaTieuChi);
                const classQty = logs.reduce((sum, item) => sum + item.SoLuong, 0);

                rowTotalQty += classQty;
                colTotals[criteriaIdx] += classQty * tc.DiemChuyenDoi; // Cộng dồn số điểm cộng của tiêu chí

                const td = document.createElement("td");
                td.style.textAlign = "center";

                if (classQty > 0) {
                    td.innerHTML = `<span style="font-weight:700; color:var(--success-color);">${classQty}</span>`;
                } else {
                    td.innerHTML = `<span style="color:var(--text-muted); opacity:0.15;">-</span>`;
                }
                tr.appendChild(td);
            });

            // Cột cuối: Tổng số lượt cộng của lớp này (Tổng số lượng)
            const tdRowTotal = document.createElement("td");
            tdRowTotal.style.textAlign = "center";
            tdRowTotal.style.fontWeight = "700";
            tdRowTotal.style.color = "var(--text-primary)";
            tdRowTotal.style.background = "oklch(100% 0 0 / 1.5%)";

            if (rowTotalQty > 0) {
                tdRowTotal.textContent = rowTotalQty;
            } else {
                tdRowTotal.innerHTML = `<span style="color:var(--text-muted); opacity:0.35;">-</span>`;
            }
            tr.appendChild(tdRowTotal);

            this.dashboardAchievementSummaryTbody.appendChild(tr);
        });

        // 3. Render Bottom Row (Tổng số điểm cộng của từng tiêu chí)
        const trFooter = document.createElement("tr");
        trFooter.style.borderTop = "2px solid var(--border-card)";
        trFooter.style.background = "oklch(65% 0.17 140 / 1.5%)";

        const tdFooterLabel = document.createElement("td");
        tdFooterLabel.innerHTML = `<strong>Tổng Điểm Cộng</strong>`;
        tdFooterLabel.style.color = "var(--success-color)";
        trFooter.appendChild(tdFooterLabel);

        criteria.forEach((tc, criteriaIdx) => {
            const td = document.createElement("td");
            td.style.textAlign = "center";
            td.style.fontWeight = "800";
            td.style.color = "var(--success-color)";

            const points = colTotals[criteriaIdx];
            grandTotalPoints += points;

            if (points > 0) {
                td.textContent = `+${points.toFixed(1)}đ`;
            } else {
                td.innerHTML = `<span style="color:var(--text-muted); opacity:0.35;">0đ</span>`;
            }
            trFooter.appendChild(td);
        });

        const tdGrandPoints = document.createElement("td");
        tdGrandPoints.style.textAlign = "center";
        tdGrandPoints.style.fontWeight = "800";
        tdGrandPoints.style.color = "var(--success-color)";
        tdGrandPoints.style.background = "oklch(65% 0.17 140 / 8%)";

        if (grandTotalPoints > 0) {
            tdGrandPoints.textContent = `+${grandTotalPoints.toFixed(1)}đ`;
        } else {
            tdGrandPoints.textContent = "0đ";
        }
        trFooter.appendChild(tdGrandPoints);

        this.dashboardAchievementSummaryTbody.appendChild(trFooter);
    }

    renderStatsSidebar() {
        const viPhams = JSON.parse(localStorage.getItem("TDHD_ChiTietViPhamHocSinh") || "[]");
        const thanhTichs = JSON.parse(localStorage.getItem("TDHD_ChiTietThanhTichHocSinh") || "[]");
        const criteria = JSON.parse(localStorage.getItem("TDHD_QuyDinhThiDua") || "[]");

        // Lọc theo tuần hiện tại
        const weekVps = viPhams.filter(v => v.MaTuan === this.currentWeekId);
        const weekTts = thanhTichs.filter(t => t.MaTuan === this.currentWeekId);

        // 1. Thống kê lỗi vi phạm phổ biến
        const vpCount = {};
        weekVps.forEach(v => {
            vpCount[v.MaTieuChi] = (vpCount[v.MaTieuChi] || 0) + 1;
        });

        const sortedVp = Object.keys(vpCount)
            .map(id => {
                const tc = criteria.find(c => c.MaTieuChi === parseInt(id));
                return {
                    id: parseInt(id),
                    name: tc ? tc.NoiDung : "Lỗi khác",
                    count: vpCount[id],
                    score: tc ? tc.DiemChuyenDoi * vpCount[id] : 0
                };
            })
            .sort((a, b) => {
                if (b.count !== a.count) {
                    return b.count - a.count;
                }
                return b.score - a.score;
            })
            .slice(0, 5); // Lấy tối đa 5 lỗi nhiều nhất

        const vpList = document.getElementById("penalties-breakdown-list");
        vpList.innerHTML = "";
        if (sortedVp.length === 0) {
            vpList.innerHTML = '<div class="no-data">Không có lỗi vi phạm phát sinh.</div>';
        } else {
            sortedVp.forEach(item => {
                const div = document.createElement("div");
                div.className = "stats-item interactive-stats-item";
                div.innerHTML = `
                    <div class="stats-icon error"><span class="material-symbols-rounded">error</span></div>
                    <div class="stats-info">
                        <h4>${item.name}</h4>
                        <p>${item.count} lượt vi phạm <span style="font-size: 0.75rem; color: var(--primary-light); opacity: 0.8; text-decoration: underline; margin-left: 6px;">Xem chi tiết</span></p>
                    </div>
                    <div class="stats-value text-red">-${item.score} đ</div>
                `;
                div.addEventListener("click", () => {
                    this.showViolationDetailModal(item.id, item.name);
                });
                vpList.appendChild(div);
            });
        }

        // 2. Thống kê thành tích nổi bật
        const ttCount = {};
        weekTts.forEach(t => {
            ttCount[t.MaTieuChi] = (ttCount[t.MaTieuChi] || 0) + 1;
        });

        const sortedTt = Object.keys(ttCount)
            .map(id => {
                const tc = criteria.find(c => c.MaTieuChi === parseInt(id));
                return {
                    name: tc ? tc.NoiDung : "Thành tích",
                    count: ttCount[id],
                    score: tc ? tc.DiemChuyenDoi * ttCount[id] : 0
                };
            })
            .sort((a, b) => {
                if (b.count !== a.count) {
                    return b.count - a.count;
                }
                return b.score - a.score;
            })
            .slice(0, 5); // Lấy tối đa 5 thành tích nhiều nhất

        const ttList = document.getElementById("achievements-breakdown-list");
        ttList.innerHTML = "";
        if (sortedTt.length === 0) {
            ttList.innerHTML = '<div class="no-data">Chưa ghi nhận thành tích nào.</div>';
        } else {
            sortedTt.forEach(item => {
                const div = document.createElement("div");
                div.className = "stats-item";
                div.innerHTML = `
                    <div class="stats-icon success"><span class="material-symbols-rounded">stars</span></div>
                    <div class="stats-info">
                        <h4>${item.name}</h4>
                        <p>${item.count} lượt ghi nhận</p>
                    </div>
                    <div class="stats-value text-green">+${item.score} đ</div>
                `;
                ttList.appendChild(div);
            });
        }
    }

    showViolationDetailModal(criterionId, criterionName) {
        // 1. Lọc chi tiết vi phạm của tuần hiện tại và tiêu chí được chọn
        const viPhams = JSON.parse(localStorage.getItem("TDHD_ChiTietViPhamHocSinh") || "[]");
        const students = JSON.parse(localStorage.getItem("TDHD_DanhSachHocSinh") || "[]");
        const classes = JSON.parse(localStorage.getItem("TDHD_DanhMucLop") || "[]");

        const targetVps = viPhams.filter(v => v.MaTuan === this.currentWeekId && v.MaTieuChi === criterionId && v.MaHocSinh !== null);

        // 2. Gom nhóm theo học sinh
        const studentVpMap = {};
        targetVps.forEach(v => {
            studentVpMap[v.MaHocSinh] = (studentVpMap[v.MaHocSinh] || 0) + 1;
        });

        // 3. Map sang thông tin học sinh, lớp và sắp xếp từ cao xuống thấp
        const detailList = Object.keys(studentVpMap).map(hsId => {
            const studentId = parseInt(hsId);
            const student = students.find(s => s.MaHocSinh === studentId);
            const lop = student ? classes.find(c => c.MaLop === student.MaLop) : null;
            return {
                hoTen: student ? student.HoTen : "Không rõ",
                tenLop: lop ? lop.TenLop : "Không rõ",
                soLuong: studentVpMap[hsId]
            };
        }).sort((a, b) => b.soLuong - a.soLuong);

        // 4. Cập nhật tiêu đề & nội dung hộp thoại
        this.violationDetailTitle.innerHTML = `Chi Tiết Vi Phạm: <span class="text-red" style="font-weight:700;">${criterionName}</span> (Tuần ${this.currentWeekId})`;
        this.violationDetailTbody.innerHTML = "";

        if (detailList.length === 0) {
            this.violationDetailTbody.innerHTML = `
                <tr>
                    <td colspan="3" class="no-data" style="text-align: center; color: var(--text-muted); padding: 2rem 0;">
                        Chưa ghi nhận lượt vi phạm cá nhân nào trong tuần này.
                    </td>
                </tr>
            `;
        } else {
            detailList.forEach(item => {
                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td><strong>${item.hoTen}</strong></td>
                    <td><span class="badge badge-warning" style="font-size:0.75rem;">Lớp ${item.tenLop}</span></td>
                    <td style="text-align: center; font-weight: 700; color: var(--danger-color); font-size: 0.95rem;">${item.soLuong} lượt</td>
                `;
                this.violationDetailTbody.appendChild(tr);
            });
        }

        // 5. Hiển thị dialog
        this.violationDetailDialog.showModal();
    }

    // ============================================================================
    // 5. RENDER TAB 2: GHI SỔ TRỰC (CỜ ĐỎ HÀNG NGÀY)
    // ============================================================================
    renderScoringTab() {
        const assignments = JSON.parse(localStorage.getItem("TDHD_PhanCongCoDo") || "[]");
        const classes = JSON.parse(localStorage.getItem("TDHD_DanhMucLop") || "[]");

        // Cập nhật tuần trên bộ chọn phụ của ghi sổ trực bằng tuần chính của header
        this.scoringSelectWeek.value = this.currentWeekId;

        // Reset dropdown
        this.scoringSelectLop.innerHTML = '<option value="" disabled selected>-- Chọn lớp cần ghi sổ --</option>';

        if (this.currentRole === "CO_DO") {
            // Tìm cờ đỏ phân công chấm tuần này
            const myAssigns = assignments.filter(a => a.MaNguoiDung === this.currentUser.MaNguoiDung && a.MaTuan === this.currentWeekId);

            if (myAssigns.length > 0) {
                myAssigns.forEach(a => {
                    const lop = classes.find(c => c.MaLop === a.MaLop);
                    if (lop) {
                        const opt = document.createElement("option");
                        opt.value = lop.MaLop;
                        opt.textContent = lop.TenLop;
                        this.scoringSelectLop.appendChild(opt);
                    }
                });

                const assignedNames = myAssigns.map(a => {
                    const l = classes.find(c => c.MaLop === a.MaLop);
                    return l ? l.TenLop : "";
                }).join(", ");
                this.scoringAssignmentHelper.innerHTML = `<span class="badge badge-success" style="font-size:0.85rem;"><span class="material-symbols-rounded" style="font-size:1rem;vertical-align:middle;margin-right:4px;">gpp_good</span>Lịch trực tuần này: Chấm lớp <strong>${assignedNames}</strong></span>`;
            } else {
                this.scoringAssignmentHelper.innerHTML = '<span class="badge badge-danger" style="font-size:0.85rem;"><span class="material-symbols-rounded" style="font-size:1rem;vertical-align:middle;margin-right:4px;">warning</span>Cảnh báo: Bạn chưa được phân công trực trong Tuần này!</span>';
            }
        }
        else if (this.currentRole === "ADMIN") {
            // Admin có quyền chấm điểm cho tất cả các lớp
            classes.forEach(lop => {
                const opt = document.createElement("option");
                opt.value = lop.MaLop;
                opt.textContent = lop.TenLop;
                this.scoringSelectLop.appendChild(opt);
            });
            this.scoringAssignmentHelper.innerHTML = '<span class="badge badge-warning" style="font-size:0.85rem;"><span class="material-symbols-rounded" style="font-size:1rem;vertical-align:middle;margin-right:4px;">shield_person</span>Quyền ADMIN: Được phép ghi nhận cho mọi lớp học</span>';
        }

        // Ẩn bảng ma trận cho đến khi người dùng chọn một lớp cụ thể
        this.scoringMatrixContainer.style.display = "none";

        // Render Nhật ký ghi nhận gần đây
        this.renderRecentLogs();
    }

    loadMatrixData() {
        const lopId = parseInt(this.scoringSelectLop.value);
        const weekId = parseInt(this.scoringSelectWeek.value);

        if (!lopId || !weekId) {
            this.scoringMatrixContainer.style.display = "none";
            return;
        }

        this.scoringMatrixContainer.style.display = "block";
        this.matrixState = {};

        const viPhams = JSON.parse(localStorage.getItem("TDHD_ChiTietViPhamHocSinh") || "[]");
        const thanhTichs = JSON.parse(localStorage.getItem("TDHD_ChiTietThanhTichHocSinh") || "[]");

        // Tải lỗi vi phạm
        viPhams.filter(v => v.MaLop === lopId && v.MaTuan === weekId).forEach(v => {
            const key = `${v.MaTieuChi}_${v.ThuTrongTuan}`;
            if (v.MaHocSinh === null) {
                this.matrixState[key] = true;
            } else {
                if (!Array.isArray(this.matrixState[key])) {
                    this.matrixState[key] = [];
                }
                if (!this.matrixState[key].includes(v.MaHocSinh)) {
                    this.matrixState[key].push(v.MaHocSinh);
                }
            }
        });

        // Tải thành tích
        thanhTichs.filter(t => t.MaLop === lopId && t.MaTuan === weekId).forEach(t => {
            const key = `${t.MaTieuChi}_${t.ThuTrongTuan}`;
            if (t.MaHocSinh === null) {
                this.matrixState[key] = (this.matrixState[key] || 0) + 1;
            } else {
                if (!Array.isArray(this.matrixState[key])) {
                    this.matrixState[key] = [];
                }
                if (!this.matrixState[key].includes(t.MaHocSinh)) {
                    this.matrixState[key].push(t.MaHocSinh);
                }
            }
        });

        this.renderMatrix();
    }

    renderMatrix() {
        const lopId = parseInt(this.scoringSelectLop.value);
        const classes = JSON.parse(localStorage.getItem("TDHD_DanhMucLop") || "[]");
        const lop = classes.find(c => c.MaLop === lopId);
        const lopTen = lop ? lop.TenLop : "Lớp";

        const criteria = JSON.parse(localStorage.getItem("TDHD_QuyDinhThiDua") || "[]");
        const students = JSON.parse(localStorage.getItem("TDHD_DanhSachHocSinh") || "[]");
        const classStudents = students.filter(s => s.MaLop === lopId);

        const violationTbody = document.getElementById("violation-matrix-tbody");
        const achievementTbody = document.getElementById("achievement-matrix-tbody");

        violationTbody.innerHTML = "";
        achievementTbody.innerHTML = "";

        const activeCriteria = criteria.filter(c => c.is_active !== false);
        const activeViolations = activeCriteria.filter(c => c.Loai === "TRU");
        const activeAchievements = activeCriteria.filter(c => c.Loai === "CONG");

        // 1. Render Bảng Vi Phạm (Điểm trừ)
        activeViolations.forEach(tc => {
            const tr = document.createElement("tr");

            // Cột 1: Tiêu chí
            const tdCriteria = document.createElement("td");
            tdCriteria.innerHTML = `<span style="color:var(--text-muted);font-family:monospace;font-size:0.75rem;margin-right:6px;">${tc.MaTieuChi.toString().padStart(3, '0')}</span><strong>${tc.NoiDung}</strong> <span class="badge badge-danger" style="margin-left:6px;font-size:0.65rem;">-${tc.DiemChuyenDoi}đ${tc.DonViTinh}</span>`;
            tr.appendChild(tdCriteria);

            // Cột 2 đến 7: Thứ 2 -> Thứ 7
            for (let thu = 2; thu <= 7; thu++) {
                const key = `${tc.MaTieuChi}_${thu}`;
                const isClassInfraction = !tc.DonViTinh.includes("/HS");

                if (isClassInfraction) {
                    // Checkbox cho lớp
                    const checked = this.matrixState[key] === true;
                    let disabledStr = "";

                    // Ràng buộc số tiết học cho Giờ học Yếu (22) và Trung bình (23)
                    if (tc.MaTieuChi === 22 || tc.MaTieuChi === 23) {
                        const maxP = (thu === 2 || thu === 7) ? 4 : 5;
                        const totalPeriods = (this.matrixState[`103_${thu}`] || 0) +
                            (this.matrixState[`104_${thu}`] || 0) +
                            (this.matrixState[`22_${thu}`] ? 1 : 0) +
                            (this.matrixState[`23_${thu}`] ? 1 : 0);
                        if (totalPeriods >= maxP && !checked) {
                            disabledStr = "disabled";
                        }
                    }

                    const td = document.createElement("td");
                    td.style.textAlign = "center";
                    td.innerHTML = `
                        <label class="matrix-class-toggle ${disabledStr ? 'disabled-toggle' : ''}">
                            <input type="checkbox" id="chk_${key}" ${checked ? 'checked' : ''} ${disabledStr}>
                            <span>${lopTen}</span>
                        </label>
                    `;
                    td.querySelector("input").addEventListener("change", (e) => {
                        this.matrixState[key] = e.target.checked;

                        // Kích hoạt re-render để cập nhật trạng thái các nút/hộp kiểm khác và nhãn Đạt buổi học tốt
                        if (tc.MaTieuChi === 22 || tc.MaTieuChi === 23) {
                            const maxP = (thu === 2 || thu === 7) ? 4 : 5;
                            const countTot = this.matrixState[`103_${thu}`] || 0;
                            this.matrixState[`105_${thu}`] = (countTot >= maxP) ? 1 : 0;
                        }
                        this.renderMatrix();
                    });
                    tr.appendChild(td);
                } else {
                    // Multi-student selector cho học sinh
                    const td = document.createElement("td");
                    td.innerHTML = `
                        <div class="student-pill-container" id="container_${key}"></div>
                        <select class="codo-select-inline" id="select_${key}">
                            <option value="" disabled selected>+ HS</option>
                            ${classStudents.map(s => `<option value="${s.MaHocSinh}">${s.HoTen}</option>`).join('')}
                        </select>
                    `;

                    const renderPills = () => {
                        const container = td.querySelector(".student-pill-container");
                        container.innerHTML = "";
                        const currentIds = this.matrixState[key] || [];
                        currentIds.forEach(hsId => {
                            const student = classStudents.find(s => s.MaHocSinh === hsId);
                            if (student) {
                                const pill = document.createElement("span");
                                pill.className = "student-pill red";
                                pill.innerHTML = `
                                    ${student.HoTen.split(' ').slice(-1)[0]} 
                                    <span class="material-symbols-rounded pill-remove">close</span>
                                `;
                                pill.querySelector(".pill-remove").addEventListener("click", () => {
                                    this.matrixState[key] = this.matrixState[key].filter(id => id !== hsId);
                                    renderPills();
                                });
                                container.appendChild(pill);
                            }
                        });
                    };

                    renderPills();

                    td.querySelector("select").addEventListener("change", (e) => {
                        const hsId = parseInt(e.target.value);
                        if (!Array.isArray(this.matrixState[key])) {
                            this.matrixState[key] = [];
                        }
                        if (!this.matrixState[key].includes(hsId)) {
                            this.matrixState[key].push(hsId);
                        }
                        e.target.value = ""; // Reset dropdown selection
                        renderPills();
                    });

                    tr.appendChild(td);
                }
            }
            violationTbody.appendChild(tr);
        });

        // 2. Render Bảng Thành Tích (Điểm cộng)
        activeAchievements.forEach(tc => {
            const tr = document.createElement("tr");

            // Cột 1: Tiêu chí
            const tdCriteria = document.createElement("td");
            tdCriteria.innerHTML = `<span style="color:var(--text-muted);font-family:monospace;font-size:0.75rem;margin-right:6px;">${tc.MaTieuChi.toString().padStart(3, '0')}</span><strong>${tc.NoiDung}</strong> <span class="badge badge-success" style="margin-left:6px;font-size:0.65rem;">+${tc.DiemChuyenDoi}đ${tc.DonViTinh}</span>`;
            tr.appendChild(tdCriteria);

            // Cột 2 đến 7: Thứ 2 -> Thứ 7
            for (let thu = 2; thu <= 7; thu++) {
                const key = `${tc.MaTieuChi}_${thu}`;
                const isStudentAchievement = tc.MaTieuChi === 101 || tc.MaTieuChi === 102 || tc.DonViTinh.includes("/HS");

                if (isStudentAchievement) {
                    // Multi-student selector cho học sinh
                    const td = document.createElement("td");
                    td.innerHTML = `
                        <div class="student-pill-container" id="container_${key}"></div>
                        <select class="codo-select-inline" id="select_${key}">
                            <option value="" disabled selected>+ HS</option>
                            ${classStudents.map(s => `<option value="${s.MaHocSinh}">${s.HoTen}</option>`).join('')}
                        </select>
                    `;

                    const renderPills = () => {
                        const container = td.querySelector(".student-pill-container");
                        container.innerHTML = "";
                        const currentIds = this.matrixState[key] || [];
                        currentIds.forEach(hsId => {
                            const student = classStudents.find(s => s.MaHocSinh === hsId);
                            if (student) {
                                const pill = document.createElement("span");
                                pill.className = "student-pill green";
                                pill.innerHTML = `
                                    ${student.HoTen.split(' ').slice(-1)[0]} 
                                    <span class="material-symbols-rounded pill-remove">close</span>
                                `;
                                pill.querySelector(".pill-remove").addEventListener("click", () => {
                                    this.matrixState[key] = this.matrixState[key].filter(id => id !== hsId);
                                    renderPills();
                                });
                                container.appendChild(pill);
                            }
                        });
                    };

                    renderPills();

                    td.querySelector("select").addEventListener("change", (e) => {
                        const hsId = parseInt(e.target.value);
                        if (!Array.isArray(this.matrixState[key])) {
                            this.matrixState[key] = [];
                        }
                        if (!this.matrixState[key].includes(hsId)) {
                            this.matrixState[key].push(hsId);
                        }
                        e.target.value = ""; // Reset dropdown selection
                        renderPills();
                    });

                    tr.appendChild(td);
                } else if (tc.MaTieuChi === 105) {
                    // Tự động tính "Buổi học tốt"
                    const maxP = (thu === 2 || thu === 7) ? 4 : 5;
                    const countTot = this.matrixState[`103_${thu}`] || 0;
                    const isGoodDay = (countTot >= maxP);

                    this.matrixState[key] = isGoodDay ? 1 : 0; // Lưu lại trạng thái 105 trong memory

                    const td = document.createElement("td");
                    td.style.textAlign = "center";
                    if (isGoodDay) {
                        td.innerHTML = `
                            <span class="badge badge-success" style="font-size:0.8rem; padding:4px 8px; display:inline-flex; align-items:center; gap:4px; border-radius:12px; font-weight:600; background:oklch(65% 0.17 140 / 15%); color:var(--success-color);">
                                <span class="material-symbols-rounded" style="font-size:1.1rem; vertical-align:middle;">check_circle</span> Đạt
                            </span>
                        `;
                    } else {
                        td.innerHTML = `
                            <span style="color:var(--text-muted); opacity:0.35; font-size:0.9rem;">-</span>
                        `;
                    }
                    tr.appendChild(td);
                } else {
                    // Number counter cho tập thể (Giờ tốt 103, giờ khá 104)
                    const value = this.matrixState[key] || 0;
                    const maxP = (thu === 2 || thu === 7) ? 4 : 5;
                    const totalPeriods = (this.matrixState[`103_${thu}`] || 0) +
                        (this.matrixState[`104_${thu}`] || 0) +
                        (this.matrixState[`22_${thu}`] ? 1 : 0) +
                        (this.matrixState[`23_${thu}`] ? 1 : 0);

                    const isIncDisabled = (totalPeriods >= maxP);

                    const td = document.createElement("td");
                    td.style.textAlign = "center";
                    td.innerHTML = `
                        <div class="number-counter">
                            <button type="button" class="btn-dec" ${value <= 0 ? 'disabled' : ''}>-</button>
                            <span class="counter-value">${value}</span>
                            <button type="button" class="btn-inc" ${isIncDisabled ? 'disabled' : ''}>+</button>
                        </div>
                    `;

                    const decBtn = td.querySelector(".btn-dec");
                    const incBtn = td.querySelector(".btn-inc");

                    decBtn.addEventListener("click", () => {
                        let val = this.matrixState[key] || 0;
                        if (val > 0) {
                            val--;
                            this.matrixState[key] = val;

                            // Cập nhật lại trạng thái Buổi học tốt
                            const countTot = this.matrixState[`103_${thu}`] || 0;
                            this.matrixState[`105_${thu}`] = (countTot >= maxP) ? 1 : 0;

                            this.renderMatrix();
                        }
                    });

                    incBtn.addEventListener("click", () => {
                        if (totalPeriods < maxP) {
                            let val = this.matrixState[key] || 0;
                            val++;
                            this.matrixState[key] = val;

                            // Cập nhật lại trạng thái Buổi học tốt
                            const countTot = this.matrixState[`103_${thu}`] || 0;
                            this.matrixState[`105_${thu}`] = (countTot >= maxP) ? 1 : 0;

                            this.renderMatrix();
                        }
                    });

                    tr.appendChild(td);
                }
            }
            achievementTbody.appendChild(tr);
        });
    }

    saveMatrixData() {
        const lopId = parseInt(this.scoringSelectLop.value);
        const weekId = parseInt(this.scoringSelectWeek.value);

        if (!lopId || !weekId) {
            alert("Vui lòng chọn đầy đủ Tuần và Lớp học trước khi lưu!");
            return;
        }

        const criteria = JSON.parse(localStorage.getItem("TDHD_QuyDinhThiDua") || "[]");
        let viPhams = JSON.parse(localStorage.getItem("TDHD_ChiTietViPhamHocSinh") || "[]");
        let thanhTichs = JSON.parse(localStorage.getItem("TDHD_ChiTietThanhTichHocSinh") || "[]");
        const students = JSON.parse(localStorage.getItem("TDHD_DanhSachHocSinh") || "[]");
        const classStudents = students.filter(s => s.MaLop === lopId);

        let nhatKys = JSON.parse(localStorage.getItem("TDHD_NhatKyChamDiem") || "[]");

        // 1. Xóa toàn bộ dữ liệu ghi nhận cũ của lớp và tuần này
        viPhams = viPhams.filter(v => !(v.MaLop === lopId && v.MaTuan === weekId));
        thanhTichs = thanhTichs.filter(t => !(t.MaLop === lopId && t.MaTuan === weekId));
        nhatKys = nhatKys.filter(l => !(l.MaLop === lopId && l.MaTuan === weekId));

        let nextVpId = viPhams.length > 0 ? Math.max(...viPhams.map(v => v.MaChiTiet)) + 1 : 1;
        let nextTtId = thanhTichs.length > 0 ? Math.max(...thanhTichs.map(t => t.MaChiTietThanhTich)) + 1 : 1;
        let nextNkId = nhatKys.length > 0 ? Math.max(...nhatKys.map(n => n.MaNhatKy)) + 1 : 1;

        // 2. Duyệt qua bộ nhớ tạm matrixState để tạo các bản ghi mới
        for (const [key, value] of Object.entries(this.matrixState)) {
            const parts = key.split('_');
            const tcId = parseInt(parts[0]);
            const thu = parseInt(parts[1]);

            const tc = criteria.find(c => c.MaTieuChi === tcId);
            if (!tc) continue;

            if (tc.Loai === "TRU") {
                const isClassInfraction = !tc.DonViTinh.includes("/HS");
                if (isClassInfraction) {
                    if (value === true) {
                        viPhams.push({
                            MaChiTiet: nextVpId++,
                            MaLop: lopId,
                            MaHocSinh: null,
                            MaTieuChi: tcId,
                            MaTuan: weekId,
                            ThuTrongTuan: thu,
                            MaNguoiDungGhiNhan: this.currentUser.MaNguoiDung,
                            GhiChuChiTiet: `Vi phạm tập thể: ${tc.NoiDung}`
                        });

                        nhatKys.push({
                            MaNhatKy: nextNkId++,
                            MaNguoiDung: this.currentUser.MaNguoiDung,
                            MaLop: lopId,
                            MaTuan: weekId,
                            LoaiGiaoDich: "TRU",
                            NoiDungTomTat: `${tc.NoiDung} · Đối tượng: Tập thể lớp`,
                            DiemThayDoi: -tc.DiemChuyenDoi,
                            ThuTrongTuan: thu,
                            ThoiGianThucHien: new Date().toISOString()
                        });
                    }
                } else {
                    if (Array.isArray(value) && value.length > 0) {
                        value.forEach(hsId => {
                            viPhams.push({
                                MaChiTiet: nextVpId++,
                                MaLop: lopId,
                                MaHocSinh: hsId,
                                MaTieuChi: tcId,
                                MaTuan: weekId,
                                ThuTrongTuan: thu,
                                MaNguoiDungGhiNhan: this.currentUser.MaNguoiDung,
                                GhiChuChiTiet: `Cá nhân vi phạm: ${tc.NoiDung}`
                            });

                            const hs = classStudents.find(s => s.MaHocSinh === hsId);
                            const targetName = hs ? hs.HoTen : `Học sinh #${hsId}`;
                            nhatKys.push({
                                MaNhatKy: nextNkId++,
                                MaNguoiDung: this.currentUser.MaNguoiDung,
                                MaLop: lopId,
                                MaTuan: weekId,
                                LoaiGiaoDich: "TRU",
                                NoiDungTomTat: `${tc.NoiDung} · Học sinh: ${targetName}`,
                                DiemThayDoi: -tc.DiemChuyenDoi,
                                ThuTrongTuan: thu,
                                ThoiGianThucHien: new Date().toISOString()
                            });
                        });
                    }
                }
            } else if (tc.Loai === "CONG") {
                const isStudentAchievement = tc.MaTieuChi === 101 || tc.MaTieuChi === 102 || tc.DonViTinh.includes("/HS");
                if (isStudentAchievement) {
                    if (Array.isArray(value) && value.length > 0) {
                        value.forEach(hsId => {
                            thanhTichs.push({
                                MaChiTietThanhTich: nextTtId++,
                                MaLop: lopId,
                                MaHocSinh: hsId,
                                MaTieuChi: tcId,
                                MaTuan: weekId,
                                ThuTrongTuan: thu,
                                MonHoc: "Học tập",
                                MaNguoiDungGhiNhan: this.currentUser.MaNguoiDung,
                                GhiChu: `Đạt thành tích: ${tc.NoiDung}`
                            });

                            const hs = classStudents.find(s => s.MaHocSinh === hsId);
                            const targetName = hs ? hs.HoTen : `Học sinh #${hsId}`;
                            nhatKys.push({
                                MaNhatKy: nextNkId++,
                                MaNguoiDung: this.currentUser.MaNguoiDung,
                                MaLop: lopId,
                                MaTuan: weekId,
                                LoaiGiaoDich: "CONG",
                                NoiDungTomTat: `${tc.NoiDung} · Học sinh: ${targetName}`,
                                DiemThayDoi: tc.DiemChuyenDoi,
                                ThuTrongTuan: thu,
                                ThoiGianThucHien: new Date().toISOString()
                            });
                        });
                    }
                } else {
                    if (typeof value === "number" && value > 0) {
                        for (let k = 0; k < value; k++) {
                            thanhTichs.push({
                                MaChiTietThanhTich: nextTtId++,
                                MaLop: lopId,
                                MaHocSinh: null,
                                MaTieuChi: tcId,
                                MaTuan: weekId,
                                ThuTrongTuan: thu,
                                MonHoc: "Bộ môn",
                                MaNguoiDungGhiNhan: this.currentUser.MaNguoiDung,
                                GhiChu: `Tập thể đạt: ${tc.NoiDung}`
                            });

                            nhatKys.push({
                                MaNhatKy: nextNkId++,
                                MaNguoiDung: this.currentUser.MaNguoiDung,
                                MaLop: lopId,
                                MaTuan: weekId,
                                LoaiGiaoDich: "CONG",
                                NoiDungTomTat: `${tc.NoiDung} · Đối tượng: Tập thể lớp`,
                                DiemThayDoi: tc.DiemChuyenDoi,
                                ThuTrongTuan: thu,
                                ThoiGianThucHien: new Date().toISOString()
                            });
                        }
                    }
                }
            }
        }

        // 3. Ghi lại dữ liệu giao dịch chi tiết mới vào LocalStorage
        localStorage.setItem("TDHD_ChiTietViPhamHocSinh", JSON.stringify(viPhams));
        localStorage.setItem("TDHD_ChiTietThanhTichHocSinh", JSON.stringify(thanhTichs));
        localStorage.setItem("TDHD_NhatKyChamDiem", JSON.stringify(nhatKys));

        // 4. Gọi tái tính toán tự động toàn bộ rankings điểm số
        MockDatabase.recalculateAllWeeks();

        // 5. Đồng bộ hóa nền lên Supabase
        MockDatabase.syncAllTransactionData();

        // 6. Cập nhật lại giao diện ngay lập tức
        this.renderAll();
        alert("Đã lưu và tổng hợp toàn bộ bảng ma trận thi đua thành công!");
    }

    renderRecentLogs() {
        if (!localStorage.getItem("TDHD_NhatKyChamDiem")) {
            const viPhams = JSON.parse(localStorage.getItem("TDHD_ChiTietViPhamHocSinh") || "[]");
            const thanhTichs = JSON.parse(localStorage.getItem("TDHD_ChiTietThanhTichHocSinh") || "[]");
            const students = JSON.parse(localStorage.getItem("TDHD_DanhSachHocSinh") || "[]");
            const criteria = JSON.parse(localStorage.getItem("TDHD_QuyDinhThiDua") || "[]");
            const nhatKyList = [];
            let nkcdId = 1;

            viPhams.forEach(v => {
                const tc = criteria.find(c => c.MaTieuChi === v.MaTieuChi);
                const hs = v.MaHocSinh ? students.find(s => s.MaHocSinh === v.MaHocSinh) : null;
                const targetName = hs ? hs.HoTen : "Tập thể lớp";
                const tcName = tc ? tc.NoiDung : "Vi phạm";
                const score = tc ? tc.DiemChuyenDoi : 0;
                const weekObj = WEEKS.find(w => w.MaTuan === v.MaTuan);
                const thoiGian = new Date(new Date(weekObj ? weekObj.NgayBatDau : "2025-09-01").getTime() + (v.ThuTrongTuan - 2) * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000).toISOString();

                nhatKyList.push({
                    MaNhatKy: nkcdId++,
                    MaNguoiDung: v.MaNguoiDungGhiNhan,
                    MaLop: v.MaLop,
                    MaTuan: v.MaTuan,
                    LoaiGiaoDich: "TRU",
                    NoiDungTomTat: `${tcName} · ${hs ? 'Học sinh' : 'Đối tượng'}: ${targetName}`,
                    DiemThayDoi: -score,
                    ThuTrongTuan: v.ThuTrongTuan,
                    ThoiGianThucHien: thoiGian
                });
            });

            thanhTichs.forEach(t => {
                const tc = criteria.find(c => c.MaTieuChi === t.MaTieuChi);
                const hs = t.MaHocSinh ? students.find(s => s.MaHocSinh === t.MaHocSinh) : null;
                const targetName = hs ? hs.HoTen : "Tập thể lớp";
                const tcName = tc ? tc.NoiDung : "Thành tích";
                const score = tc ? tc.DiemChuyenDoi : 0;
                const weekObj = WEEKS.find(w => w.MaTuan === t.MaTuan);
                const thoiGian = new Date(new Date(weekObj ? weekObj.NgayBatDau : "2025-09-01").getTime() + (t.ThuTrongTuan - 2) * 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000).toISOString();

                nhatKyList.push({
                    MaNhatKy: nkcdId++,
                    MaNguoiDung: t.MaNguoiDungGhiNhan,
                    MaLop: t.MaLop,
                    MaTuan: t.MaTuan,
                    LoaiGiaoDich: "CONG",
                    NoiDungTomTat: `${tcName} · ${hs ? 'Học sinh' : 'Đối tượng'}: ${targetName}`,
                    DiemThayDoi: score,
                    ThuTrongTuan: t.ThuTrongTuan,
                    ThoiGianThucHien: thoiGian
                });
            });

            localStorage.setItem("TDHD_NhatKyChamDiem", JSON.stringify(nhatKyList));
        }
        const nhatKys = JSON.parse(localStorage.getItem("TDHD_NhatKyChamDiem") || "[]");
        const classes = JSON.parse(localStorage.getItem("TDHD_DanhMucLop") || "[]");

        this.recentLogsList.innerHTML = "";

        // Lọc các bản ghi thuộc tuần hiện tại
        const weekLogs = nhatKys.filter(n => n.MaTuan === this.currentWeekId);

        // Sắp xếp theo MaNhatKy DESC (mới nhất lên đầu)
        weekLogs.sort((a, b) => b.MaNhatKy - a.MaNhatKy);

        // Hiển thị tối đa 5 bản ghi mới nhất
        const displayLogs = weekLogs.slice(0, 5);

        if (displayLogs.length === 0) {
            this.recentLogsList.innerHTML = '<div class="no-data">Chưa có nhật ký chấm thi đua nào trong tuần này.</div>';
            return;
        }

        displayLogs.forEach(log => {
            const lop = classes.find(c => c.MaLop === log.MaLop);
            const lopName = lop ? lop.TenLop : "Không rõ";

            const div = document.createElement("div");
            div.className = `log-entry-item`;
            div.innerHTML = `
                <div class="log-indicator ${log.LoaiGiaoDich === 'TRU' ? 'tru' : 'cong'}">
                    <span class="material-symbols-rounded">${log.LoaiGiaoDich === 'TRU' ? 'remove_circle' : 'add_circle'}</span>
                </div>
                <div class="log-details">
                    <div class="log-header">
                        <span class="class-name">Lớp ${lopName}</span>
                        <span class="time-stamp">Thứ ${log.ThuTrongTuan}</span>
                    </div>
                    <div class="log-body">
                        ${log.NoiDungTomTat && log.NoiDungTomTat.includes("Đối tượng: Tập thể lớp") 
                          ? log.NoiDungTomTat 
                          : log.NoiDungTomTat 
                            ? log.NoiDungTomTat.replace("Đối tượng:", "Học sinh:") 
                            : ""}
                    </div>
                </div>
                <div class="log-score ${log.LoaiGiaoDich === 'TRU' ? 'text-red' : 'text-green'}" style="font-weight:700;font-size:0.95rem;margin-left:auto;">
                    ${log.DiemThayDoi > 0 ? '+' : ''}${log.DiemThayDoi}đ
                </div>
            `;
            this.recentLogsList.appendChild(div);
        });
    }

    // ============================================================================
    // 5B. RENDER TAB 2B: BẢNG TỔNG HỢP VI PHẠM (NHẬT KÝ VI PHẠM HÀNG NGÀY)
    // ============================================================================
    renderViolationSummaryTab() {
        const classes = JSON.parse(localStorage.getItem("TDHD_DanhMucLop") || "[]");

        // Đồng bộ hóa giá trị bộ chọn tuần
        this.summarySelectWeek.value = this.currentWeekId;

        // Điền dữ liệu vào bộ chọn Lớp học
        this.summarySelectLop.innerHTML = '<option value="" disabled selected>-- Chọn lớp xem thống kê --</option>';
        classes.forEach(lop => {
            const opt = document.createElement("option");
            opt.value = lop.MaLop;
            opt.textContent = lop.TenLop;
            this.summarySelectLop.appendChild(opt);
        });

        // Ẩn ma trận cho đến khi lớp được chọn
        this.summaryMatrixContainer.style.display = "none";
    }

    loadSummaryMatrixData() {
        const lopId = parseInt(this.summarySelectLop.value);
        const weekId = parseInt(this.summarySelectWeek.value);

        if (!lopId || !weekId) {
            this.summaryMatrixContainer.style.display = "none";
            return;
        }

        const classes = JSON.parse(localStorage.getItem("TDHD_DanhMucLop") || "[]");
        const lop = classes.find(c => c.MaLop === lopId);
        const lopTen = lop ? lop.TenLop : "";

        this.summaryMatrixContainer.style.display = "block";
        this.summaryMatrixTitle.textContent = `BẢNG SỐ LIỆU TỔNG HỢP LỖI PHẠT - LỚP ${lopTen.toUpperCase()}`;

        const criteria = JSON.parse(localStorage.getItem("TDHD_QuyDinhThiDua") || "[]");
        const nhatKyViPhams = JSON.parse(localStorage.getItem("TDHD_NhatKyViPhamHangNgay") || "[]");

        this.summaryMatrixTbody.innerHTML = "";

        // Chỉ lọc các quy định loại TRU (Vi phạm nề nếp)
        const activeViolations = criteria.filter(c => c.Loai === "TRU" && c.is_active !== false);

        activeViolations.forEach(tc => {
            const tr = document.createElement("tr");

            // Cột 1: Tên tiêu chí
            const tdCriteria = document.createElement("td");
            tdCriteria.innerHTML = `<span style="color:var(--text-muted);font-family:monospace;font-size:0.75rem;margin-right:6px;">${tc.MaTieuChi.toString().padStart(3, '0')}</span><strong>${tc.NoiDung}</strong> <span class="badge badge-danger" style="margin-left:6px;font-size:0.65rem;">-${tc.DiemChuyenDoi}đ${tc.DonViTinh}</span>`;
            tr.appendChild(tdCriteria);

            let rowTotal = 0;

            // Cột 2 đến 7: Thứ 2 -> Thứ 7
            for (let thu = 2; thu <= 7; thu++) {
                // Tra cứu số lượng lỗi vi phạm trong bảng Nhật ký vi phạm hàng ngày (Bảng 9)
                const log = nhatKyViPhams.find(nk => nk.MaLop === lopId && nk.MaTuan === weekId && nk.MaTieuChi === tc.MaTieuChi && nk.ThuTrongTuan === thu);
                const quantity = log ? log.SoLuong : 0;
                rowTotal += quantity;

                const td = document.createElement("td");
                td.style.textAlign = "center";

                if (quantity > 0) {
                    td.innerHTML = `<span class="badge badge-danger" style="font-size:0.8rem; font-weight:700; border-radius:50%; width:24px; height:24px; display:inline-flex; align-items:center; justify-content:center; padding:0;">${quantity}</span>`;
                } else {
                    td.innerHTML = `<span style="color:var(--text-muted); opacity:0.35;">-</span>`;
                }
                tr.appendChild(td);
            }

            // Cột 8: Tổng cộng hàng ngang
            const tdTotal = document.createElement("td");
            tdTotal.style.textAlign = "center";
            tdTotal.style.background = "oklch(60% 0.19 25 / 6%)";

            if (rowTotal > 0) {
                tdTotal.innerHTML = `<span style="color:var(--danger-color); font-weight:800; font-size:0.95rem;">${rowTotal}</span>`;
            } else {
                tdTotal.innerHTML = `<span style="color:var(--text-muted); opacity:0.35;">0</span>`;
            }
            tr.appendChild(tdTotal);

            this.summaryMatrixTbody.appendChild(tr);
        });
    }

    // ============================================================================
    // 6. RENDER TAB 3: LỊCH PHÂN CÔNG CO ĐỎ CHẤM CHÉO
    // ============================================================================
    renderAssignmentsTab() {
        const assignments = JSON.parse(localStorage.getItem("TDHD_PhanCongCoDo") || "[]");
        const users = JSON.parse(localStorage.getItem("TDHD_NguoiDung") || "[]");
        const classes = JSON.parse(localStorage.getItem("TDHD_DanhMucLop") || "[]");

        const tbody = document.getElementById("assignments-tbody");
        const btnSave = document.getElementById("btn-save-assignments");
        tbody.innerHTML = "";

        // Hiển thị hoặc ẩn nút Lưu Phân Công dựa trên vai trò ADMIN
        if (btnSave) {
            if (this.currentRole === "ADMIN") {
                btnSave.style.display = "inline-flex";
            } else {
                btnSave.style.display = "none";
            }
        }

        // Lấy lịch phân công của tuần hiện tại
        const weekAssigns = assignments.filter(a => a.MaTuan === this.currentWeekId);

        // Khởi tạo assignmentsState nếu chưa có hoặc khi chuyển tuần
        if (!this.assignmentsState || this.lastRenderedWeekId !== this.currentWeekId) {
            this.assignmentsState = weekAssigns.map(a => ({
                MaPhanCong: a.MaPhanCong,
                MaNguoiDung: a.MaNguoiDung,
                MaLop: a.MaLop
            }));
            this.lastRenderedWeekId = this.currentWeekId;
        }

        const renderGrid = () => {
            tbody.innerHTML = "";

            // Lọc ra các dòng hợp lệ + dòng trống ở cuối (chỉ hiển thị dòng trống nếu là ADMIN)
            const rowsToRender = [...this.assignmentsState];
            if (this.currentRole === "ADMIN") {
                // Kiểm tra xem dòng cuối cùng có phải là dòng trống không, nếu không thì thêm vào
                const lastRow = rowsToRender[rowsToRender.length - 1];
                if (!lastRow || (lastRow.MaNguoiDung !== null && lastRow.MaLop !== null)) {
                    this.assignmentsState.push({ MaPhanCong: null, MaNguoiDung: null, MaLop: null });
                    rowsToRender.push(this.assignmentsState[this.assignmentsState.length - 1]);
                }
            }

            rowsToRender.forEach((row, index) => {
                const tr = document.createElement("tr");

                if (this.currentRole === "ADMIN") {
                    // --- CHẾ ĐỘ ADMIN: BẢNG TƯƠNG TÁC EDITABLE ---
                    // Cột 1: Cờ đỏ trực (dropdown select)
                    const tdCodo = document.createElement("td");
                    const selectCodo = document.createElement("select");
                    selectCodo.className = "codo-select-inline";
                    selectCodo.style.width = "100%";
                    selectCodo.style.maxWidth = "280px";
                    selectCodo.innerHTML = '<option value="" disabled selected>-- Chọn học sinh Cờ đỏ --</option>';

                    users.filter(u => u.VaiTro === "CO_DO").forEach(codoUser => {
                        const codoLop = classes.find(c => c.MaLop === codoUser.MaLop);
                        const opt = document.createElement("option");
                        opt.value = codoUser.MaNguoiDung;
                        opt.textContent = `${codoUser.HoTen} (Cờ đỏ lớp ${codoLop ? codoLop.TenLop : "Không rõ"})`;
                        selectCodo.appendChild(opt);
                    });
                    if (row.MaNguoiDung !== null) {
                        selectCodo.value = row.MaNguoiDung;
                    }
                    tdCodo.appendChild(selectCodo);
                    tr.appendChild(tdCodo);

                    // Cột 2: Lớp học bản thân (tự động điền)
                    const tdOwnLop = document.createElement("td");
                    const selectedCodoUser = row.MaNguoiDung ? users.find(u => u.MaNguoiDung === row.MaNguoiDung) : null;
                    const ownLopObj = selectedCodoUser ? classes.find(c => c.MaLop === selectedCodoUser.MaLop) : null;
                    tdOwnLop.innerHTML = ownLopObj ? `<strong>${ownLopObj.TenLop}</strong>` : `<span style="color:var(--text-muted); opacity:0.35;">-</span>`;
                    tr.appendChild(tdOwnLop);

                    // Cột 3: Tuần trực
                    const tdWeek = document.createElement("td");
                    tdWeek.textContent = `Tuần ${this.currentWeekId}`;
                    tr.appendChild(tdWeek);

                    // Cột 4: Lớp phân công chấm (dropdown select)
                    const tdTargetLop = document.createElement("td");
                    const selectTargetLop = document.createElement("select");
                    selectTargetLop.className = "codo-select-inline";
                    selectTargetLop.style.width = "100%";
                    selectTargetLop.style.maxWidth = "200px";
                    selectTargetLop.innerHTML = '<option value="" disabled selected>-- Chọn lớp chấm chéo --</option>';
                    classes.forEach(lop => {
                        const opt = document.createElement("option");
                        opt.value = lop.MaLop;
                        opt.textContent = lop.TenLop;
                        selectTargetLop.appendChild(opt);
                    });
                    if (row.MaLop !== null) {
                        selectTargetLop.value = row.MaLop;
                    }
                    tdTargetLop.appendChild(selectTargetLop);
                    tr.appendChild(tdTargetLop);

                    // Cột 5: Quy tắc an toàn (tự động kiểm tra)
                    const tdSafety = document.createElement("td");
                    if (row.MaNguoiDung && row.MaLop) {
                        if (selectedCodoUser.MaLop === row.MaLop) {
                            tdSafety.innerHTML = `<span class="safe-status danger"><span class="material-symbols-rounded">warning</span> Trùng lớp (Không an toàn)</span>`;
                        } else {
                            tdSafety.innerHTML = `<span class="safe-status success"><span class="material-symbols-rounded">gpp_good</span> Hợp lệ (Chấm chéo)</span>`;
                        }
                    } else {
                        tdSafety.innerHTML = `<span style="color:var(--text-muted); opacity:0.35;">-</span>`;
                    }
                    tr.appendChild(tdSafety);

                    // Cột 6: Thao tác (Xoá dòng)
                    const tdAction = document.createElement("td");
                    const btnDelete = document.createElement("button");
                    btnDelete.className = "btn btn-icon btn-sm text-red";
                    btnDelete.innerHTML = `<span class="material-symbols-rounded">delete</span>`;

                    // Nếu là dòng trống cuối cùng, ẩn hoặc vô hiệu hóa nút xóa
                    if (row.MaNguoiDung === null && row.MaLop === null) {
                        btnDelete.style.opacity = "0.3";
                        btnDelete.style.cursor = "not-allowed";
                    } else {
                        btnDelete.addEventListener("click", () => {
                            this.assignmentsState.splice(index, 1);
                            renderGrid();
                        });
                    }
                    tdAction.appendChild(btnDelete);
                    tr.appendChild(tdAction);

                    // Đăng ký sự kiện thay đổi dữ liệu
                    selectCodo.addEventListener("change", (e) => {
                        const val = parseInt(e.target.value);
                        row.MaNguoiDung = val;
                        // Kiểm tra nếu là dòng trống cuối cùng vừa được điền đầy đủ cả hai
                        if (row.MaNguoiDung && row.MaLop) {
                            // Tạo dòng trống mới tự động
                            this.assignmentsState.push({ MaPhanCong: null, MaNguoiDung: null, MaLop: null });
                        }
                        renderGrid();
                    });

                    selectTargetLop.addEventListener("change", (e) => {
                        const val = parseInt(e.target.value);
                        row.MaLop = val;
                        // Kiểm tra nếu là dòng trống cuối cùng vừa được điền đầy đủ cả hai
                        if (row.MaNguoiDung && row.MaLop) {
                            // Tạo dòng trống mới tự động
                            this.assignmentsState.push({ MaPhanCong: null, MaNguoiDung: null, MaLop: null });
                        }
                        renderGrid();
                    });

                } else {
                    // --- CHẾ ĐỘ XEM (CỜ ĐỎ, GIÁO VIÊN, HỌC SINH): BẢNG TĨNH ---
                    const codo = users.find(u => u.MaNguoiDung === row.MaNguoiDung);
                    const ownLop = codo ? classes.find(c => c.MaLop === codo.MaLop) : null;
                    const targetLop = classes.find(c => c.MaLop === row.MaLop);

                    // Bỏ qua dòng trống nếu không phải là ADMIN
                    if (!row.MaNguoiDung && !row.MaLop) return;

                    tr.innerHTML = `
                        <td><strong>${codo ? codo.HoTen : "Không rõ"}</strong></td>
                        <td>${ownLop ? ownLop.TenLop : "Không rõ"}</td>
                        <td>Tuần ${this.currentWeekId}</td>
                        <td><span class="badge badge-primary">${targetLop ? targetLop.TenLop : "Không rõ"}</span></td>
                        <td>
                            <span class="safe-status success">
                                <span class="material-symbols-rounded">gpp_good</span> Hợp lệ (Chấm chéo)
                            </span>
                        </td>
                        <td><span style="color:var(--text-muted); opacity:0.35;">-</span></td>
                    `;
                }

                tbody.appendChild(tr);
            });

            if (rowsToRender.length === 0 || (this.currentRole !== "ADMIN" && weekAssigns.length === 0)) {
                tbody.innerHTML = '<tr><td colspan="6" class="no-data">Chưa có lịch phân công trực cờ đỏ tuần này.</td></tr>';
            }
        };

        renderGrid();
    }

    saveAssignmentsData() {
        if (this.currentRole !== "ADMIN") return;

        const users = JSON.parse(localStorage.getItem("TDHD_NguoiDung") || "[]");
        const classes = JSON.parse(localStorage.getItem("TDHD_DanhMucLop") || "[]");

        // 1. Lọc ra các dòng đã phân công đầy đủ (bỏ qua dòng trống hoàn toàn)
        const newAssigns = [];
        let hasIncomplete = false;

        this.assignmentsState.forEach(row => {
            // Dòng trống hoàn toàn -> bỏ qua
            if (row.MaNguoiDung === null && row.MaLop === null) {
                return;
            }
            // Dòng bị thiếu một trong hai trường
            if (row.MaNguoiDung === null || row.MaLop === null) {
                hasIncomplete = true;
                return;
            }
            newAssigns.push(row);
        });

        if (hasIncomplete) {
            alert("Lỗi: Có dòng phân công bị thiếu Cờ đỏ trực hoặc thiếu Lớp phân chấm chéo. Vui lòng chọn đầy đủ hoặc xóa dòng đó!");
            return;
        }

        // 2. Kiểm tra các ràng buộc:
        // - Ràng buộc an toàn: Không chấm lớp mình
        let hasSafetyViolation = false;
        newAssigns.forEach(a => {
            const codo = users.find(u => u.MaNguoiDung === a.MaNguoiDung);
            if (codo && codo.MaLop === a.MaLop) {
                hasSafetyViolation = true;
            }
        });

        if (hasSafetyViolation) {
            // Mở dialog cảnh báo vi phạm quy tắc an toàn đã có sẵn trong file HTML
            this.alertDialog.showModal();
            return;
        }

        // - Ràng buộc duy nhất: Một cờ đỏ chỉ chấm một lớp mỗi tuần
        const codoIds = newAssigns.map(a => a.MaNguoiDung);
        const uniqueCodoIds = new Set(codoIds);
        if (codoIds.length !== uniqueCodoIds.size) {
            alert("Lỗi: Phát hiện học sinh Cờ đỏ được phân công chấm nhiều hơn 1 lớp trong tuần này! Vui lòng sửa lại.");
            return;
        }

        // 3. Tiến hành lưu:
        // Đọc toàn bộ assignments cũ, lọc bỏ tuần hiện tại
        let allAssigns = JSON.parse(localStorage.getItem("TDHD_PhanCongCoDo") || "[]");
        allAssigns = allAssigns.filter(a => a.MaTuan !== this.currentWeekId);

        // Tạo danh sách lưu chính thức kèm mã phân công mới tăng tự động
        let nextPcId = allAssigns.length > 0 ? Math.max(...allAssigns.map(a => a.MaPhanCong)) + 1 : 1;
        newAssigns.forEach(a => {
            allAssigns.push({
                MaPhanCong: nextPcId++,
                MaNguoiDung: a.MaNguoiDung,
                MaTuan: this.currentWeekId,
                MaLop: a.MaLop
            });
        });

        localStorage.setItem("TDHD_PhanCongCoDo", JSON.stringify(allAssigns));

        // Đồng bộ lên Supabase
        MockDatabase.syncTableToSupabase("TDHD_PhanCongCoDo", "PhanCongCoDo", "MaPhanCong");

        // Reset assignmentsState để nó đồng bộ và tải lại trong đợt render tiếp theo
        this.assignmentsState = null;

        // Tải lại giao diện và thông báo
        this.renderAll();
        alert("Đã lưu và cập nhật lịch phân công trực tuần này thành công!");
    }

    // ============================================================================
    // 7. RENDER TAB 4: QUY ĐỊNH THI ĐUA
    // ============================================================================
    renderRegulationsTab() {
        if (!this.regulationsState) {
            this.regulationsState = JSON.parse(localStorage.getItem("TDHD_QuyDinhThiDua") || "[]");
        }
        const criteria = this.regulationsState;
        const tbody = document.getElementById("criteria-tbody");
        tbody.innerHTML = "";

        // Hiển thị hoặc ẩn nút Lưu thực hiện dựa trên vai trò ADMIN
        if (this.btnSaveRegulations) {
            if (this.currentRole === "ADMIN") {
                this.btnSaveRegulations.style.display = "inline-flex";
            } else {
                this.btnSaveRegulations.style.display = "none";
            }
        }

        criteria.forEach(row => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td><code>REQ_${row.MaTieuChi.toString().padStart(3, '0')}</code></td>
                <td><strong>${row.NoiDung}</strong></td>
                <td>
                    <span class="badge ${row.Loai === 'TRU' ? 'badge-danger' : 'badge-success'}">
                        ${row.Loai === 'TRU' ? 'Điểm Trừ' : 'Điểm Cộng'}
                    </span>
                </td>
                <td class="${row.Loai === 'TRU' ? 'text-red' : 'text-green'}">
                    <strong>${row.Loai === 'TRU' ? '-' : '+'}${row.DiemChuyenDoi}</strong>
                </td>
                <td>${row.DonViTinh}</td>
                <td>
                    ${this.currentRole === "ADMIN" ? `
                        <div style="display: flex; gap: 0.5rem; justify-content: center; align-items: center;">
                            <button class="btn btn-icon btn-sm text-blue btn-edit-criterion" data-id="${row.MaTieuChi}" title="Sửa">
                                <span class="material-symbols-rounded">edit</span>
                            </button>
                            <button class="btn btn-icon btn-sm btn-toggle-criterion ${row.is_active !== false ? 'text-orange' : 'text-green'}" data-id="${row.MaTieuChi}" title="${row.is_active !== false ? 'Vô hiệu hóa' : 'Kích hoạt'}">
                                <span class="material-symbols-rounded">${row.is_active !== false ? 'block' : 'check_circle'}</span>
                            </button>
                            <button class="btn btn-icon btn-sm text-red btn-delete-criterion" data-id="${row.MaTieuChi}" title="Xóa">
                                <span class="material-symbols-rounded">delete</span>
                            </button>
                        </div>
                    ` : `<span style="color:var(--text-muted); font-size: 0.85rem;">-</span>`}
                </td>
            `;

            if (this.currentRole === "ADMIN") {
                // Sửa
                const btnEdit = tr.querySelector(".btn-edit-criterion");
                btnEdit.addEventListener("click", () => {
                    this.editingCriterionId = row.MaTieuChi;
                    const dialogTitle = this.criterionDialog.querySelector("h3");
                    if (dialogTitle) dialogTitle.textContent = "Cập Nhật Tiêu Chí Thi Đua";
                    
                    this.criterionContent.value = row.NoiDung;
                    this.criterionType.value = row.Loai;
                    this.criterionScore.value = row.DiemChuyenDoi;
                    this.criterionUnit.value = row.DonViTinh;
                    
                    this.criterionDialog.showModal();
                });

                // Vô hiệu hóa
                const btnToggle = tr.querySelector(".btn-toggle-criterion");
                btnToggle.addEventListener("click", () => {
                    row.is_active = row.is_active === false ? true : false;
                    this.renderRegulationsTab();
                });

                // Xóa
                const btnDelete = tr.querySelector(".btn-delete-criterion");
                btnDelete.addEventListener("click", () => {
                    if (confirm(`Bạn có chắc chắn muốn xóa tiêu chí "REQ_${row.MaTieuChi.toString().padStart(3, '0')} - ${row.NoiDung}" này?`)) {
                        this.regulationsState = this.regulationsState.filter(c => c.MaTieuChi !== row.MaTieuChi);
                        this.renderRegulationsTab();
                    }
                });
            }

            tbody.appendChild(tr);
        });
    }

    handleCriterionSubmit() {
        if (this.currentRole !== "ADMIN") return;

        const content = this.criterionContent.value.trim();
        const type = this.criterionType.value;
        const score = parseFloat(this.criterionScore.value);
        const unit = this.criterionUnit.value.trim();

        if (!content || !type || isNaN(score) || !unit) {
            alert("Vui lòng nhập đầy đủ các trường thông tin!");
            return;
        }

        if (!this.regulationsState) {
            this.regulationsState = JSON.parse(localStorage.getItem("TDHD_QuyDinhThiDua") || "[]");
        }

        if (this.editingCriterionId !== null) {
            // Sửa tiêu chí
            const target = this.regulationsState.find(c => c.MaTieuChi === this.editingCriterionId);
            if (target) {
                target.NoiDung = content;
                target.Loai = type;
                target.DiemChuyenDoi = score;
                target.DonViTinh = unit;
            }
            this.editingCriterionId = null;
        } else {
            // Thêm tiêu chí mới
            const nextId = this.regulationsState.length > 0 ? Math.max(...this.regulationsState.map(c => c.MaTieuChi)) + 1 : 1;

            const newCriterion = {
                MaTieuChi: nextId,
                NoiDung: content,
                Loai: type,
                DiemChuyenDoi: score,
                DonViTinh: unit,
                is_active: true
            };

            this.regulationsState.push(newCriterion);
        }

        // Reset form, đóng dialog và render lại danh sách
        this.criterionForm.reset();
        this.criterionDialog.close();
        this.renderRegulationsTab();
    }

    // ============================================================================
    // 8. RENDER TAB 5: HỒ SƠ HỌC SINH & LỚP HỌC CHI TIẾT
    // ============================================================================
    renderStudentsTab() {
        const classes = JSON.parse(localStorage.getItem("TDHD_DanhMucLop") || "[]");
        if (!this.studentsState) {
            this.studentsState = JSON.parse(localStorage.getItem("TDHD_DanhSachHocSinh") || "[]");
        }
        const students = this.studentsState;
        const viPhams = JSON.parse(localStorage.getItem("TDHD_ChiTietViPhamHocSinh") || "[]");
        const thanhTichs = JSON.parse(localStorage.getItem("TDHD_ChiTietThanhTichHocSinh") || "[]");

        // 1. Render sidebar chọn lớp
        const sidebar = document.getElementById("class-sidebar-list");
        sidebar.innerHTML = "";

        classes.forEach(lop => {
            const btn = document.createElement("button");
            btn.className = `list-group-item ${lop.MaLop === this.currentSelectedClassId ? 'active' : ''}`;
            btn.innerHTML = `
                <span>Lớp ${lop.TenLop}</span>
                <span class="badge badge-sm">Khối ${lop.Khoi}</span>
            `;
            btn.addEventListener("click", () => {
                this.currentSelectedClassId = lop.MaLop;
                this.renderStudentsTab();
            });
            sidebar.appendChild(btn);
        });

        // Hiển thị hoặc ẩn nút Lưu thực hiện dựa trên vai trò ADMIN
        if (this.btnSaveStudents) {
            if (this.currentRole === "ADMIN") {
                this.btnSaveStudents.style.display = "inline-flex";
            } else {
                this.btnSaveStudents.style.display = "none";
            }
        }

        // 2. Render danh sách học sinh của lớp được chọn
        const targetClass = classes.find(c => c.MaLop === this.currentSelectedClassId);
        document.getElementById("class-student-title").textContent = `Danh sách học sinh lớp ${targetClass ? targetClass.TenLop : "Không rõ"}`;

        const tbody = document.getElementById("students-tbody");
        tbody.innerHTML = "";

        const classStudents = students.filter(s => s.MaLop === this.currentSelectedClassId);

        classStudents.forEach(row => {
            // Lọc và đếm số lỗi rèn luyện / thành tích học tập cá nhân của học sinh này trong tuần hiện tại
            const numVp = viPhams.filter(v => v.MaHocSinh === row.MaHocSinh && v.MaTuan === this.currentWeekId).length;
            const numTt = thanhTichs.filter(t => t.MaHocSinh === row.MaHocSinh && t.MaTuan === this.currentWeekId).length;

            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td><code>HS_${targetClass ? targetClass.TenLop : "CLASS"}_${row.MaHocSinh.toString().slice(-2)}</code></td>
                <td><strong>${row.HoTen}</strong></td>
                <td>Lớp ${targetClass ? targetClass.TenLop : "Không rõ"}</td>
                <td>${row.NgaySinh}</td>
                <td>${row.GioiTinh}</td>
                <td>
                    <span class="badge ${numVp > 0 ? 'badge-danger' : 'badge-secondary'} btn-vp-detail" style="cursor: pointer;" title="Xem chi tiết vi phạm">${numVp} vi phạm</span>
                </td>
                <td>
                    <span class="badge ${numTt > 0 ? 'badge-success' : 'badge-secondary'} btn-tt-detail" style="cursor: pointer;" title="Xem chi tiết khen thưởng">${numTt} thành tích</span>
                </td>
                <td>
                    ${this.currentRole === "ADMIN" ? `
                        <div style="display: flex; gap: 0.5rem; justify-content: center; align-items: center;">
                            <button class="btn btn-icon btn-sm text-blue btn-edit-student" data-id="${row.MaHocSinh}" title="Sửa">
                                <span class="material-symbols-rounded">edit</span>
                            </button>
                            <button class="btn btn-icon btn-sm btn-toggle-student ${row.is_active !== false ? 'text-orange' : 'text-green'}" data-id="${row.MaHocSinh}" title="${row.is_active !== false ? 'Vô hiệu hóa' : 'Kích hoạt'}">
                                <span class="material-symbols-rounded">${row.is_active !== false ? 'block' : 'check_circle'}</span>
                            </button>
                            <button class="btn btn-icon btn-sm text-red btn-delete-student" data-id="${row.MaHocSinh}" title="Xóa">
                                <span class="material-symbols-rounded">delete</span>
                            </button>
                        </div>
                    ` : `<span style="color:var(--text-muted); font-size: 0.85rem;">-</span>`}
                </td>
            `;

            if (row.is_active === false) {
                tr.style.opacity = "0.4";
            }

            if (this.currentRole === "ADMIN") {
                // Sửa học sinh
                const btnEdit = tr.querySelector(".btn-edit-student");
                btnEdit.addEventListener("click", () => {
                    this.editingStudentId = row.MaHocSinh;
                    const dialogTitle = this.studentDialog.querySelector("h3");
                    if (dialogTitle) dialogTitle.textContent = "Cập Nhật Thông Tin Học Sinh";
                    
                    this.studentNameInput.value = row.HoTen;
                    this.studentGenderSelect.value = row.GioiTinh === "Nữ" ? "Nữ" : "Nam";
                    
                    // Chuyển đổi ngày sinh DD/MM/YYYY sang YYYY-MM-DD
                    const parts = row.NgaySinh.split("/");
                    if (parts.length === 3) {
                        this.studentDobInput.value = `${parts[2]}-${parts[1]}-${parts[0]}`;
                    } else {
                        this.studentDobInput.value = "";
                    }
                    
                    this.studentDialog.showModal();
                });

                // Vô hiệu hóa
                const btnToggle = tr.querySelector(".btn-toggle-student");
                btnToggle.addEventListener("click", () => {
                    row.is_active = row.is_active === false ? true : false;
                    this.renderStudentsTab();
                });

                // Xóa học sinh
                const btnDelete = tr.querySelector(".btn-delete-student");
                btnDelete.addEventListener("click", () => {
                    if (confirm(`Bạn có chắc chắn muốn xóa học sinh "${row.HoTen}" khỏi danh sách?`)) {
                        this.studentsState = this.studentsState.filter(s => s.MaHocSinh !== row.MaHocSinh);
                        this.renderStudentsTab();
                    }
                });
            }

            // Xem chi tiết lỗi phạt của học sinh
            const btnVpDetail = tr.querySelector(".btn-vp-detail");
            btnVpDetail.addEventListener("click", () => {
                this.showStudentDetail(row.MaHocSinh, "TRU");
            });

            // Xem chi tiết thành tích của học sinh
            const btnTtDetail = tr.querySelector(".btn-tt-detail");
            btnTtDetail.addEventListener("click", () => {
                this.showStudentDetail(row.MaHocSinh, "CONG");
            });

            tbody.appendChild(tr);
        });

        if (classStudents.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="no-data">Lớp học chưa có dữ liệu học sinh.</td></tr>';
        }
    }

    showStudentDetail(studentId, filterType = "ALL") {
        const students = JSON.parse(localStorage.getItem("TDHD_DanhSachHocSinh") || "[]");
        const viPhams = JSON.parse(localStorage.getItem("TDHD_ChiTietViPhamHocSinh") || "[]");
        const thanhTichs = JSON.parse(localStorage.getItem("TDHD_ChiTietThanhTichHocSinh") || "[]");
        const criteria = JSON.parse(localStorage.getItem("TDHD_QuyDinhThiDua") || "[]");

        const student = students.find(s => s.MaHocSinh === studentId);
        if (!student) return;

        const filteredVps = filterType === "CONG" ? [] : viPhams.filter(v => v.MaHocSinh === studentId && v.MaTuan === this.currentWeekId);
        const filteredTts = filterType === "TRU" ? [] : thanhTichs.filter(t => t.MaHocSinh === studentId && t.MaTuan === this.currentWeekId);

        const rows = [];
        filteredVps.forEach(v => {
            const tc = criteria.find(c => c.MaTieuChi === v.MaTieuChi);
            rows.push({
                type: "Vi phạm",
                content: tc ? tc.NoiDung : "Lỗi vi phạm",
                detail: v.GhiChuChiTiet || "-",
                points: `-${tc ? tc.DiemChuyenDoi : 0}đ`,
                day: `Thứ ${v.ThuTrongTuan}`
            });
        });

        filteredTts.forEach(t => {
            const tc = criteria.find(c => c.MaTieuChi === t.MaTieuChi);
            rows.push({
                type: "Thành tích",
                content: tc ? tc.NoiDung : "Khen thưởng",
                detail: t.GhiChu || "-",
                points: `+${tc ? tc.DiemChuyenDoi : 0}đ`,
                day: `Thứ ${t.ThuTrongTuan}`
            });
        });

        const titleSuffix = filterType === "TRU" ? " (Chi tiết lỗi phạt)" : (filterType === "CONG" ? " (Chi tiết điểm cộng)" : "");
        this.studentDetailTitle.textContent = `Sổ ghi nhận học sinh: ${student.HoTen}${titleSuffix}`;
        this.studentDetailTbody.innerHTML = "";

        if (rows.length === 0) {
            this.studentDetailTbody.innerHTML = `
                <tr>
                    <td colspan="5" class="no-data" style="text-align: center; color: var(--text-muted); padding: 2rem 0;">
                        Học sinh không có ghi chép khen thưởng hay kỷ luật nào trong tuần này.
                    </td>
                </tr>
            `;
        } else {
            rows.forEach(item => {
                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td class="family-pt-mono">${item.day}</td>
                    <td style="text-align: center;">
                        <span class="badge ${item.type === 'Vi phạm' ? 'badge-danger' : 'badge-success'}">
                            ${item.type}
                        </span>
                    </td>
                    <td><strong>${item.content}</strong></td>
                    <td>${item.detail}</td>
                    <td style="text-align: center;" class="${item.type === 'Vi phạm' ? 'text-danger' : 'text-success'}">
                        <strong>${item.points}</strong>
                    </td>
                `;
                this.studentDetailTbody.appendChild(tr);
            });
        }

        this.studentDetailDialog.showModal();
    }

    handleStudentSubmit() {
        if (this.currentRole !== "ADMIN") return;

        const name = this.studentNameInput.value.trim();
        const dobVal = this.studentDobInput.value;
        const gender = this.studentGenderSelect.value;

        if (!name || !dobVal || !gender) {
            alert("Vui lòng nhập đầy đủ các trường thông tin!");
            return;
        }

        // Định dạng ngày sinh từ YYYY-MM-DD sang DD/MM/YYYY
        const [year, month, day] = dobVal.split("-");
        const dobFormatted = `${day}/${month}/${year}`;

        if (!this.studentsState) {
            this.studentsState = JSON.parse(localStorage.getItem("TDHD_DanhSachHocSinh") || "[]");
        }

        if (this.editingStudentId !== null) {
            // Sửa học sinh
            const target = this.studentsState.find(s => s.MaHocSinh === this.editingStudentId);
            if (target) {
                target.HoTen = name;
                target.NgaySinh = dobFormatted;
                target.GioiTinh = gender;
            }
            this.editingStudentId = null;
        } else {
            // Thêm học sinh mới
            const nextId = this.studentsState.length > 0 ? Math.max(...this.studentsState.map(s => s.MaHocSinh)) + 1 : 1;

            const newStudent = {
                MaHocSinh: nextId,
                HoTen: name,
                MaLop: this.currentSelectedClassId,
                NgaySinh: dobFormatted,
                GioiTinh: gender,
                is_active: true
            };

            this.studentsState.push(newStudent);
        }

        // Reset form, đóng dialog và render lại danh sách
        this.studentForm.reset();
        this.studentDialog.close();
        this.renderStudentsTab();
    }

    processCSVText(text) {
        try {
            if (!text) {
                this.importSummaryText.textContent = "File trống hoặc không hợp lệ!";
                this.importSummaryText.style.color = "var(--danger-color)";
                this.btnSubmitImportStudents.disabled = true;
                return;
            }

            let lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
            if (lines.length === 0) {
                this.importSummaryText.textContent = "File không có dữ liệu!";
                this.importSummaryText.style.color = "var(--danger-color)";
                this.btnSubmitImportStudents.disabled = true;
                return;
            }

            let delimiter = ",";
            if (lines[0].startsWith("sep=")) {
                const sepParts = lines[0].split("=");
                if (sepParts.length > 1) {
                    delimiter = sepParts[1].trim();
                }
                lines.shift();
            } else {
                if (lines[0].includes(";")) {
                    delimiter = ";";
                }
            }

            if (lines.length <= 1) {
                this.importSummaryText.textContent = "File không có dữ liệu!";
                this.importSummaryText.style.color = "var(--danger-color)";
                this.btnSubmitImportStudents.disabled = true;
                return;
            }

            const parsedList = [];
            let hasError = false;

            for (let i = 1; i < lines.length; i++) {
                const line = lines[i];
                if (!line) continue;

                const cols = line.split(delimiter).map(c => c.replace(/^["']|["']$/g, '').trim());
                if (cols.length < 3) continue;

                const hoTen = cols[0];
                const ngaySinh = cols[1];
                const gioiTinh = cols[2];

                if (!hoTen || !ngaySinh || !gioiTinh) continue;

                // Validate ngày sinh dạng DD/MM/YYYY
                const dobRegex = /^\d{1,2}\/\d{1,2}\/\d{4}$/;
                if (!dobRegex.test(ngaySinh)) {
                    this.importSummaryText.textContent = `Dòng số ${i + 1}: Ngày sinh "${ngaySinh}" không đúng định dạng DD/MM/YYYY!`;
                    this.importSummaryText.style.color = "var(--danger-color)";
                    this.btnSubmitImportStudents.disabled = true;
                    hasError = true;
                    break;
                }

                // Validate giới tính
                if (gioiTinh !== "Nam" && gioiTinh !== "Nữ") {
                    this.importSummaryText.textContent = `Dòng số ${i + 1}: Giới tính "${gioiTinh}" phải là "Nam" hoặc "Nữ"!`;
                    this.importSummaryText.style.color = "var(--danger-color)";
                    this.btnSubmitImportStudents.disabled = true;
                    hasError = true;
                    break;
                }

                parsedList.push({
                    HoTen: hoTen,
                    NgaySinh: ngaySinh,
                    GioiTinh: gioiTinh
                });
            }

            if (hasError) return;

            if (parsedList.length === 0) {
                this.importSummaryText.textContent = "Không tìm thấy học sinh hợp lệ để import!";
                this.importSummaryText.style.color = "var(--danger-color)";
                this.btnSubmitImportStudents.disabled = true;
                this.importPreviewContainer.style.display = "none";
            } else {
                this.tempImportedStudents = parsedList;
                
                // Render Preview Table
                this.importPreviewTbody.innerHTML = "";
                parsedList.forEach(item => {
                    const tr = document.createElement("tr");
                    tr.innerHTML = `
                        <td>${item.HoTen}</td>
                        <td>${item.NgaySinh}</td>
                        <td>${item.GioiTinh}</td>
                    `;
                    this.importPreviewTbody.appendChild(tr);
                });

                this.importSummaryText.textContent = `Tìm thấy ${parsedList.length} học sinh hợp lệ để import.`;
                this.importSummaryText.style.color = "var(--primary-color)";
                this.importPreviewContainer.style.display = "block";
                this.btnSubmitImportStudents.disabled = false;
            }
        } catch (err) {
            this.importSummaryText.textContent = "Có lỗi xảy ra khi đọc file!";
            this.importSummaryText.style.color = "var(--danger-color)";
            this.btnSubmitImportStudents.disabled = true;
        }
    }
}

// Khởi chạy ứng dụng ngay sau khi tải xong toàn bộ HTML
window.addEventListener("DOMContentLoaded", async () => {
    // 1. Luôn cố gắng tải dữ liệu từ file db.json vào localStorage khi tải trang
    const loaded = await MockDatabase.loadFromFile();

    // 2. Nếu không tải được (ví dụ chạy offline file://), khởi tạo database mẫu mặc định
    if (!loaded) {
        MockDatabase.init();
    }

    // 3. Tái tính toán và đồng bộ các bảng điểm thi đua
    MockDatabase.recalculateAllWeeks();

    // 4. Khởi tạo AppStateManager
    window.tdhdApp = new AppStateManager();
});
