import { supabase } from './supabaseClient';

export interface DatabaseState {
  DanhMucLop: any[];
  DanhMucTuan: any[];
  QuyDinhThiDua: any[];
  DanhSachHocSinh: any[];
  NguoiDung: any[];
  PhanCongCoDo: any[];
  ChiTietViPhamHocSinh: any[];
  ChiTietThanhTichHocSinh: any[];
  NhatKyViPhamHangNgay: any[];
  ThanhTichHocTapTheoTuan: any[];
  TongKetThiDuaTuan: any[];
  NhatKyChamDiem: any[];
}

// Tải dữ liệu cục bộ từ db.json
export async function fetchLocalFallback(): Promise<DatabaseState | null> {
  try {
    const response = await fetch('/db.json');
    if (!response.ok) throw new Error("Could not fetch db.json");
    const data = await response.json();
    const state: DatabaseState = {
      DanhMucLop: typeof data.TDHD_DanhMucLop === 'string' ? JSON.parse(data.TDHD_DanhMucLop) : data.TDHD_DanhMucLop,
      DanhMucTuan: typeof data.TDHD_DanhMucTuan === 'string' ? JSON.parse(data.TDHD_DanhMucTuan) : data.TDHD_DanhMucTuan,
      QuyDinhThiDua: typeof data.TDHD_QuyDinhThiDua === 'string' ? JSON.parse(data.TDHD_QuyDinhThiDua) : data.TDHD_QuyDinhThiDua,
      DanhSachHocSinh: typeof data.TDHD_DanhSachHocSinh === 'string' ? JSON.parse(data.TDHD_DanhSachHocSinh) : data.TDHD_DanhSachHocSinh,
      NguoiDung: typeof data.TDHD_NguoiDung === 'string' ? JSON.parse(data.TDHD_NguoiDung) : data.TDHD_NguoiDung,
      PhanCongCoDo: typeof data.TDHD_PhanCongCoDo === 'string' ? JSON.parse(data.TDHD_PhanCongCoDo) : data.TDHD_PhanCongCoDo,
      ChiTietViPhamHocSinh: typeof data.TDHD_ChiTietViPhamHocSinh === 'string' ? JSON.parse(data.TDHD_ChiTietViPhamHocSinh) : (data.TDHD_ChiTietViPhamHocSinh || []),
      ChiTietThanhTichHocSinh: typeof data.TDHD_ChiTietThanhTichHocSinh === 'string' ? JSON.parse(data.TDHD_ChiTietThanhTichHocSinh) : (data.TDHD_ChiTietThanhTichHocSinh || []),
      NhatKyViPhamHangNgay: typeof data.TDHD_NhatKyViPhamHangNgay === 'string' ? JSON.parse(data.TDHD_NhatKyViPhamHangNgay) : (data.TDHD_NhatKyViPhamHangNgay || []),
      ThanhTichHocTapTheoTuan: typeof data.TDHD_ThanhTichHocTapTheoTuan === 'string' ? JSON.parse(data.TDHD_ThanhTichHocTapTheoTuan) : (data.TDHD_ThanhTichHocTapTheoTuan || []),
      TongKetThiDuaTuan: typeof data.TDHD_TongKetThiDuaTuan === 'string' ? JSON.parse(data.TDHD_TongKetThiDuaTuan) : (data.TDHD_TongKetThiDuaTuan || []),
      NhatKyChamDiem: typeof data.TDHD_NhatKyChamDiem === 'string' ? JSON.parse(data.TDHD_NhatKyChamDiem) : (data.TDHD_NhatKyChamDiem || [])
    };

    if (state.NhatKyChamDiem.length === 0) {
      const nhatKyList: any[] = [];
      let nkcdId = 1;
      
      state.ChiTietViPhamHocSinh.forEach((v: any) => {
        const tc = state.QuyDinhThiDua.find((c: any) => c.MaTieuChi === v.MaTieuChi);
        const hs = v.MaHocSinh ? state.DanhSachHocSinh.find((s: any) => s.MaHocSinh === v.MaHocSinh) : null;
        const targetName = hs ? hs.HoTen : "Tập thể lớp";
        const tcName = tc ? tc.NoiDung : "Vi phạm";
        const score = tc ? tc.DiemChuyenDoi : 0;
        const weekObj = state.DanhMucTuan.find((w: any) => w.MaTuan === v.MaTuan);
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

      state.ChiTietThanhTichHocSinh.forEach((t: any) => {
        const tc = state.QuyDinhThiDua.find((c: any) => c.MaTieuChi === t.MaTieuChi);
        const hs = t.MaHocSinh ? state.DanhSachHocSinh.find((s: any) => s.MaHocSinh === t.MaHocSinh) : null;
        const targetName = hs ? hs.HoTen : "Tập thể lớp";
        const tcName = tc ? tc.NoiDung : "Thành tích";
        const score = tc ? tc.DiemChuyenDoi : 0;
        const weekObj = state.DanhMucTuan.find((w: any) => w.MaTuan === t.MaTuan);
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
      state.NhatKyChamDiem = nhatKyList;
    }
    return state;
  } catch (e) {
    console.error("Local fallback error:", e);
    return null;
  }
}

// Tải dữ liệu từ Supabase
export async function fetchSupabaseData(): Promise<DatabaseState | null> {
  try {
    console.log("Đang tải dữ liệu từ Supabase...");
    const tables = [
      "DanhMucLop", "DanhMucTuan", "QuyDinhThiDua", "DanhSachHocSinh", "NguoiDung",
      "PhanCongCoDo", "ChiTietViPhamHocSinh", "ChiTietThanhTichHocSinh",
      "NhatKyViPhamHangNgay", "ThanhTichHocTapTheoTuan", "TongKetThiDuaTuan", "NhatKyChamDiem"
    ];

    const promises = tables.map(async (table) => {
      const { data, error } = await supabase.from(table).select("*");
      if (error) throw error;
      return { table, data: data || [] };
    });

    const results = await Promise.all(promises);
    const state: any = {};
    results.forEach(r => {
      state[r.table] = r.data;
    });

    if (state.DanhMucLop && state.DanhMucLop.length > 0) {
      console.log("Tải dữ liệu từ Supabase thành công!");
      return state as DatabaseState;
    }
    return null;
  } catch (e) {
    console.error("Supabase load error:", e);
    return null;
  }
}

// Tái tính toán điểm số và thứ hạng tự động
export function recalculateAllWeeks(state: DatabaseState): DatabaseState {
  const viPhams = state.ChiTietViPhamHocSinh;
  let thanhTichs = state.ChiTietThanhTichHocSinh.filter(t => t.MaTieuChi !== 105);
  const classes = state.DanhMucLop;
  const criteria = state.QuyDinhThiDua;
  const weeks = state.DanhMucTuan;

  let nextTtId = thanhTichs.length > 0 ? Math.max(...thanhTichs.map(t => t.MaChiTietThanhTich)) + 1 : 1;

  // Tự động chèn 'Đạt buổi học tốt' (105)
  weeks.forEach(tuan => {
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
            MaTieuChi: 105,
            MaTuan: weekId,
            ThuTrongTuan: thu,
            MonHoc: "Học tập",
            MaNguoiDungGhiNhan: 1,
            GhiChu: `Tự động đạt: Đủ ${countTot}/${maxP} tiết Tốt`
          });
        }
      }
    });
  });

  const nhatKyViPham: any[] = [];
  const thanhTichTuan: any[] = [];
  const tongKetTuan: any[] = [];

  let nkId = 1;
  let tttId = 1;
  let tkId = 1;

  weeks.forEach(tuan => {
    const weekId = tuan.MaTuan;

    // 1. Tổng hợp điểm trừ hàng ngày
    classes.forEach(lop => {
      const lopVps = viPhams.filter(v => v.MaLop === lop.MaLop && v.MaTuan === weekId);
      const groupedVps: Record<string, any> = {};

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

    // 2. Tổng hợp điểm cộng hàng ngày
    classes.forEach(lop => {
      const lopTts = thanhTichs.filter(t => t.MaLop === lop.MaLop && t.MaTuan === weekId);
      const groupedTts: Record<string, any> = {};

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

    // 3. Tổng kết điểm thi đua tuần và Xếp Hạng
    const classScores: any[] = [];
    classes.forEach(lop => {
      const totalMinus = nhatKyViPham
        .filter(nk => nk.MaLop === lop.MaLop && nk.MaTuan === weekId)
        .reduce((sum, item) => sum + item.TongDiemTruPhatSinh, 0);

      const totalPlus = thanhTichTuan
        .filter(tt => tt.MaLop === lop.MaLop && tt.MaTuan === weekId)
        .reduce((sum, item) => sum + item.TongDiemCongPhatSinh, 0);

      const finalScore = (lop.BaseScore || 100) + totalPlus - totalMinus;

      classScores.push({
        MaLop: lop.MaLop,
        DiemGoc: lop.BaseScore || 100,
        TongDiemCong: totalPlus,
        TongDiemTru: totalMinus,
        DiemTongKet: finalScore
      });
    });

    classScores.sort((a, b) => b.DiemTongKet - a.DiemTongKet);
    let activeRank = 1;
    let prevScore: number | null = null;

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

  return {
    ...state,
    ChiTietThanhTichHocSinh: thanhTichs,
    NhatKyViPhamHangNgay: nhatKyViPham,
    ThanhTichHocTapTheoTuan: thanhTichTuan,
    TongKetThiDuaTuan: tongKetTuan
  };
}

// Đồng bộ bảng đơn lẻ lên Supabase
export async function syncTableToSupabase(dbTable: string, pkName: string, data: any[], useUpsert: boolean = false) {
  try {
    console.log(`[Sync] Đang đồng bộ bảng ${dbTable} lên Supabase (${data.length} bản ghi)...`);
    if (useUpsert) {
      if (data.length > 0) {
        const { error } = await supabase.from(dbTable).upsert(data);
        if (error) throw error;
      }
    } else {
      const { error: deleteError } = await supabase.from(dbTable).delete().gte(pkName, 1);
      if (deleteError) throw deleteError;
      
      if (data.length > 0) {
        const { error: insertError } = await supabase.from(dbTable).insert(data);
        if (insertError) throw insertError;
      }
    }
    console.log(`[Sync] Đồng bộ bảng ${dbTable} THÀNH CÔNG!`);
  } catch (err: any) {
    console.error(`[Sync Error] Không thể đồng bộ bảng ${dbTable}:`, err.message);
  }
}

// Đồng bộ toàn bộ bảng giao dịch chi tiết và tổng hợp
export function syncAllTransactionData(state: DatabaseState) {
  syncTableToSupabase("ChiTietViPhamHocSinh", "MaChiTiet", state.ChiTietViPhamHocSinh);
  syncTableToSupabase("ChiTietThanhTichHocSinh", "MaChiTietThanhTich", state.ChiTietThanhTichHocSinh);
  syncTableToSupabase("NhatKyViPhamHangNgay", "MaNhatKy", state.NhatKyViPhamHangNgay);
  syncTableToSupabase("ThanhTichHocTapTheoTuan", "MaThanhTich", state.ThanhTichHocTapTheoTuan);
  syncTableToSupabase("TongKetThiDuaTuan", "MaTongKet", state.TongKetThiDuaTuan);
  syncTableToSupabase("NhatKyChamDiem", "MaNhatKy", state.NhatKyChamDiem);
}
