"use client";

import React, { useState, useEffect, useMemo, ChangeEvent, FormEvent } from 'react';
import { 
  DatabaseState, 
  fetchSupabaseData, 
  fetchLocalFallback, 
  recalculateAllWeeks, 
  syncTableToSupabase, 
  syncAllTransactionData 
} from '@/lib/databaseService';

export default function Home() {
  const [dbState, setDbState] = useState<DatabaseState | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [currentWeekId, setCurrentWeekId] = useState(1);
  const [currentRole, setCurrentRole] = useState("ADMIN");
  const [searchTerm, setSearchTerm] = useState("");

  // Tab 2: Scoring states
  const [scoringLopId, setScoringLopId] = useState<number | null>(null);
  const [matrixState, setMatrixState] = useState<Record<string, any>>({});

  // Tab 3: Violation Summary states
  const [summaryLopId, setSummaryLopId] = useState<number | null>(null);

  // Tab 4: Assignments states
  const [editAssigns, setEditAssigns] = useState<any[]>([]);
  const [newAssignCodoId, setNewAssignCodoId] = useState<number | null>(null);
  const [newAssignLopId, setNewAssignLopId] = useState<number | null>(null);

  // Tab 5: Emulation Regulations states
  const [newCriterionContent, setNewCriterionContent] = useState("");
  const [newCriterionType, setNewCriterionType] = useState<"TRU" | "CONG">("TRU");
  const [newCriterionScore, setNewCriterionScore] = useState<number | "">("");
  const [newCriterionUnit, setNewCriterionUnit] = useState("");
  const [editingCriterionId, setEditingCriterionId] = useState<number | null>(null);

  // Tab 6: Students states
  const [selectedClassId, setSelectedClassId] = useState<number>(5); // 11A as default
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentDob, setNewStudentDob] = useState("");
  const [newStudentGender, setNewStudentGender] = useState<"Nam" | "Nữ">("Nam");
  const [editingStudentId, setEditingStudentId] = useState<number | null>(null);

  // Tab: Weeks states
  const [editWeeks, setEditWeeks] = useState<any[]>([]);

  // Tab: Classes states
  const [editClasses, setEditClasses] = useState<any[]>([]);

  // Import Student states
  const [importPreviewData, setImportPreviewData] = useState<any[]>([]);
  const [importFileName, setImportFileName] = useState("");
  const [importError, setImportError] = useState("");

  // Dialog overlays states
  const [activeDialog, setActiveDialog] = useState<string | null>(null); // "alert", "assign", "violation-detail", "student-detail"
  const [violationDetailRows, setViolationDetailRows] = useState<any[]>([]);
  const [violationDetailTitle, setViolationDetailTitle] = useState("");
  const [studentDetailRows, setStudentDetailRows] = useState<any[]>([]);
  const [studentDetailTitle, setStudentDetailTitle] = useState("");

  // 1. Tải dữ liệu lúc khởi động trang
  useEffect(() => {
    async function loadData() {
      let state = await fetchSupabaseData();
      if (!state) {
        state = await fetchLocalFallback();
      }
      if (state) {
        // Tái tính toán điểm số thi đua
        const computed = recalculateAllWeeks(state);
        setDbState(computed);
      }
      setLoading(false);
    }
    loadData();
  }, []);

  // Đọc danh sách người dùng tương ứng với vai trò đóng vai
  const currentUser = useMemo(() => {
    if (!dbState) return null;
    const users = dbState.NguoiDung;
    if (currentRole === "ADMIN") {
      return users.find(u => u.VaiTro === "ADMIN") || users[0];
    } else if (currentRole === "CO_DO") {
      return users.find(u => u.VaiTro === "CO_DO" && u.HoTen === "Trịnh Đức Minh") || users[1];
    } else if (currentRole === "GIAO_VIEN") {
      return users.find(u => u.VaiTro === "GIAO_VIEN" && u.MaLop === 5) || users[2];
    } else {
      return users.find(u => u.VaiTro === "HOC_SINH" && u.MaLop === 5) || users[3];
    }
  }, [currentRole, dbState]);

  // Khởi động bảng phân công trực tạm thời khi tuần thay đổi
  useEffect(() => {
    if (!dbState) return;
    const weekAssigns = dbState.PhanCongCoDo.filter(a => a.MaTuan === currentWeekId);
    setEditAssigns(JSON.parse(JSON.stringify(weekAssigns)));
  }, [currentWeekId, dbState, activeTab]);

  // Khởi động bảng danh mục tuần & lớp tạm thời khi activeTab hoặc dbState thay đổi
  useEffect(() => {
    if (!dbState) return;
    
    // Khởi động tuần
    const sortedWeeks = [...dbState.DanhMucTuan].sort((a, b) => a.MaTuan - b.MaTuan);
    if (currentRole === "ADMIN") {
      const lastRow = sortedWeeks[sortedWeeks.length - 1];
      if (!lastRow || (lastRow.TenTuan && lastRow.NgayBatDau && lastRow.NgayKetThuc)) {
        const nextId = sortedWeeks.length > 0 ? Math.max(...sortedWeeks.map(w => w.MaTuan)) + 1 : 1;
        sortedWeeks.push({ MaTuan: nextId, TenTuan: "", NgayBatDau: "", NgayKetThuc: "", isNew: true });
      }
    }
    setEditWeeks(sortedWeeks);

    // Khởi động lớp
    const sortedClasses = [...dbState.DanhMucLop].sort((a, b) => a.MaLop - b.MaLop);
    if (currentRole === "ADMIN") {
      const lastRow = sortedClasses[sortedClasses.length - 1];
      if (!lastRow || (lastRow.TenLop && lastRow.Khoi && lastRow.NamHoc && lastRow.BaseScore !== undefined)) {
        const nextId = sortedClasses.length > 0 ? Math.max(...sortedClasses.map(c => c.MaLop)) + 1 : 1;
        sortedClasses.push({ MaLop: nextId, TenLop: "", Khoi: 10, NamHoc: "2025-2026", BaseScore: 100, isNew: true });
      }
    }
    setEditClasses(sortedClasses);
  }, [dbState, activeTab, currentRole]);

  // Khởi động và cập nhật ma trận chấm điểm dựa trên Lớp và Tuần được chọn ở Tab 2
  useEffect(() => {
    if (!dbState || !scoringLopId) return;
    const viPhams = dbState.ChiTietViPhamHocSinh;
    const thanhTichs = dbState.ChiTietThanhTichHocSinh;
    
    const newMatrixState: Record<string, any> = {};

    // Tải các lỗi vi phạm của tuần và lớp hiện tại
    viPhams.filter(v => v.MaLop === scoringLopId && v.MaTuan === currentWeekId).forEach(v => {
      const key = `${v.MaTieuChi}_${v.ThuTrongTuan}`;
      const isClassInfraction = !dbState.QuyDinhThiDua.find(c => c.MaTieuChi === v.MaTieuChi)?.DonViTinh.includes("/HS");
      if (isClassInfraction) {
        newMatrixState[key] = true;
      } else {
        if (!Array.isArray(newMatrixState[key])) {
          newMatrixState[key] = [];
        }
        if (v.MaHocSinh && !newMatrixState[key].includes(v.MaHocSinh)) {
          newMatrixState[key].push(v.MaHocSinh);
        }
      }
    });

    // Tải các thành tích
    thanhTichs.filter(t => t.MaLop === scoringLopId && t.MaTuan === currentWeekId).forEach(t => {
      const key = `${t.MaTieuChi}_${t.ThuTrongTuan}`;
      const tc = dbState.QuyDinhThiDua.find(c => c.MaTieuChi === t.MaTieuChi);
      const isStudentAchievement = t.MaTieuChi === 101 || t.MaTieuChi === 102 || tc?.DonViTinh.includes("/HS");
      if (isStudentAchievement) {
        if (!Array.isArray(newMatrixState[key])) {
          newMatrixState[key] = [];
        }
        if (t.MaHocSinh && !newMatrixState[key].includes(t.MaHocSinh)) {
          newMatrixState[key].push(t.MaHocSinh);
        }
      } else if (t.MaTieuChi !== 105) {
        newMatrixState[key] = (newMatrixState[key] || 0) + 1;
      }
    });

    setMatrixState(newMatrixState);
  }, [scoringLopId, currentWeekId, dbState]);

  // 2. Logic cho TAB 1: BẢNG XẾP HẠNG
  const rankingList = useMemo(() => {
    if (!dbState) return [];
    const summaries = dbState.TongKetThiDuaTuan.filter(s => s.MaTuan === currentWeekId);
    return summaries.map(s => {
      const lop = dbState.DanhMucLop.find(c => c.MaLop === s.MaLop);
      return {
        ...s,
        TenLop: lop ? lop.TenLop : "Không rõ",
        Khoi: lop ? lop.Khoi : 10
      };
    }).sort((a, b) => a.XepHang - b.XepHang);
  }, [currentWeekId, dbState]);

  const topRankings = useMemo(() => {
    return rankingList.slice(0, 3);
  }, [rankingList]);

  const normalRankings = useMemo(() => {
    return rankingList.slice(3);
  }, [rankingList]);

  // Thống kê lỗi vi phạm nhiều nhất ở trang chính
  const penaltiesStats = useMemo(() => {
    if (!dbState) return [];
    const weekVps = dbState.ChiTietViPhamHocSinh.filter(v => v.MaTuan === currentWeekId);
    const countMap: Record<number, number> = {};
    weekVps.forEach(v => {
      countMap[v.MaTieuChi] = (countMap[v.MaTieuChi] || 0) + 1;
    });
    return Object.keys(countMap).map(id => {
      const tcId = parseInt(id);
      const tc = dbState.QuyDinhThiDua.find(c => c.MaTieuChi === tcId);
      return {
        id: tcId,
        name: tc ? tc.NoiDung : "Vi phạm",
        count: countMap[tcId],
        score: tc ? tc.DiemChuyenDoi * countMap[tcId] : 0
      };
    }).sort((a, b) => b.count - a.count).slice(0, 5);
  }, [currentWeekId, dbState]);

  // Thống kê thành tích nổi bật ở trang chính
  const achievementsStats = useMemo(() => {
    if (!dbState) return [];
    const weekTts = dbState.ChiTietThanhTichHocSinh.filter(t => t.MaTuan === currentWeekId);
    const countMap: Record<number, number> = {};
    weekTts.forEach(t => {
      countMap[t.MaTieuChi] = (countMap[t.MaTieuChi] || 0) + 1;
    });
    return Object.keys(countMap).map(id => {
      const tcId = parseInt(id);
      const tc = dbState.QuyDinhThiDua.find(c => c.MaTieuChi === tcId);
      return {
        id: tcId,
        name: tc ? tc.NoiDung : "Thành tích",
        count: countMap[tcId],
        score: tc ? tc.DiemChuyenDoi * countMap[tcId] : 0
      };
    }).sort((a, b) => b.count - a.count).slice(0, 5);
  }, [currentWeekId, dbState]);

  // Thống kê nhật ký chấm điểm gần đây
  const recentLogs = useMemo(() => {
    if (!dbState || !dbState.NhatKyChamDiem) return [];
    const weekLogs = dbState.NhatKyChamDiem.filter(n => n.MaTuan === currentWeekId);
    return [...weekLogs].sort((a, b) => b.MaNhatKy - a.MaNhatKy).slice(0, 5);
  }, [currentWeekId, dbState]);

  // Xem chi tiết người vi phạm của tiêu chí
  const handleShowViolationDetail = (criterionId: number, criterionName: string) => {
    if (!dbState) return;
    const targetVps = dbState.ChiTietViPhamHocSinh.filter(v => v.MaTuan === currentWeekId && v.MaTieuChi === criterionId && v.MaHocSinh !== null);
    const studentVpMap: Record<number, number> = {};
    targetVps.forEach(v => {
      if (v.MaHocSinh) {
        studentVpMap[v.MaHocSinh] = (studentVpMap[v.MaHocSinh] || 0) + 1;
      }
    });

    const rows = Object.keys(studentVpMap).map(hsId => {
      const studentId = parseInt(hsId);
      const student = dbState.DanhSachHocSinh.find(s => s.MaHocSinh === studentId);
      const lop = student ? dbState.DanhMucLop.find(c => c.MaLop === student.MaLop) : null;
      return {
        hoTen: student ? student.HoTen : "Không rõ",
        tenLop: lop ? lop.TenLop : "Không rõ",
        soLuong: studentVpMap[studentId]
      };
    }).sort((a, b) => b.soLuong - a.soLuong);

    setViolationDetailRows(rows);
    setViolationDetailTitle(`Chi Tiết Vi Phạm: ${criterionName}`);
    setActiveDialog("violation-detail");
  };

  // 3. Logic cho TAB 2: GHI SỔ TRỰC
  const scoringClasses = useMemo(() => {
    if (!dbState) return [];
    if (currentRole === "CO_DO" && currentUser) {
      const myAssigns = dbState.PhanCongCoDo.filter(a => a.MaNguoiDung === currentUser.MaNguoiDung && a.MaTuan === currentWeekId);
      return dbState.DanhMucLop.filter(c => myAssigns.some(a => a.MaLop === c.MaLop));
    }
    return dbState.DanhMucLop;
  }, [currentRole, currentUser, currentWeekId, dbState]);

  // Tự động chọn lớp đầu tiên của cờ đỏ
  useEffect(() => {
    if (scoringClasses.length > 0) {
      setScoringLopId(scoringClasses[0].MaLop);
    } else {
      setScoringLopId(null);
    }
  }, [scoringClasses]);

  const scoringCriteria = useMemo(() => {
    if (!dbState) return { violations: [], achievements: [] };
    const list = dbState.QuyDinhThiDua.filter(c => c.is_active !== false);
    return {
      violations: list.filter(c => c.Loai === "TRU"),
      achievements: list.filter(c => c.Loai === "CONG")
    };
  }, [dbState]);

  const currentClassStudents = useMemo(() => {
    if (!dbState || !scoringLopId) return [];
    return dbState.DanhSachHocSinh.filter(s => s.MaLop === scoringLopId);
  }, [scoringLopId, dbState]);

  // Thay đổi checkbox tập thể
  const handleMatrixCheckboxChange = (key: string, checked: boolean) => {
    setMatrixState(prev => ({
      ...prev,
      [key]: checked
    }));
  };

  // Thay đổi bộ chọn học sinh (Thành tích hoặc Vi phạm)
  const handleMatrixSelectStudent = (key: string, val: string) => {
    if (!val) return;
    const hsId = parseInt(val);
    setMatrixState(prev => {
      const currentList = Array.isArray(prev[key]) ? prev[key] : [];
      if (!currentList.includes(hsId)) {
        return {
          ...prev,
          [key]: [...currentList, hsId]
        };
      }
      return prev;
    });
  };

  // Xóa học sinh khỏi pill
  const handleMatrixRemoveStudent = (key: string, hsId: number) => {
    setMatrixState(prev => {
      const currentList = Array.isArray(prev[key]) ? prev[key] : [];
      return {
        ...prev,
        [key]: currentList.filter(id => id !== hsId)
      };
    });
  };

  // Bộ đếm điểm cộng
  const handleMatrixCounter = (key: string, type: "inc" | "dec", maxP: number) => {
    setMatrixState(prev => {
      const currentVal = prev[key] || 0;
      if (type === "dec" && currentVal > 0) {
        return { ...prev, [key]: currentVal - 1 };
      } else if (type === "inc" && currentVal < maxP) {
        return { ...prev, [key]: currentVal + 1 };
      }
      return prev;
    });
  };

  // Lưu điểm ma trận chấm
  const handleSaveMatrixData = () => {
    if (!dbState || !scoringLopId) {
      alert("Vui lòng chọn đầy đủ Tuần và Lớp học trước khi lưu!");
      return;
    }

    const criteria = dbState.QuyDinhThiDua;
    let viPhams = [...dbState.ChiTietViPhamHocSinh];
    let thanhTichs = [...dbState.ChiTietThanhTichHocSinh];
    const students = dbState.DanhSachHocSinh;
    const classStudents = students.filter(s => s.MaLop === scoringLopId);

    let nhatKys = [...(dbState.NhatKyChamDiem || [])];

    // Xóa ghi chép cũ của lớp và tuần này
    viPhams = viPhams.filter(v => !(v.MaLop === scoringLopId && v.MaTuan === currentWeekId));
    thanhTichs = thanhTichs.filter(t => !(t.MaLop === scoringLopId && t.MaTuan === currentWeekId));
    nhatKys = nhatKys.filter(l => !(l.MaLop === scoringLopId && l.MaTuan === currentWeekId));

    let nextVpId = viPhams.length > 0 ? Math.max(...viPhams.map(v => v.MaChiTiet)) + 1 : 1;
    let nextTtId = thanhTichs.length > 0 ? Math.max(...thanhTichs.map(t => t.MaChiTietThanhTich)) + 1 : 1;
    let nextNkId = nhatKys.length > 0 ? Math.max(...nhatKys.map(n => n.MaNhatKy)) + 1 : 1;

    for (const [key, value] of Object.entries(matrixState)) {
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
              MaLop: scoringLopId,
              MaHocSinh: null,
              MaTieuChi: tcId,
              MaTuan: currentWeekId,
              ThuTrongTuan: thu,
              MaNguoiDungGhiNhan: currentUser?.MaNguoiDung || 1,
              GhiChuChiTiet: `Vi phạm tập thể: ${tc.NoiDung}`
            });

            nhatKys.push({
              MaNhatKy: nextNkId++,
              MaNguoiDung: currentUser?.MaNguoiDung || 1,
              MaLop: scoringLopId,
              MaTuan: currentWeekId,
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
                MaLop: scoringLopId,
                MaHocSinh: hsId,
                MaTieuChi: tcId,
                MaTuan: currentWeekId,
                ThuTrongTuan: thu,
                MaNguoiDungGhiNhan: currentUser?.MaNguoiDung || 1,
                GhiChuChiTiet: `Cá nhân vi phạm: ${tc.NoiDung}`
              });

              const hs = classStudents.find(s => s.MaHocSinh === hsId);
              const targetName = hs ? hs.HoTen : `Học sinh #${hsId}`;
              nhatKys.push({
                MaNhatKy: nextNkId++,
                MaNguoiDung: currentUser?.MaNguoiDung || 1,
                MaLop: scoringLopId,
                MaTuan: currentWeekId,
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
                MaLop: scoringLopId,
                MaHocSinh: hsId,
                MaTieuChi: tcId,
                MaTuan: currentWeekId,
                ThuTrongTuan: thu,
                MonHoc: "Học tập",
                MaNguoiDungGhiNhan: currentUser?.MaNguoiDung || 1,
                GhiChu: `Đạt thành tích: ${tc.NoiDung}`
              });

              const hs = classStudents.find(s => s.MaHocSinh === hsId);
              const targetName = hs ? hs.HoTen : `Học sinh #${hsId}`;
              nhatKys.push({
                MaNhatKy: nextNkId++,
                MaNguoiDung: currentUser?.MaNguoiDung || 1,
                MaLop: scoringLopId,
                MaTuan: currentWeekId,
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
                MaLop: scoringLopId,
                MaHocSinh: null,
                MaTieuChi: tcId,
                MaTuan: currentWeekId,
                ThuTrongTuan: thu,
                MonHoc: "Bộ môn",
                MaNguoiDungGhiNhan: currentUser?.MaNguoiDung || 1,
                GhiChu: `Tập thể đạt: ${tc.NoiDung}`
              });

              nhatKys.push({
                MaNhatKy: nextNkId++,
                MaNguoiDung: currentUser?.MaNguoiDung || 1,
                MaLop: scoringLopId,
                MaTuan: currentWeekId,
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

    const updatedState = recalculateAllWeeks({
      ...dbState,
      ChiTietViPhamHocSinh: viPhams,
      ChiTietThanhTichHocSinh: thanhTichs
    });
    updatedState.NhatKyChamDiem = nhatKys;

    setDbState(updatedState);
    
    // Lưu vào LocalStorage
    localStorage.setItem("TDHD_ChiTietViPhamHocSinh", JSON.stringify(updatedState.ChiTietViPhamHocSinh));
    localStorage.setItem("TDHD_ChiTietThanhTichHocSinh", JSON.stringify(updatedState.ChiTietThanhTichHocSinh));
    localStorage.setItem("TDHD_NhatKyChamDiem", JSON.stringify(updatedState.NhatKyChamDiem));
    
    // Đồng bộ Supabase
    syncAllTransactionData(updatedState);

    alert("Đã lưu và tổng hợp toàn bộ bảng ma trận thi đua thành công!");
  };

  // 4. Logic cho TAB 3: TỔNG HỢP VI PHẠM HÀNG NGÀY
  const dailySummaryMatrix = useMemo(() => {
    if (!dbState || !summaryLopId) return [];
    const list = dbState.QuyDinhThiDua.filter(c => c.Loai === "TRU" && c.is_active !== false);
    const nhatKy = dbState.NhatKyViPhamHangNgay.filter(nk => nk.MaLop === summaryLopId && nk.MaTuan === currentWeekId);
    
    return list.map(tc => {
      const dailyQty: Record<number, number> = {};
      let rowTotal = 0;
      for (let thu = 2; thu <= 7; thu++) {
        const log = nhatKy.find(nk => nk.MaTieuChi === tc.MaTieuChi && nk.ThuTrongTuan === thu);
        const qty = log ? log.SoLuong : 0;
        dailyQty[thu] = qty;
        rowTotal += qty;
      }
      return {
        ...tc,
        dailyQty,
        rowTotal
      };
    });
  }, [summaryLopId, currentWeekId, dbState]);

  const summaryGrandTotal = useMemo(() => {
    if (!dbState || !summaryLopId) return 0;
    const nhatKy = dbState.NhatKyViPhamHangNgay.filter(nk => nk.MaLop === summaryLopId && nk.MaTuan === currentWeekId);
    return nhatKy.reduce((sum, item) => sum + item.TongDiemTruPhatSinh, 0);
  }, [summaryLopId, currentWeekId, dbState]);

  // Tự động chọn lớp đầu tiên cho tab tổng hợp
  useEffect(() => {
    if (dbState && dbState.DanhMucLop.length > 0 && !summaryLopId) {
      setSummaryLopId(dbState.DanhMucLop[0].MaLop);
    }
  }, [dbState, summaryLopId]);

  // 5. Logic cho TAB 4: PHÂN CÔNG CO ĐỎ TRỰC
  const handleDeleteAssign = (assignId: number) => {
    setEditAssigns(prev => prev.filter(a => a.MaPhanCong !== assignId));
  };

  const handleSaveAssignments = () => {
    if (!dbState) return;
    const users = dbState.NguoiDung;

    // Ràng buộc 1: Cờ đỏ không chấm lớp mình
    let hasSafetyViolation = false;
    editAssigns.forEach(a => {
      const codo = users.find(u => u.MaNguoiDung === a.MaNguoiDung);
      if (codo && codo.MaLop === a.MaLop) {
        hasSafetyViolation = true;
      }
    });

    if (hasSafetyViolation) {
      setActiveDialog("alert");
      return;
    }

    // Ràng buộc 2: Một cờ đỏ chỉ chấm một lớp mỗi tuần
    const codoIds = editAssigns.map(a => a.MaNguoiDung);
    const uniqueCodoIds = new Set(codoIds);
    if (codoIds.length !== uniqueCodoIds.size) {
      alert("Lỗi: Phát hiện học sinh Cờ đỏ được phân công chấm nhiều hơn 1 lớp trong tuần này! Vui lòng sửa lại.");
      return;
    }

    // Thay thế phân công cũ trên tuần này
    let allAssigns = [...dbState.PhanCongCoDo];
    allAssigns = allAssigns.filter(a => a.MaTuan !== currentWeekId);
    allAssigns = [...allAssigns, ...editAssigns];

    const updatedState = {
      ...dbState,
      PhanCongCoDo: allAssigns
    };

    setDbState(updatedState);
    localStorage.setItem("TDHD_PhanCongCoDo", JSON.stringify(allAssigns));
    
    // Đồng bộ Supabase
    syncTableToSupabase("PhanCongCoDo", "MaPhanCong", allAssigns);

    alert("Đã lưu và cập nhật lịch phân công trực tuần này thành công!");
  };

  // Thêm dòng phân công trực mới từ Dialog
  const handleAddNewAssign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAssignCodoId || !newAssignLopId) {
      alert("Vui lòng chọn đầy đủ Cờ đỏ và Lớp chấm chéo!");
      return;
    }

    setEditAssigns(prev => {
      const maxId = prev.length > 0 ? Math.max(...prev.map(a => a.MaPhanCong)) + 1 : 1;
      return [
        ...prev,
        {
          MaPhanCong: maxId,
          MaNguoiDung: newAssignCodoId,
          MaTuan: currentWeekId,
          MaLop: newAssignLopId
        }
      ];
    });

    setActiveDialog(null);
    setNewAssignCodoId(null);
    setNewAssignLopId(null);
  };

  // 6. Logic cho TAB 5: QUY ĐỊNH THI ĐUA
  const handleToggleCriterion = (tcId: number) => {
    if (!dbState) return;
    const allCriteria = dbState.QuyDinhThiDua.map(c => {
      if (c.MaTieuChi === tcId) {
        return { ...c, is_active: c.is_active === false ? true : false };
      }
      return c;
    });

    setDbState({
      ...dbState,
      QuyDinhThiDua: allCriteria
    });
  };

  const handleAddNewCriterion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dbState) return;
    if (currentRole !== "ADMIN") return;

    const content = newCriterionContent.trim();
    const type = newCriterionType;
    const score = Number(newCriterionScore);
    const unit = newCriterionUnit.trim();

    if (!content || !type || isNaN(score) || !unit) {
      alert("Vui lòng nhập đầy đủ các trường thông tin!");
      return;
    }

    let allCriteria = [...dbState.QuyDinhThiDua];

    if (editingCriterionId !== null) {
      // Sửa tiêu chí
      allCriteria = allCriteria.map(c => {
        if (c.MaTieuChi === editingCriterionId) {
          return {
            ...c,
            NoiDung: content,
            Loai: type,
            DiemChuyenDoi: score,
            DonViTinh: unit
          };
        }
        return c;
      });
    } else {
      // Thêm tiêu chí mới
      const nextId = allCriteria.length > 0 
        ? Math.max(...allCriteria.map(c => c.MaTieuChi)) + 1 
        : 1;

      const newCriterion = {
        MaTieuChi: nextId,
        NoiDung: content,
        Loai: type,
        DiemChuyenDoi: score,
        DonViTinh: unit,
        is_active: true
      };

      allCriteria.push(newCriterion);
    }

    setDbState({
      ...dbState,
      QuyDinhThiDua: allCriteria
    });

    // Reset inputs & close dialog
    setNewCriterionContent("");
    setNewCriterionType("TRU");
    setNewCriterionScore("");
    setNewCriterionUnit("");
    setEditingCriterionId(null);
    setActiveDialog(null);
  };

  const handleEditCriterionClick = (row: any) => {
    setEditingCriterionId(row.MaTieuChi);
    setNewCriterionContent(row.NoiDung);
    setNewCriterionType(row.Loai);
    setNewCriterionScore(row.DiemChuyenDoi);
    setNewCriterionUnit(row.DonViTinh);
    setActiveDialog("add-criterion");
  };

  const handleDeleteCriterionClick = (row: any) => {
    if (!dbState) return;
    if (confirm(`Bạn có chắc chắn muốn xóa tiêu chí "REQ_${row.MaTieuChi.toString().padStart(3, '0')} - ${row.NoiDung}" này?`)) {
      const allCriteria = dbState.QuyDinhThiDua.filter(c => c.MaTieuChi !== row.MaTieuChi);
      setDbState({
        ...dbState,
        QuyDinhThiDua: allCriteria
      });
    }
  };

  const handleSaveRegulations = () => {
    if (!dbState) return;
    if (currentRole !== "ADMIN") return;

    localStorage.setItem("TDHD_QuyDinhThiDua", JSON.stringify(dbState.QuyDinhThiDua));
    
    // Đồng bộ lên Supabase
    syncTableToSupabase("QuyDinhThiDua", "MaTieuChi", dbState.QuyDinhThiDua, true);
    
    alert("Đã lưu và đồng bộ toàn bộ quy chế thi đua học đường thành công!");
  };

  const handleAddNewStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dbState) return;
    if (currentRole !== "ADMIN") return;

    const name = newStudentName.trim();
    const dobVal = newStudentDob;
    const gender = newStudentGender;

    if (!name || !dobVal || !gender) {
      alert("Vui lòng nhập đầy đủ các trường thông tin!");
      return;
    }

    // Convert YYYY-MM-DD to DD/MM/YYYY
    const [year, month, day] = dobVal.split("-");
    const dobFormatted = `${day}/${month}/${year}`;

    let allStudents = [...dbState.DanhSachHocSinh];

    if (editingStudentId !== null) {
      // Sửa học sinh
      allStudents = allStudents.map(s => {
        if (s.MaHocSinh === editingStudentId) {
          return {
            ...s,
            HoTen: name,
            NgaySinh: dobFormatted,
            GioiTinh: gender
          };
        }
        return s;
      });
    } else {
      // Thêm học sinh mới
      const nextId = allStudents.length > 0 
        ? Math.max(...allStudents.map(s => s.MaHocSinh)) + 1 
        : 1;

      const newStudent = {
        MaHocSinh: nextId,
        HoTen: name,
        MaLop: selectedClassId,
        NgaySinh: dobFormatted,
        GioiTinh: gender,
        is_active: true
      };

      allStudents.push(newStudent);
    }

    setDbState({
      ...dbState,
      DanhSachHocSinh: allStudents
    });

    // Reset inputs & close dialog
    setNewStudentName("");
    setNewStudentDob("");
    setNewStudentGender("Nam");
    setEditingStudentId(null);
    setActiveDialog(null);
  };

  const handleEditStudentClick = (student: any) => {
    setEditingStudentId(student.MaHocSinh);
    setNewStudentName(student.HoTen);
    setNewStudentGender(student.GioiTinh === "Nữ" ? "Nữ" : "Nam");
    
    // Convert DD/MM/YYYY to YYYY-MM-DD
    const parts = student.NgaySinh.split("/");
    if (parts.length === 3) {
      setNewStudentDob(`${parts[2]}-${parts[1]}-${parts[0]}`);
    } else {
      setNewStudentDob("");
    }
    setActiveDialog("add-student");
  };

  const handleToggleStudent = (studentId: number) => {
    if (!dbState) return;
    const allStudents = dbState.DanhSachHocSinh.map(s => {
      if (s.MaHocSinh === studentId) {
        return { ...s, is_active: s.is_active === false ? true : false };
      }
      return s;
    });

    setDbState({
      ...dbState,
      DanhSachHocSinh: allStudents
    });
  };

  const handleDeleteStudentClick = (student: any) => {
    if (!dbState) return;
    if (confirm(`Bạn có chắc chắn muốn xóa học sinh "${student.HoTen}" khỏi danh sách?`)) {
      const allStudents = dbState.DanhSachHocSinh.filter(s => s.MaHocSinh !== student.MaHocSinh);
      setDbState({
        ...dbState,
        DanhSachHocSinh: allStudents
      });
    }
  };

  const handleSaveStudents = () => {
    if (!dbState) return;
    if (currentRole !== "ADMIN") return;

    localStorage.setItem("TDHD_DanhSachHocSinh", JSON.stringify(dbState.DanhSachHocSinh));
    
    // Đồng bộ lên Supabase
    syncTableToSupabase("DanhSachHocSinh", "MaHocSinh", dbState.DanhSachHocSinh, true);
    
    alert("Đã lưu và đồng bộ danh sách học sinh thành công!");
  };

  const handleDownloadTemplate = () => {
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
  };

  const handleImportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFileName(file.name);
    setImportError("");
    setImportPreviewData([]);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) {
          setImportError("File trống hoặc không hợp lệ!");
          return;
        }

        // Parse CSV
        let lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
        if (lines.length === 0) {
          setImportError("File không có dữ liệu!");
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
          setImportError("File không có dữ liệu!");
          return;
        }

        const parsedList: any[] = [];
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i];
          if (!line) continue;

          const cols = line.split(delimiter).map(c => c.replace(/^["']|["']$/g, '').trim());
          if (cols.length < 3) continue;

          const hoTen = cols[0];
          const ngaySinh = cols[1];
          const gioiTinh = cols[2];

          if (!hoTen || !ngaySinh || !gioiTinh) continue;

          // Validate date format DD/MM/YYYY
          const dobRegex = /^\d{1,2}\/\d{1,2}\/\d{4}$/;
          if (!dobRegex.test(ngaySinh)) {
            setImportError(`Dòng số ${i + 1}: Ngày sinh "${ngaySinh}" không đúng định dạng DD/MM/YYYY!`);
            return;
          }

          // Validate gender
          if (gioiTinh !== "Nam" && gioiTinh !== "Nữ") {
            setImportError(`Dòng số ${i + 1}: Giới tính "${gioiTinh}" phải là "Nam" hoặc "Nữ"!`);
            return;
          }

          parsedList.push({
            HoTen: hoTen,
            NgaySinh: ngaySinh,
            GioiTinh: gioiTinh
          });
        }

        if (parsedList.length === 0) {
          setImportError("Không tìm thấy học sinh hợp lệ để import!");
        } else {
          setImportPreviewData(parsedList);
        }
      } catch (err) {
        setImportError("Có lỗi xảy ra khi đọc file!");
      }
    };
    reader.readAsText(file, "UTF-8");
  };

  const handleImportStudentsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dbState || importPreviewData.length === 0) return;

    let nextId = dbState.DanhSachHocSinh.length > 0 ? Math.max(...dbState.DanhSachHocSinh.map(s => s.MaHocSinh)) + 1 : 1;
    const newStudents = importPreviewData.map(item => ({
      MaHocSinh: nextId++,
      HoTen: item.HoTen,
      MaLop: selectedClassId,
      NgaySinh: item.NgaySinh,
      GioiTinh: item.GioiTinh,
      is_active: true
    }));

    setDbState({
      ...dbState,
      DanhSachHocSinh: [...dbState.DanhSachHocSinh, ...newStudents]
    });

    setActiveDialog(null);
    setImportPreviewData([]);
    setImportFileName("");
    setImportError("");
  };

  // Logic cho quản lý TUẦN HỌC
  const handleWeekChange = (index: number, field: string, value: any) => {
    setEditWeeks(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      
      const row = copy[index];
      if (row.isNew && row.TenTuan && row.NgayBatDau && row.NgayKetThuc) {
        delete row.isNew;
        // Tự động append dòng mới
        const nextId = copy.length > 0 ? Math.max(...copy.map(w => w.MaTuan)) + 1 : 1;
        copy.push({ MaTuan: nextId, TenTuan: "", NgayBatDau: "", NgayKetThuc: "", isNew: true });
      }
      return copy;
    });
  };

  const handleDeleteWeek = (index: number) => {
    if (confirm("Bạn có chắc chắn muốn xóa tuần học này không?")) {
      setEditWeeks(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleSaveWeeks = () => {
    if (!dbState) return;
    
    // Lọc
    const validWeeks: any[] = [];
    let hasIncomplete = false;
    editWeeks.forEach(row => {
      if (!row.TenTuan && !row.NgayBatDau && !row.NgayKetThuc) {
        return; // Dòng trống
      }
      if (!row.TenTuan || !row.NgayBatDau || !row.NgayKetThuc) {
        hasIncomplete = true;
        return;
      }
      validWeeks.push(row);
    });

    if (hasIncomplete) {
      alert("Lỗi: Có tuần học bị thiếu thông tin. Vui lòng nhập đầy đủ hoặc xóa dòng!");
      return;
    }

    // Trùng tên
    const names = validWeeks.map(w => w.TenTuan.toLowerCase());
    if (names.length !== new Set(names).size) {
      alert("Lỗi: Tên tuần học không được trùng nhau!");
      return;
    }

    // Ngày bắt đầu >= kết thúc
    let dateError = false;
    validWeeks.forEach(w => {
      if (new Date(w.NgayBatDau) >= new Date(w.NgayKetThuc)) {
        dateError = true;
      }
    });
    if (dateError) {
      alert("Lỗi: Ngày bắt đầu phải trước ngày kết thúc!");
      return;
    }

    const updated = {
      ...dbState,
      DanhMucTuan: validWeeks
    };
    setDbState(recalculateAllWeeks(updated));
    localStorage.setItem("TDHD_DanhMucTuan", JSON.stringify(validWeeks));
    syncTableToSupabase("DanhMucTuan", "MaTuan", validWeeks, true);
    alert("Đã lưu và đồng bộ danh mục tuần học thành công!");
  };

  // Logic cho quản lý LỚP HỌC
  const handleClassChange = (index: number, field: string, value: any) => {
    setEditClasses(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      
      const row = copy[index];
      if (row.isNew && row.TenLop && row.Khoi && row.NamHoc && row.BaseScore !== undefined) {
        delete row.isNew;
        // Tự động append dòng mới
        const nextId = copy.length > 0 ? Math.max(...copy.map(c => c.MaLop)) + 1 : 1;
        copy.push({ MaLop: nextId, TenLop: "", Khoi: 10, NamHoc: "2025-2026", BaseScore: 100, isNew: true });
      }
      return copy;
    });
  };

  const handleDeleteClass = (index: number) => {
    if (confirm("Bạn có chắc chắn muốn xóa lớp học này không?")) {
      setEditClasses(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleSaveClasses = () => {
    if (!dbState) return;

    const validClasses: any[] = [];
    let hasIncomplete = false;
    editClasses.forEach(row => {
      if (!row.TenLop && !row.NamHoc && row.BaseScore === 100 && row.Khoi === 10) {
        return; // Dòng trống
      }
      if (!row.TenLop || !row.NamHoc || row.BaseScore === undefined || isNaN(row.BaseScore)) {
        hasIncomplete = true;
        return;
      }
      validClasses.push(row);
    });

    if (hasIncomplete) {
      alert("Lỗi: Có lớp học bị thiếu thông tin hoặc điểm gốc không hợp lệ. Vui lòng nhập đầy đủ hoặc xóa dòng!");
      return;
    }

    const names = validClasses.map(c => c.TenLop.toLowerCase());
    if (names.length !== new Set(names).size) {
      alert("Lỗi: Tên lớp học không được trùng nhau!");
      return;
    }

    const updated = {
      ...dbState,
      DanhMucLop: validClasses
    };
    setDbState(recalculateAllWeeks(updated));
    localStorage.setItem("TDHD_DanhMucLop", JSON.stringify(validClasses));
    syncTableToSupabase("DanhMucLop", "MaLop", validClasses, true);
    alert("Đã lưu và đồng bộ danh mục lớp học thành công!");
  };

  // 7. Logic cho TAB 6: HỒ SƠ HỌC SINH
  const studentsList = useMemo(() => {
    if (!dbState) return [];
    const students = dbState.DanhSachHocSinh.filter(s => s.MaLop === selectedClassId);
    const viPhams = dbState.ChiTietViPhamHocSinh;
    const thanhTichs = dbState.ChiTietThanhTichHocSinh;

    return students.map(s => {
      const numVp = viPhams.filter(v => v.MaHocSinh === s.MaHocSinh && v.MaTuan === currentWeekId).length;
      const numTt = thanhTichs.filter(t => t.MaHocSinh === s.MaHocSinh && t.MaTuan === currentWeekId).length;
      return {
        ...s,
        numVp,
        numTt
      };
    });
  }, [selectedClassId, currentWeekId, dbState]);

  // Xem chi tiết khen thưởng vi phạm cá nhân của 1 học sinh
  const handleShowStudentDetail = (student: any, filterType: "ALL" | "TRU" | "CONG" = "ALL") => {
    if (!dbState) return;
    const viPhams = filterType === "CONG" ? [] : dbState.ChiTietViPhamHocSinh.filter(v => v.MaHocSinh === student.MaHocSinh && v.MaTuan === currentWeekId);
    const thanhTichs = filterType === "TRU" ? [] : dbState.ChiTietThanhTichHocSinh.filter(t => t.MaHocSinh === student.MaHocSinh && t.MaTuan === currentWeekId);
    const criteria = dbState.QuyDinhThiDua;

    const rows: any[] = [];
    viPhams.forEach(v => {
      const tc = criteria.find(c => c.MaTieuChi === v.MaTieuChi);
      rows.push({
        type: "Vi phạm",
        content: tc?.NoiDung || "Lỗi vi phạm",
        detail: v.GhiChuChiTiet || "-",
        points: `-${tc?.DiemChuyenDoi || 0}đ`,
        day: `Thứ ${v.ThuTrongTuan}`
      });
    });

    thanhTichs.forEach(t => {
      const tc = criteria.find(c => c.MaTieuChi === t.MaTieuChi);
      rows.push({
        type: "Thành tích",
        content: tc?.NoiDung || "Khen thưởng",
        detail: t.GhiChu || "-",
        points: `+${tc?.DiemChuyenDoi || 0}đ`,
        day: `Thứ ${t.ThuTrongTuan}`
      });
    });

    setStudentDetailRows(rows);
    const titleSuffix = filterType === "TRU" ? " (Chi tiết lỗi phạt)" : (filterType === "CONG" ? " (Chi tiết điểm cộng)" : "");
    setStudentDetailTitle(`Sổ ghi nhận học sinh: ${student.HoTen}${titleSuffix}`);
    setActiveDialog("student-detail");
  };

  // Bộ lọc tìm kiếm toàn cục
  const searchResults = useMemo(() => {
    if (!dbState || !searchTerm.trim()) return null;
    const term = searchTerm.toLowerCase().trim();
    
    // Tìm kiếm lớp
    const foundClasses = dbState.DanhMucLop.filter(c => c.TenLop.toLowerCase().includes(term));
    // Tìm kiếm học sinh
    const foundStudents = dbState.DanhSachHocSinh.filter(s => s.HoTen.toLowerCase().includes(term)).map(s => {
      const lop = dbState.DanhMucLop.find(c => c.MaLop === s.MaLop);
      return { ...s, TenLop: lop ? lop.TenLop : "Không rõ" };
    });
    // Tìm kiếm điều luật
    const foundRules = dbState.QuyDinhThiDua.filter(c => c.NoiDung.toLowerCase().includes(term));

    return {
      classes: foundClasses,
      students: foundStudents,
      rules: foundRules
    };
  }, [searchTerm, dbState]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F7F5F0', color: '#111111', fontFamily: 'Montserrat, sans-serif' }}>
        <span className="material-symbols-rounded" style={{ fontSize: '3rem', animation: 'spin 2s linear infinite' }}>sync</span>
        <h3 style={{ marginTop: '1rem', fontWeight: 600 }}>Đang tải dữ liệu thi đua...</h3>
      </div>
    );
  }

  if (!dbState) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F7F5F0', color: '#111111' }}>
        <span className="material-symbols-rounded" style={{ fontSize: '3rem', color: 'var(--danger-color)' }}>error</span>
        <h3>Không thể khởi tạo cơ sở dữ liệu! Vui lòng tải lại trang hoặc kiểm tra file db.json.</h3>
      </div>
    );
  }

  return (
    <div className="app-container">
      
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="material-symbols-rounded brand-icon">school</span>
          <div className="brand-text">
            <h1>TDHD System</h1>
            <p>Thi đua học đường</p>
          </div>
        </div>
        
        <nav className="sidebar-nav">
          <button 
            className={`nav-item ${activeTab === "dashboard" ? "active" : ""}`} 
            onClick={() => { setActiveTab("dashboard"); setSearchTerm(""); }}
          >
            <span className="material-symbols-rounded">leaderboard</span>
            <span>Bảng Xếp Hạng</span>
          </button>
          
          {(currentRole === "ADMIN" || currentRole === "CO_DO") && (
            <button 
              className={`nav-item ${activeTab === "scoring" ? "active" : ""}`} 
              onClick={() => { setActiveTab("scoring"); setSearchTerm(""); }}
            >
              <span className="material-symbols-rounded">edit_note</span>
              <span>Ghi Sổ Trực</span>
            </button>
          )}
          
          <button 
            className={`nav-item ${activeTab === "violation-summary" ? "active" : ""}`} 
            onClick={() => { setActiveTab("violation-summary"); setSearchTerm(""); }}
          >
            <span className="material-symbols-rounded">analytics</span>
            <span>Tổng Hợp Vi Phạm</span>
          </button>
          
          {currentRole === "ADMIN" && (
            <button 
              className={`nav-item ${activeTab === "assignments" ? "active" : ""}`} 
              onClick={() => { setActiveTab("assignments"); setSearchTerm(""); }}
            >
              <span className="material-symbols-rounded">calendar_month</span>
              <span>Phân Công Trực</span>
            </button>
          )}
          
          <button 
            className={`nav-item ${activeTab === "regulations" ? "active" : ""}`} 
            onClick={() => { setActiveTab("regulations"); setSearchTerm(""); }}
          >
            <span className="material-symbols-rounded">gavel</span>
            <span>Quy Định Thi Đua</span>
          </button>
          
          <button 
            className={`nav-item ${activeTab === "students" ? "active" : ""}`} 
            onClick={() => { setActiveTab("students"); setSearchTerm(""); }}
          >
            <span className="material-symbols-rounded">group</span>
            <span>Hồ Sơ Học Sinh</span>
          </button>
          <button 
            className={`nav-item ${activeTab === "weeks" ? "active" : ""}`} 
            onClick={() => { setActiveTab("weeks"); setSearchTerm(""); }}
          >
            <span className="material-symbols-rounded">calendar_today</span>
            <span>Danh Mục Tuần</span>
          </button>
          <button 
            className={`nav-item ${activeTab === "classes" ? "active" : ""}`} 
            onClick={() => { setActiveTab("classes"); setSearchTerm(""); }}
          >
            <span className="material-symbols-rounded">class</span>
            <span>Danh Mục Lớp</span>
          </button>
        </nav>
        
        <div className="sidebar-footer">
          <div className="user-profile-widget">
            <div className="avatar">
              <span className="material-symbols-rounded">person</span>
            </div>
            <div className="profile-info">
              <h4>{currentUser ? currentUser.HoTen : "Không rõ"}</h4>
              <p>
                {currentRole === "ADMIN" ? "Quản Trị Hệ Thống" : 
                 currentRole === "CO_DO" ? "Cờ Đỏ Trực Tuần" : 
                 currentRole === "GIAO_VIEN" ? `GVCN Lớp ${dbState.DanhMucLop.find(c => c.MaLop === currentUser?.MaLop)?.TenLop}` : 
                 `Học Sinh Lớp ${dbState.DanhMucLop.find(c => c.MaLop === currentUser?.MaLop)?.TenLop}`}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Body */}
      <main className="main-content">
        
        {/* Header Section */}
        <header className="app-header">
          <div className="header-search">
            <span className="material-symbols-rounded">search</span>
            <input 
              type="text" 
              placeholder="Tìm kiếm lớp, học sinh, tiêu chí..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="header-actions">
            {/* Week Selector */}
            <div className="week-selector">
              <span className="material-symbols-rounded">event</span>
              <select 
                value={currentWeekId} 
                onChange={(e) => setCurrentWeekId(parseInt(e.target.value))}
              >
                {dbState.DanhMucTuan.map(w => (
                  <option key={w.MaTuan} value={w.MaTuan}>{w.TenTuan}</option>
                ))}
              </select>
            </div>
            
            {/* Role Switcher (Simulator Only) */}
            <div className="role-switcher-widget">
              <span className="switcher-label">Đóng vai:</span>
              <select 
                className="role-dropdown"
                value={currentRole} 
                onChange={(e) => {
                  setCurrentRole(e.target.value);
                  setActiveTab("dashboard");
                  setSearchTerm("");
                }}
              >
                <option value="ADMIN">ADMIN (Quản trị viên)</option>
                <option value="CO_DO">CỜ ĐỎ (Học sinh trực tuần)</option>
                <option value="GIAO_VIEN">GIÁO VIÊN (GVCN lớp 11A)</option>
                <option value="HOC_SINH">HỌC SINH (Học sinh lớp 11A)</option>
              </select>
            </div>
          </div>
        </header>

        {/* Global Search Results Overlay (If searchTerm is not empty) */}
        {searchTerm.trim() !== "" && searchResults && (
          <div className="tab-content active" style={{ padding: '1.5rem 0' }}>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', marginBottom: '1.5rem' }}>
              Kết quả tìm kiếm cho: "{searchTerm}"
            </h2>
            
            <div className="grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
              
              {/* Cột Lớp học */}
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Lớp học ({searchResults.classes.length})</h3>
                </div>
                <div style={{ padding: '1rem' }}>
                  {searchResults.classes.length === 0 ? <p className="no-data">Không tìm thấy lớp học.</p> : (
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                      {searchResults.classes.map(c => (
                        <li key={c.MaLop} style={{ padding: '8px 0', borderBottom: '1px solid var(--border-card)' }}>
                          <strong>Lớp {c.TenLop}</strong> - Khối {c.Khoi} ({c.NamHoc})
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* Cột Học sinh */}
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Học sinh ({searchResults.students.length})</h3>
                </div>
                <div style={{ padding: '1rem' }}>
                  {searchResults.students.length === 0 ? <p className="no-data">Không tìm thấy học sinh.</p> : (
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                      {searchResults.students.map(s => (
                        <li 
                          key={s.MaHocSinh} 
                          className="stats-item interactive-stats-item"
                          onClick={() => handleShowStudentDetail(s)}
                          style={{ padding: '8px', borderBottom: '1px solid var(--border-card)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                        >
                          <div>
                            <strong>{s.HoTen}</strong>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Lớp {s.TenLop}</p>
                          </div>
                          <span className="material-symbols-rounded" style={{ fontSize: '1.2rem' }}>visibility</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* Cột Quy chế */}
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Quy chế / Tiêu chí ({searchResults.rules.length})</h3>
                </div>
                <div style={{ padding: '1rem' }}>
                  {searchResults.rules.length === 0 ? <p className="no-data">Không tìm thấy điều luật.</p> : (
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                      {searchResults.rules.map(r => (
                        <li key={r.MaTieuChi} style={{ padding: '8px 0', borderBottom: '1px solid var(--border-card)', display: 'flex', justifyContent: 'space-between' }}>
                          <div>
                            <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', marginRight: '6px' }}>REQ_{r.MaTieuChi.toString().padStart(3, '0')}</span>
                            <strong>{r.NoiDung}</strong>
                          </div>
                          <span className={`badge ${r.Loai === 'TRU' ? 'badge-danger' : 'badge-success'}`}>
                            {r.Loai === 'TRU' ? `-${r.DiemChuyenDoi}` : `+${r.DiemChuyenDoi}`}đ
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 1. Content TAB 1: BẢNG XẾP HẠNG (DASHBOARD) */}
        {searchTerm.trim() === "" && activeTab === "dashboard" && (
          <div className="tab-content active">
            
            {/* Top 3 Podium Cards */}
            <div className="podium-container">
              {/* Rank 2 (Left) */}
              {topRankings[1] && (
                <div className="podium-step silver">
                  <div className="avatar">
                    <span className="material-symbols-rounded">school</span>
                  </div>
                  <h2 className="podium-class">Lớp {topRankings[1].TenLop}</h2>
                  <div className="rank-badge">Hạng 2</div>
                  <div className="podium-score">{topRankings[1].DiemTongKet} điểm</div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    +{topRankings[1].TongDiemCong} / -{topRankings[1].TongDiemTru}
                  </p>
                </div>
              )}

              {/* Rank 1 (Center) */}
              {topRankings[0] && (
                <div className="podium-step gold">
                  <div className="avatar">
                    <span className="material-symbols-rounded" style={{ fontSize: '2.5rem', color: 'var(--accent-gold)' }}>military_tech</span>
                  </div>
                  <h2 className="podium-class" style={{ fontSize: '1.75rem' }}>Lớp {topRankings[0].TenLop}</h2>
                  <div className="rank-badge">Hạng 1</div>
                  <div className="podium-score" style={{ fontSize: '1.4rem' }}>{topRankings[0].DiemTongKet} điểm</div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    +{topRankings[0].TongDiemCong} / -{topRankings[0].TongDiemTru}
                  </p>
                </div>
              )}

              {/* Rank 3 (Right) */}
              {topRankings[2] && (
                <div className="podium-step bronze">
                  <div className="avatar">
                    <span className="material-symbols-rounded">school</span>
                  </div>
                  <h2 className="podium-class">Lớp {topRankings[2].TenLop}</h2>
                  <div className="rank-badge">Hạng 3</div>
                  <div className="podium-score">{topRankings[2].DiemTongKet} điểm</div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    +{topRankings[2].TongDiemCong} / -{topRankings[2].TongDiemTru}
                  </p>
                </div>
              )}
            </div>

            {/* Grid layout for Main Leaderboard & Stats */}
            <div className="grid-3" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
              
              {/* Leaderboard Table Card */}
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">
                    <span className="material-symbols-rounded" style={{ verticalAlign: 'middle', marginRight: '8px' }}>workspace_premium</span>
                    Thứ Hạng Thi Đua Toàn Trường - Tuần {currentWeekId}
                  </h3>
                </div>
                
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'center', width: '70px' }}>Hạng</th>
                        <th>Lớp học</th>
                        <th style={{ textAlign: 'center' }}>Điểm gốc</th>
                        <th style={{ textAlign: 'center' }}>Điểm cộng</th>
                        <th style={{ textAlign: 'center' }}>Điểm trừ</th>
                        <th style={{ textAlign: 'center' }}>Tổng điểm kết</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rankingList.map(row => (
                        <tr key={row.MaTongKet} className={row.XepHang <= 3 ? "highlight-row" : ""}>
                          <td style={{ textAlign: 'center' }}>
                            {row.XepHang === 1 ? <span style={{ fontSize: '1.25rem', color: 'var(--accent-gold)' }}>★</span> : 
                             row.XepHang === 2 ? <span style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>🥈</span> : 
                             row.XepHang === 3 ? <span style={{ fontSize: '1.2rem', color: '#b08d57' }}>🥉</span> : 
                             <span className="family-pt-mono">{row.XepHang}</span>}
                          </td>
                          <td><strong>Lớp {row.TenLop}</strong> (Khối {row.Khoi})</td>
                          <td style={{ textAlign: 'center' }} className="family-pt-mono">{row.DiemGoc}đ</td>
                          <td style={{ textAlign: 'center', color: 'var(--success-color)', fontWeight: 600 }}>+{row.TongDiemCong}đ</td>
                          <td style={{ textAlign: 'center', color: 'var(--danger-color)', fontWeight: 600 }}>-{row.TongDiemTru}đ</td>
                          <td style={{ textAlign: 'center' }}>
                            <span className="badge badge-success" style={{ minWidth: '70px', display: 'inline-block', textAlign: 'center', fontWeight: 'bold' }}>
                              {row.DiemTongKet}đ
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Sidebar Stats Widget (Penalties & Achievements Breakdown) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                
                {/* Penalties stats card */}
                <div className="card">
                  <div className="card-header">
                    <h3 className="card-title text-red">Lỗi Vi Phạm Nhiều Nhất</h3>
                  </div>
                  <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {penaltiesStats.length === 0 ? <div className="no-data">Không có vi phạm nào phát sinh.</div> : 
                      penaltiesStats.map(item => (
                        <div 
                          key={item.id} 
                          className="stats-item interactive-stats-item" 
                          onClick={() => handleShowViolationDetail(item.id, item.name)}
                          style={{ cursor: 'pointer' }}
                        >
                          <div className="stats-icon error">
                            <span className="material-symbols-rounded">error</span>
                          </div>
                          <div className="stats-info">
                            <h4>{item.name}</h4>
                            <p>{item.count} lượt vi phạm <span style={{ fontSize: '0.75rem', color: 'var(--primary-light)', textDecoration: 'underline', marginLeft: '4px' }}>Xem chi tiết</span></p>
                          </div>
                          <div className="stats-value text-red">-{item.score}đ</div>
                        </div>
                      ))
                    }
                  </div>
                </div>

                {/* Achievements stats card */}
                <div className="card">
                  <div className="card-header">
                    <h3 className="card-title text-green">Thành Tích Nổi Bật</h3>
                  </div>
                  <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {achievementsStats.length === 0 ? <div className="no-data">Không ghi nhận thành tích nào.</div> : 
                      achievementsStats.map(item => (
                        <div key={item.id} className="stats-item">
                          <div className="stats-icon success">
                            <span className="material-symbols-rounded">stars</span>
                          </div>
                          <div className="stats-info">
                            <h4>{item.name}</h4>
                            <p>{item.count} lượt ghi nhận</p>
                          </div>
                          <div className="stats-value text-green">+{item.score}đ</div>
                        </div>
                      ))
                    }
                  </div>
                </div>

              </div>

            </div>

          </div>
        )}

        {/* 2. Content TAB 2: GHI SỔ TRỰC (SCORING) */}
        {searchTerm.trim() === "" && activeTab === "scoring" && (
          <div className="tab-content active">
            <div className="card">
              <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <h3 className="card-title">Ghi Sổ Trực Tuần - Chấm Điểm Thi Đua</h3>
                
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  {/* Select class dropdown */}
                  <select 
                    style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-card)', background: 'var(--bg-card)', color: 'var(--text-primary)', minWidth: '180px' }}
                    value={scoringLopId || ""}
                    onChange={(e) => setScoringLopId(parseInt(e.target.value))}
                  >
                    <option value="" disabled>-- Chọn lớp cần chấm --</option>
                    {scoringClasses.map(c => (
                      <option key={c.MaLop} value={c.MaLop}>Lớp {c.TenLop}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Matrix Table container */}
              {!scoringLopId ? (
                <div className="no-data" style={{ padding: '4rem 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <span className="material-symbols-rounded" style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>draw</span>
                  Vui lòng chọn lớp học để tải ma trận chấm điểm thi đua!
                </div>
              ) : (
                <div>
                  
                  {/* Info alert helper */}
                  {currentRole === "CO_DO" && (
                    <div style={{ padding: '10px 16px', background: 'oklch(65% 0.17 140 / 8%)', borderBottom: '1px solid var(--border-card)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="material-symbols-rounded" style={{ color: 'var(--success-color)', fontSize: '1.2rem' }}>info</span>
                      Bạn đang chấm điểm chéo cho lớp <strong>{dbState.DanhMucLop.find(l => l.MaLop === scoringLopId)?.TenLop}</strong> tuần {currentWeekId}.
                    </div>
                  )}

                  {/* Nhóm 1: Điểm trừ (Vi phạm) */}
                  <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-card)', background: 'rgba(255,0,0,0.02)' }}>
                    <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', color: 'var(--danger-color)', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className="material-symbols-rounded">gavel</span> 1. NHÓM TIÊU CHÍ ĐIỂM TRỪ (VI PHẠM NỀ NẾP)
                    </h3>

                    <div className="table-responsive">
                      <table className="data-table sticky-thead violations-table">
                        <thead>
                          <tr>
                            <th style={{ width: '30%' }}>Nội Dung Tiêu Chí</th>
                            {Array.from({ length: 6 }, (_, i) => i + 2).map(thu => (
                              <th key={thu} style={{ textAlign: 'center', width: '11.5%' }}>Thứ {thu}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {scoringCriteria.violations.map(tc => {
                            const isClassInfraction = !tc.DonViTinh.includes("/HS");
                            return (
                              <tr key={tc.MaTieuChi}>
                                <td>
                                  <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--text-muted)', marginRight: '6px' }}>
                                    {tc.MaTieuChi.toString().padStart(3, '0')}
                                  </span>
                                  <strong>{tc.NoiDung}</strong>
                                  <span className="badge badge-danger" style={{ marginLeft: '6px', fontSize: '0.65rem' }}>
                                    -{tc.DiemChuyenDoi}đ{tc.DonViTinh}
                                  </span>
                                </td>
                                
                                {Array.from({ length: 6 }, (_, i) => i + 2).map(thu => {
                                  const key = `${tc.MaTieuChi}_${thu}`;
                                  
                                  if (isClassInfraction) {
                                    // Hộp chọn cho lỗi vi phạm tập thể lớp
                                    // Ràng buộc số tiết học cho Giờ học Yếu (22) và Trung bình (23)
                                    const maxP = (thu === 2 || thu === 7) ? 4 : 5;
                                    const totalPeriods = (matrixState[`103_${thu}`] || 0) + 
                                                         (matrixState[`104_${thu}`] || 0) + 
                                                         (matrixState[`22_${thu}`] ? 1 : 0) + 
                                                         (matrixState[`23_${thu}`] ? 1 : 0);
                                    
                                    const checked = matrixState[key] === true;
                                    const isDisabled = (totalPeriods >= maxP && !checked);

                                    return (
                                      <td key={thu} style={{ textAlign: 'center' }}>
                                        <input 
                                          type="checkbox" 
                                          checked={checked}
                                          disabled={isDisabled}
                                          onChange={(e) => handleMatrixCheckboxChange(key, e.target.checked)}
                                          style={{ width: '18px', height: '18px', cursor: isDisabled ? 'not-allowed' : 'pointer' }}
                                        />
                                      </td>
                                    );
                                  } else {
                                    // Chọn danh sách học sinh vi phạm cá nhân
                                    const selectedHocSinhs = Array.isArray(matrixState[key]) ? matrixState[key] : [];
                                    return (
                                      <td key={thu}>
                                        <div className="student-pill-container">
                                          {selectedHocSinhs.map(hsId => {
                                            const student = currentClassStudents.find(s => s.MaHocSinh === hsId);
                                            return (
                                              <span key={hsId} className="student-pill">
                                                {student ? student.HoTen : `HS ${hsId}`}
                                                <span 
                                                  className="material-symbols-rounded" 
                                                  onClick={() => handleMatrixRemoveStudent(key, hsId)}
                                                  style={{ fontSize: '0.9rem', cursor: 'pointer', verticalAlign: 'middle', marginLeft: '2px' }}
                                                >
                                                  close
                                                </span>
                                              </span>
                                            );
                                          })}
                                        </div>
                                        <select 
                                          className="codo-select-inline"
                                          value=""
                                          onChange={(e) => handleMatrixSelectStudent(key, e.target.value)}
                                        >
                                          <option value="" disabled>+ HS</option>
                                          {currentClassStudents.map(s => (
                                            <option key={s.MaHocSinh} value={s.MaHocSinh}>{s.HoTen}</option>
                                          ))}
                                        </select>
                                      </td>
                                    );
                                  }
                                })}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Nhóm 2: Điểm cộng (Thành tích) */}
                  <div style={{ padding: '1rem 1.5rem', background: 'rgba(0,255,0,0.01)' }}>
                    <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', color: 'var(--success-color)', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className="material-symbols-rounded">stars</span> 2. NHÓM TIÊU CHÍ ĐIỂM CỘNG (THÀNH TÍCH KHEN THƯỞNG)
                    </h3>

                    <div className="table-responsive">
                      <table className="data-table sticky-thead merits-table">
                        <thead>
                          <tr>
                            <th style={{ width: '30%' }}>Nội Dung Tiêu Chí</th>
                            {Array.from({ length: 6 }, (_, i) => i + 2).map(thu => (
                              <th key={thu} style={{ textAlign: 'center', width: '11.5%' }}>Thứ {thu}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {scoringCriteria.achievements.map(tc => {
                            const isStudentAchievement = tc.MaTieuChi === 101 || tc.MaTieuChi === 102 || tc.DonViTinh.includes("/HS");
                            
                            return (
                              <tr key={tc.MaTieuChi}>
                                <td>
                                  <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--text-muted)', marginRight: '6px' }}>
                                    {tc.MaTieuChi.toString().padStart(3, '0')}
                                  </span>
                                  <strong>{tc.NoiDung}</strong>
                                  <span className="badge badge-success" style={{ marginLeft: '6px', fontSize: '0.65rem' }}>
                                    +{tc.DiemChuyenDoi}đ{tc.DonViTinh}
                                  </span>
                                </td>

                                {Array.from({ length: 6 }, (_, i) => i + 2).map(thu => {
                                  const key = `${tc.MaTieuChi}_${thu}`;
                                  
                                  if (isStudentAchievement) {
                                    // Chọn danh sách học sinh có thành tích
                                    const selectedHocSinhs = Array.isArray(matrixState[key]) ? matrixState[key] : [];
                                    return (
                                      <td key={thu}>
                                        <div className="student-pill-container">
                                          {selectedHocSinhs.map(hsId => {
                                            const student = currentClassStudents.find(s => s.MaHocSinh === hsId);
                                            return (
                                              <span key={hsId} className="student-pill">
                                                {student ? student.HoTen : `HS ${hsId}`}
                                                <span 
                                                  className="material-symbols-rounded" 
                                                  onClick={() => handleMatrixRemoveStudent(key, hsId)}
                                                  style={{ fontSize: '0.9rem', cursor: 'pointer', verticalAlign: 'middle', marginLeft: '2px' }}
                                                >
                                                  close
                                                </span>
                                              </span>
                                            );
                                          })}
                                        </div>
                                        <select 
                                          className="codo-select-inline"
                                          value=""
                                          onChange={(e) => handleMatrixSelectStudent(key, e.target.value)}
                                        >
                                          <option value="" disabled>+ HS</option>
                                          {currentClassStudents.map(s => (
                                            <option key={s.MaHocSinh} value={s.MaHocSinh}>{s.HoTen}</option>
                                          ))}
                                        </select>
                                      </td>
                                    );
                                  } else if (tc.MaTieuChi === 105) {
                                    // Trạng thái tự động đạt buổi học tốt (tính dựa trên số tiết Tốt)
                                    const maxP = (thu === 2 || thu === 7) ? 4 : 5;
                                    const countTot = matrixState[`103_${thu}`] || 0;
                                    const isGoodDay = (countTot >= maxP);

                                    return (
                                      <td key={thu} style={{ textAlign: 'center' }}>
                                        {isGoodDay ? (
                                          <span className="badge badge-success" style={{ fontSize: '0.8rem', padding: '4px 8px', display: 'inline-flex', alignItems: 'center', gap: '4px', borderRadius: '12px', fontWeight: 600, background: 'oklch(65% 0.17 140 / 15%)', color: 'var(--success-color)' }}>
                                            <span className="material-symbols-rounded" style={{ fontSize: '1.1rem' }}>check_circle</span> Đạt
                                          </span>
                                        ) : (
                                          <span style={{ color: 'var(--text-muted)', opacity: 0.35, fontSize: '0.9rem' }}>-</span>
                                        )}
                                      </td>
                                    );
                                  } else {
                                    // Number counter cho lớp (Giờ tốt 103, Giờ khá 104)
                                    const value = matrixState[key] || 0;
                                    const maxP = (thu === 2 || thu === 7) ? 4 : 5;
                                    const totalPeriods = (matrixState[`103_${thu}`] || 0) + 
                                                         (matrixState[`104_${thu}`] || 0) + 
                                                         (matrixState[`22_${thu}`] ? 1 : 0) + 
                                                         (matrixState[`23_${thu}`] ? 1 : 0);
                                    
                                    const isIncDisabled = (totalPeriods >= maxP);

                                    return (
                                      <td key={thu} style={{ textAlign: 'center' }}>
                                        <div className="number-counter">
                                          <button 
                                            type="button" 
                                            className="btn-dec" 
                                            disabled={value <= 0}
                                            onClick={() => handleMatrixCounter(key, "dec", maxP)}
                                          >
                                            -
                                          </button>
                                          <span className="counter-value">{value}</span>
                                          <button 
                                            type="button" 
                                            className="btn-inc" 
                                            disabled={isIncDisabled}
                                            onClick={() => handleMatrixCounter(key, "inc", maxP)}
                                          >
                                            +
                                          </button>
                                        </div>
                                      </td>
                                    );
                                  }
                                })}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Actions footer */}
                  <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border-card)', background: 'var(--bg-card)', display: 'flex', justifyContent: 'flex-end' }}>
                    <button 
                      type="button" 
                      className="btn btn-primary"
                      onClick={handleSaveMatrixData}
                    >
                      <span className="material-symbols-rounded" style={{ verticalAlign: 'middle', marginRight: '6px' }}>save</span>
                      Lưu Bảng Ghi Nhận
                    </button>
                  </div>

                </div>
              )}
            </div>

            {/* Recent Logs List Card */}
            <div className="card" style={{ marginTop: '2rem' }}>
              <div className="card-header">
                <h3 className="card-title">Nhật Ký Ghi Nhận Chấm Điểm Gần Đây</h3>
              </div>
              <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {recentLogs.length === 0 ? (
                  <div className="no-data">Chưa có nhật ký chấm thi đua nào trong tuần này.</div>
                ) : (
                  recentLogs.map((log: any) => {
                    const lop = dbState.DanhMucLop.find(c => c.MaLop === log.MaLop);
                    const lopName = lop ? lop.TenLop : "Không rõ";
                    return (
                      <div key={log.MaNhatKy} className="stats-item" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '10px 14px', borderBottom: '1px solid var(--border-card)' }}>
                        <div className={`stats-icon ${log.LoaiGiaoDich === 'TRU' ? 'error' : 'success'}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', width: '36px', height: '36px', background: log.LoaiGiaoDich === 'TRU' ? 'var(--danger-bg)' : 'var(--success-bg)', color: log.LoaiGiaoDich === 'TRU' ? 'var(--danger-color)' : 'var(--success-color)' }}>
                          <span className="material-symbols-rounded">
                            {log.LoaiGiaoDich === 'TRU' ? 'remove_circle' : 'add_circle'}
                          </span>
                        </div>
                        <div className="stats-info" style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                            <span className="class-name" style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>Lớp {lopName}</span>
                            <span className="time-stamp" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Thứ {log.ThuTrongTuan}</span>
                          </div>
                          <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                            {log.NoiDungTomTat && log.NoiDungTomTat.includes("Đối tượng: Tập thể lớp") 
                              ? log.NoiDungTomTat 
                              : log.NoiDungTomTat 
                                ? log.NoiDungTomTat.replace("Đối tượng:", "Học sinh:") 
                                : ""}
                          </p>
                        </div>
                        <div className={`stats-value ${log.LoaiGiaoDich === 'TRU' ? 'text-red' : 'text-green'}`} style={{ fontWeight: 700, fontSize: '0.95rem', marginLeft: 'auto' }}>
                          {log.DiemThayDoi > 0 ? '+' : ''}{log.DiemThayDoi}đ
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* 3. Content TAB 3: TỔNG HỢP VI PHẠM HÀNG NGÀY (VIOLATION SUMMARY) */}
        {searchTerm.trim() === "" && activeTab === "violation-summary" && (
          <div className="tab-content active">
            <div className="card">
              <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <h3 className="card-title">Bảng Số Liệu Tổng Hợp Lỗi Phạt Hàng Ngày</h3>
                
                {/* Select class to view daily infractions */}
                <select 
                  style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-card)', background: 'var(--bg-card)', color: 'var(--text-primary)', minWidth: '180px' }}
                  value={summaryLopId || ""}
                  onChange={(e) => setSummaryLopId(parseInt(e.target.value))}
                >
                  <option value="" disabled>-- Chọn lớp học --</option>
                  {dbState.DanhMucLop.map(c => (
                    <option key={c.MaLop} value={c.MaLop}>Lớp {c.TenLop}</option>
                  ))}
                </select>
              </div>

              {!summaryLopId ? (
                <div className="no-data" style={{ padding: '4rem 0', textAlign: 'center' }}>
                  Vui lòng chọn lớp học để xem thống kê tổng hợp!
                </div>
              ) : (
                <div>
                  <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-card)', background: 'var(--bg-card)', fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
                    <span>Lớp: {dbState.DanhMucLop.find(c => c.MaLop === summaryLopId)?.TenLop}</span>
                    <span>Tuần: {currentWeekId}</span>
                  </div>

                  <div className="table-responsive">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th style={{ width: '30%' }}>Tiêu Chí Vi Phạm</th>
                          {Array.from({ length: 6 }, (_, i) => i + 2).map(thu => (
                            <th key={thu} style={{ textAlign: 'center', width: '10%' }}>Thứ {thu}</th>
                          ))}
                          <th style={{ textAlign: 'center', width: '10%', background: 'oklch(100% 0 0 / 2%)' }}>Tổng lượt</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dailySummaryMatrix.map(row => (
                          <tr key={row.MaTieuChi}>
                            <td>
                              <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--text-muted)', marginRight: '6px' }}>
                                {row.MaTieuChi.toString().padStart(3, '0')}
                              </span>
                              <strong>{row.NoiDung}</strong>
                              <span className="badge badge-danger" style={{ marginLeft: '6px', fontSize: '0.65rem' }}>
                                -{row.DiemChuyenDoi}đ
                              </span>
                            </td>

                            {Array.from({ length: 6 }, (_, i) => i + 2).map(thu => {
                              const qty = row.dailyQty[thu];
                              return (
                                <td key={thu} style={{ textAlign: 'center' }}>
                                  {qty > 0 ? (
                                    <span 
                                      className="badge badge-danger" 
                                      onClick={() => handleShowViolationDetail(row.MaTieuChi, row.NoiDung)}
                                      style={{ fontSize: '0.8rem', fontWeight: 700, borderRadius: '50%', width: '24px', height: '24px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: 0, cursor: 'pointer' }}
                                    >
                                      {qty}
                                    </span>
                                  ) : (
                                    <span style={{ color: 'var(--text-muted)', opacity: 0.3 }}>-</span>
                                  )}
                                </td>
                              );
                            })}

                            <td style={{ textAlign: 'center', background: 'oklch(100% 0 0 / 1.5%)' }}>
                              {row.rowTotal > 0 ? (
                                <span style={{ color: 'var(--danger-color)', fontWeight: 800, fontSize: '0.95rem' }}>
                                  {row.rowTotal}
                                </span>
                              ) : (
                                <span style={{ color: 'var(--text-muted)', opacity: 0.3 }}>-</span>
                              )}
                            </td>
                          </tr>
                        ))}
                        
                        {/* Summary Total Footer Row */}
                        <tr style={{ borderTop: '2px solid var(--border-card)', background: 'oklch(60% 0.19 25 / 1.5%)', fontWeight: 'bold' }}>
                          <td><strong style={{ color: 'var(--danger-color)' }}>Tổng Điểm Bị Trừ</strong></td>
                          {Array.from({ length: 6 }, (_, i) => i + 2).map(thu => {
                            const nhatKy = dbState.NhatKyViPhamHangNgay.filter(nk => nk.MaLop === summaryLopId && nk.MaTuan === currentWeekId && nk.ThuTrongTuan === thu);
                            const totalMinus = nhatKy.reduce((sum, item) => sum + item.TongDiemTruPhatSinh, 0);
                            return (
                              <td key={thu} style={{ textAlign: 'center', color: 'var(--danger-color)' }}>
                                {totalMinus > 0 ? `-${totalMinus.toFixed(1)}đ` : "-"}
                              </td>
                            );
                          })}
                          <td style={{ textAlign: 'center', background: 'oklch(60% 0.19 25 / 8%)', color: 'var(--danger-color)', fontWeight: 800 }}>
                            {summaryGrandTotal > 0 ? `-${summaryGrandTotal.toFixed(1)}đ` : "0đ"}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 4. Content TAB 4: PHÂN CÔNG CO ĐỎ TRỰC (ASSIGNMENTS) */}
        {searchTerm.trim() === "" && activeTab === "assignments" && (
          <div className="tab-content active">
            <div className="card">
              <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 className="card-title">Phân Công Cờ Đỏ Chấm Chéo - Tuần {currentWeekId}</h3>
                
                <button 
                  type="button" 
                  className="btn btn-outline"
                  onClick={() => {
                    setNewAssignCodoId(null);
                    setNewAssignLopId(null);
                    setActiveDialog("assign");
                  }}
                >
                  <span className="material-symbols-rounded" style={{ verticalAlign: 'middle', marginRight: '4px' }}>add</span>
                  Thêm Dòng Phân Công
                </button>
              </div>

              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ width: '80px', textAlign: 'center' }}>STT</th>
                      <th>Học sinh Cờ đỏ được phân</th>
                      <th>Lớp chủ quản</th>
                      <th>Lớp được phân đi chấm</th>
                      <th style={{ width: '100px', textAlign: 'center' }}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {editAssigns.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="no-data" style={{ textAlign: 'center', padding: '3rem 0' }}>
                          Chưa phân công lịch trực cho tuần này. Bấm "Thêm dòng phân công" để phân chéo!
                        </td>
                      </tr>
                    ) : (
                      editAssigns.map((row, idx) => {
                        const codoUser = dbState.NguoiDung.find(u => u.MaNguoiDung === row.MaNguoiDung);
                        const codoLop = codoUser ? dbState.DanhMucLop.find(c => c.MaLop === codoUser.MaLop) : null;
                        const targetLop = dbState.DanhMucLop.find(c => c.MaLop === row.MaLop);

                        return (
                          <tr key={row.MaPhanCong}>
                            <td style={{ textAlign: 'center' }} className="family-pt-mono">{idx + 1}</td>
                            <td><strong>{codoUser ? codoUser.HoTen : `Cờ đỏ #${row.MaNguoiDung}`}</strong></td>
                            <td><span className="badge badge-secondary">Lớp {codoLop ? codoLop.TenLop : "Không rõ"}</span></td>
                            <td>
                              <span className="badge badge-success" style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>
                                Đi chấm: Lớp {targetLop ? targetLop.TenLop : "Không rõ"}
                              </span>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <button 
                                className="btn btn-icon btn-sm text-red"
                                onClick={() => handleDeleteAssign(row.MaPhanCong)}
                                style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}
                              >
                                <span className="material-symbols-rounded">delete</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Action footer */}
              <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border-card)', background: 'var(--bg-card)', display: 'flex', justifyContent: 'flex-end' }}>
                <button 
                  type="button" 
                  className="btn btn-primary"
                  onClick={handleSaveAssignments}
                >
                  <span className="material-symbols-rounded" style={{ verticalAlign: 'middle', marginRight: '6px' }}>save</span>
                  Lưu Lịch Phân Công
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 5. Content TAB 5: QUY ĐỊNH THI ĐUA (REGULATIONS) */}
        {searchTerm.trim() === "" && activeTab === "regulations" && (
          <div className="tab-content active">
            <div className="card">
              <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 className="card-title">Quy Định Tiêu Chí Thi Đua Học Đường</h3>
                {currentRole === "ADMIN" && (
                  <button 
                    type="button" 
                    className="btn btn-outline"
                    onClick={() => {
                      setNewCriterionContent("");
                      setNewCriterionType("TRU");
                      setNewCriterionScore("");
                      setNewCriterionUnit("");
                      setEditingCriterionId(null);
                      setActiveDialog("add-criterion");
                    }}
                  >
                    <span className="material-symbols-rounded" style={{ verticalAlign: 'middle', marginRight: '4px' }}>add</span>
                    Thêm tiêu chí mới
                  </button>
                )}
              </div>

              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ width: '10%' }}>Mã quy chế</th>
                      <th style={{ width: '40%' }}>Nội Dung Quy Định</th>
                      <th style={{ width: '15%', textAlign: 'center' }}>Phân loại</th>
                      <th style={{ width: '15%', textAlign: 'center' }}>Điểm quy đổi</th>
                      <th style={{ width: '20%', textAlign: 'center' }}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dbState.QuyDinhThiDua.map(row => (
                      <tr key={row.MaTieuChi} style={{ opacity: row.is_active !== false ? 1 : 0.4 }}>
                        <td className="family-pt-mono">REQ_{row.MaTieuChi.toString().padStart(3, '0')}</td>
                        <td><strong>{row.NoiDung}</strong> <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>({row.DonViTinh})</span></td>
                        <td style={{ textAlign: 'center' }}>
                          <span className={`badge ${row.Loai === 'TRU' ? 'badge-danger' : 'badge-success'}`}>
                            {row.Loai === 'TRU' ? "Vi phạm (Trừ)" : "Thành tích (Cộng)"}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center', fontWeight: 'bold' }}>
                          {row.Loai === 'TRU' ? `-${row.DiemChuyenDoi}` : `+${row.DiemChuyenDoi}`} điểm
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {currentRole === "ADMIN" ? (
                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', alignItems: 'center' }}>
                              <button 
                                className="btn btn-icon btn-sm"
                                onClick={() => handleEditCriterionClick(row)}
                                style={{ color: 'var(--primary-color)' }}
                                title="Sửa"
                              >
                                <span className="material-symbols-rounded">edit</span>
                              </button>
                              
                              <button 
                                className={`btn btn-icon btn-sm ${row.is_active !== false ? 'text-orange' : 'text-green'}`}
                                onClick={() => handleToggleCriterion(row.MaTieuChi)}
                                title={row.is_active !== false ? "Vô hiệu hóa" : "Kích hoạt"}
                              >
                                <span className="material-symbols-rounded">
                                  {row.is_active !== false ? "block" : "check_circle"}
                                </span>
                              </button>

                              <button 
                                className="btn btn-icon btn-sm text-red"
                                onClick={() => handleDeleteCriterionClick(row)}
                                title="Xóa"
                              >
                                <span className="material-symbols-rounded">delete</span>
                              </button>
                            </div>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Action footer */}
              {currentRole === "ADMIN" && (
                <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border-card)', background: 'var(--bg-card)', display: 'flex', justifyContent: 'flex-end' }}>
                  <button 
                    type="button" 
                    className="btn btn-primary"
                    onClick={handleSaveRegulations}
                  >
                    <span className="material-symbols-rounded" style={{ verticalAlign: 'middle', marginRight: '6px' }}>save</span>
                    Lưu thực hiện
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 6. Content TAB 6: HỒ SƠ HỌC SINH (STUDENTS) */}
        {searchTerm.trim() === "" && activeTab === "students" && (
          <div className="tab-content active">
            <div className="grid-3" style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '1.5rem' }}>
              
              {/* Cột chọn lớp học */}
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Danh Sách Lớp Học</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', maxHeight: '500px', overflowY: 'auto' }}>
                  {dbState.DanhMucLop.map(lop => (
                    <button 
                      key={lop.MaLop}
                      className={`nav-item ${selectedClassId === lop.MaLop ? "active" : ""}`}
                      onClick={() => setSelectedClassId(lop.MaLop)}
                      style={{ textAlign: 'left', padding: '12px 16px', border: 'none', borderBottom: '1px solid var(--border-card)', background: 'transparent', cursor: 'pointer', fontFamily: 'Montserrat, sans-serif' }}
                    >
                      <strong>Lớp {lop.TenLop}</strong>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Khối {lop.Khoi} - {lop.NamHoc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Danh sách học sinh của lớp được chọn */}
              <div className="card">
                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 className="card-title">
                    Hồ Sơ Học Sinh - Lớp {dbState.DanhMucLop.find(c => c.MaLop === selectedClassId)?.TenLop} (Tuần {currentWeekId})
                  </h3>
                  {currentRole === "ADMIN" && (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button 
                        type="button" 
                        className="btn btn-sm btn-outline"
                        onClick={handleDownloadTemplate}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        <span className="material-symbols-rounded" style={{ fontSize: '1.1rem' }}>download</span>
                        Tải Excel Mẫu
                      </button>
                      <button 
                        type="button" 
                        className="btn btn-sm btn-outline"
                        onClick={() => {
                          setImportPreviewData([]);
                          setImportFileName("");
                          setImportError("");
                          setActiveDialog("import-student");
                        }}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        <span className="material-symbols-rounded" style={{ fontSize: '1.1rem' }}>upload_file</span>
                        Nhập Excel
                      </button>
                      <button 
                        type="button" 
                        className="btn btn-sm btn-primary"
                        onClick={() => {
                          setNewStudentName("");
                          setNewStudentDob("");
                          setNewStudentGender("Nam");
                          setEditingStudentId(null);
                          setActiveDialog("add-student");
                        }}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        <span className="material-symbols-rounded" style={{ fontSize: '1.1rem' }}>person_add</span>
                        Thêm học sinh
                      </button>
                    </div>
                  )}
                </div>
                
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th style={{ width: '80px', textAlign: 'center' }}>Mã HS</th>
                        <th>Họ tên học sinh</th>
                        <th style={{ textAlign: 'center' }}>Ngày sinh</th>
                        <th style={{ textAlign: 'center' }}>Giới tính</th>
                        <th style={{ textAlign: 'center' }}>Số lỗi phạt</th>
                        <th style={{ textAlign: 'center' }}>Thành tích</th>
                        <th style={{ width: '100px', textAlign: 'center' }}>Chi tiết</th>
                        <th style={{ width: '150px', textAlign: 'center' }}>Quyền Thao Tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {studentsList.map(row => (
                        <tr key={row.MaHocSinh} style={{ opacity: row.is_active !== false ? 1 : 0.4 }}>
                          <td style={{ textAlign: 'center' }} className="family-pt-mono">HS_{row.MaHocSinh.toString().padStart(3, '0')}</td>
                          <td><strong>{row.HoTen}</strong></td>
                          <td style={{ textAlign: 'center' }} className="family-pt-mono">{row.NgaySinh}</td>
                          <td style={{ textAlign: 'center' }}>{row.GioiTinh}</td>
                          <td style={{ textAlign: 'center' }}>
                            <span 
                              className={`badge ${row.numVp > 0 ? 'badge-danger' : 'badge-secondary'}`}
                              onClick={() => handleShowStudentDetail(row, "TRU")}
                              style={{ cursor: 'pointer' }}
                              title="Xem chi tiết vi phạm"
                            >
                              {row.numVp} vi phạm
                            </span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <span 
                              className={`badge ${row.numTt > 0 ? 'badge-success' : 'badge-secondary'}`}
                              onClick={() => handleShowStudentDetail(row, "CONG")}
                              style={{ cursor: 'pointer' }}
                              title="Xem chi tiết khen thưởng"
                            >
                              {row.numTt} khen thưởng
                            </span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <button 
                              className="btn btn-outline"
                              onClick={() => handleShowStudentDetail(row)}
                              style={{ padding: '4px 10px', fontSize: '0.75rem', minWidth: '60px' }}
                            >
                              Xem sổ
                            </button>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            {currentRole === "ADMIN" ? (
                              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', alignItems: 'center' }}>
                                <button 
                                  className="btn btn-icon btn-sm"
                                  onClick={() => handleEditStudentClick(row)}
                                  style={{ color: 'var(--primary-color)' }}
                                  title="Sửa"
                                >
                                  <span className="material-symbols-rounded">edit</span>
                                </button>
                                
                                <button 
                                  className={`btn btn-icon btn-sm ${row.is_active !== false ? 'text-orange' : 'text-green'}`}
                                  onClick={() => handleToggleStudent(row.MaHocSinh)}
                                  title={row.is_active !== false ? "Vô hiệu hóa" : "Kích hoạt"}
                                >
                                  <span className="material-symbols-rounded">
                                    {row.is_active !== false ? "block" : "check_circle"}
                                  </span>
                                </button>

                                <button 
                                  className="btn btn-icon btn-sm text-red"
                                  onClick={() => handleDeleteStudentClick(row)}
                                  title="Xóa"
                                >
                                  <span className="material-symbols-rounded">delete</span>
                                </button>
                              </div>
                            ) : (
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Action footer */}
                {currentRole === "ADMIN" && (
                  <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border-card)', background: 'var(--bg-card)', display: 'flex', justifyContent: 'flex-end' }}>
                    <button 
                      type="button" 
                      className="btn btn-primary"
                      onClick={handleSaveStudents}
                    >
                      <span className="material-symbols-rounded" style={{ verticalAlign: 'middle', marginRight: '6px' }}>save</span>
                      Lưu thực hiện
                    </button>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* Content TAB: DANH MỤC TUẦN (WEEKS) */}
        {searchTerm.trim() === "" && activeTab === "weeks" && (
          <div className="tab-content active">
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Danh Sách Tuần Học</h3>
              </div>

              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ width: '15%' }}>Mã Tuần</th>
                      <th style={{ width: '30%' }}>Tên Tuần</th>
                      <th style={{ width: '25%' }}>Ngày Bắt Đầu</th>
                      <th style={{ width: '20%' }}>Ngày Kết Thúc</th>
                      <th style={{ width: '10%', textAlign: 'center' }}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {editWeeks.map((row, index) => (
                      <tr key={row.MaTuan}>
                        <td className="family-pt-mono">WEEK_{row.MaTuan.toString().padStart(3, '0')}</td>
                        <td>
                          {currentRole === "ADMIN" ? (
                            <input 
                              type="text"
                              className="form-control-sm"
                              style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid var(--border-card)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                              placeholder={`Ví dụ: Tuần ${row.MaTuan}`}
                              value={row.TenTuan}
                              onChange={(e) => handleWeekChange(index, "TenTuan", e.target.value)}
                            />
                          ) : (
                            <strong>{row.TenTuan || "-"}</strong>
                          )}
                        </td>
                        <td>
                          {currentRole === "ADMIN" ? (
                            <input 
                              type="date"
                              className="form-control-sm"
                              style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid var(--border-card)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                              value={row.NgayBatDau}
                              onChange={(e) => handleWeekChange(index, "NgayBatDau", e.target.value)}
                            />
                          ) : (
                            <span className="family-pt-mono">{row.NgayBatDau || "-"}</span>
                          )}
                        </td>
                        <td>
                          {currentRole === "ADMIN" ? (
                            <input 
                              type="date"
                              className="form-control-sm"
                              style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid var(--border-card)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                              value={row.NgayKetThuc}
                              onChange={(e) => handleWeekChange(index, "NgayKetThuc", e.target.value)}
                            />
                          ) : (
                            <span className="family-pt-mono">{row.NgayKetThuc || "-"}</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {currentRole === "ADMIN" ? (
                            <button 
                              type="button"
                              className="btn btn-icon btn-sm text-red"
                              disabled={row.isNew}
                              onClick={() => handleDeleteWeek(index)}
                              style={{ opacity: row.isNew ? 0.3 : 1, cursor: row.isNew ? 'not-allowed' : 'pointer', border: 'none', background: 'transparent' }}
                            >
                              <span className="material-symbols-rounded">delete</span>
                            </button>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Action footer */}
              {currentRole === "ADMIN" && (
                <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border-card)', background: 'var(--bg-card)', display: 'flex', justifyContent: 'flex-end' }}>
                  <button 
                    type="button" 
                    className="btn btn-primary"
                    onClick={handleSaveWeeks}
                  >
                    <span className="material-symbols-rounded" style={{ verticalAlign: 'middle', marginRight: '6px' }}>save</span>
                    Lưu Tuần Học
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Content TAB: DANH MỤC LỚP (CLASSES) */}
        {searchTerm.trim() === "" && activeTab === "classes" && (
          <div className="tab-content active">
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Danh Sách Lớp Học</h3>
              </div>

              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ width: '15%' }}>Mã Lớp</th>
                      <th style={{ width: '25%' }}>Tên Lớp</th>
                      <th style={{ width: '20%' }}>Khối</th>
                      <th style={{ width: '20%' }}>Năm Học</th>
                      <th style={{ width: '10%', textAlign: 'center' }}>Điểm Gốc</th>
                      <th style={{ width: '10%', textAlign: 'center' }}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {editClasses.map((row, index) => (
                      <tr key={row.MaLop}>
                        <td className="family-pt-mono">CLASS_{row.MaLop.toString().padStart(3, '0')}</td>
                        <td>
                          {currentRole === "ADMIN" ? (
                            <input 
                              type="text"
                              className="form-control-sm"
                              style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid var(--border-card)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                              placeholder="Ví dụ: 10A"
                              value={row.TenLop}
                              onChange={(e) => handleClassChange(index, "TenLop", e.target.value)}
                            />
                          ) : (
                            <strong>Lớp {row.TenLop || "-"}</strong>
                          )}
                        </td>
                        <td>
                          {currentRole === "ADMIN" ? (
                            <select 
                              className="codo-select-inline"
                              style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid var(--border-card)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                              value={row.Khoi}
                              onChange={(e) => handleClassChange(index, "Khoi", parseInt(e.target.value))}
                            >
                              <option value={10}>Khối 10</option>
                              <option value={11}>Khối 11</option>
                              <option value={12}>Khối 12</option>
                            </select>
                          ) : (
                            <span>Khối {row.Khoi}</span>
                          )}
                        </td>
                        <td>
                          {currentRole === "ADMIN" ? (
                            <input 
                              type="text"
                              className="form-control-sm"
                              style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid var(--border-card)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                              placeholder="2025-2026"
                              value={row.NamHoc}
                              onChange={(e) => handleClassChange(index, "NamHoc", e.target.value)}
                            />
                          ) : (
                            <span>{row.NamHoc}</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {currentRole === "ADMIN" ? (
                            <input 
                              type="number"
                              className="form-control-sm"
                              style={{ width: '80px', padding: '6px', borderRadius: '4px', border: '1px solid var(--border-card)', background: 'var(--bg-card)', color: 'var(--text-primary)', textAlign: 'center' }}
                              value={row.BaseScore}
                              onChange={(e) => handleClassChange(index, "BaseScore", parseFloat(e.target.value))}
                            />
                          ) : (
                            <strong>{row.BaseScore}</strong>
                          )}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {currentRole === "ADMIN" ? (
                            <button 
                              type="button"
                              className="btn btn-icon btn-sm text-red"
                              disabled={row.isNew}
                              onClick={() => handleDeleteClass(index)}
                              style={{ opacity: row.isNew ? 0.3 : 1, cursor: row.isNew ? 'not-allowed' : 'pointer', border: 'none', background: 'transparent' }}
                            >
                              <span className="material-symbols-rounded">delete</span>
                            </button>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Action footer */}
              {currentRole === "ADMIN" && (
                <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border-card)', background: 'var(--bg-card)', display: 'flex', justifyContent: 'flex-end' }}>
                  <button 
                    type="button" 
                    className="btn btn-primary"
                    onClick={handleSaveClasses}
                  >
                    <span className="material-symbols-rounded" style={{ verticalAlign: 'middle', marginRight: '6px' }}>save</span>
                    Lưu Lớp Học
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

      </main>

      {/* ============================================================================ */}
      {/* DIALOG OVERLAYS (MODALS)                                                     */}
      {/* ============================================================================ */}

      {/* 1. Dialog: Cảnh báo vi phạm quy tắc an toàn Phân công trực (alert) */}
      {activeDialog === "alert" && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setActiveDialog(null)}>
          <div className="glass-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '450px', width: '90%', padding: '1.5rem', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <span className="material-symbols-rounded" style={{ fontSize: '3.5rem', color: 'var(--danger-color)' }}>security_alert</span>
            <h3 style={{ margin: 0, fontFamily: 'var(--font-heading)', fontSize: '1.25rem' }}>Vi Phạm Quy Tắc An Toàn!</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.4' }}>
              Quy chế an toàn của nhà trường nghiêm cấm phân công học sinh Cờ đỏ đi chấm chéo tại lớp học của chính mình làm chủ quản. Vui lòng kiểm tra và sửa lại phân công!
            </p>
            <div className="dialog-actions" style={{ display: 'flex', justifyContent: 'center', marginTop: '0.5rem' }}>
              <button className="btn btn-primary" onClick={() => setActiveDialog(null)} style={{ minWidth: '120px' }}>Tôi Đã Hiểu</button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Dialog: Thêm dòng phân công trực chéo (assign) */}
      {activeDialog === "assign" && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setActiveDialog(null)}>
          <div className="glass-dialog form-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px', width: '90%', display: 'block' }}>
            <div className="dialog-content">
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', marginBottom: '1.2rem' }}>Thêm Dòng Phân Công Mới</h3>
              
              <form onSubmit={handleAddNewAssign} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label htmlFor="assign-codo" style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>Học sinh Cờ đỏ trực <span className="required">*</span></label>
                  <select 
                    id="assign-codo" 
                    required 
                    value={newAssignCodoId || ""}
                    onChange={(e) => setNewAssignCodoId(parseInt(e.target.value))}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-card)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                  >
                    <option value="" disabled>-- Chọn học sinh Cờ đỏ --</option>
                    {dbState.NguoiDung.filter(u => u.VaiTro === "CO_DO").map(codo => {
                      const lop = dbState.DanhMucLop.find(c => c.MaLop === codo.MaLop);
                      return (
                        <option key={codo.MaNguoiDung} value={codo.MaNguoiDung}>
                          {codo.HoTen} (Cựu HS lớp {lop ? lop.TenLop : "Không rõ"})
                        </option>
                      );
                    })}
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="assign-lop" style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>Lớp được phân đi chấm chéo <span className="required">*</span></label>
                  <select 
                    id="assign-lop" 
                    required
                    value={newAssignLopId || ""}
                    onChange={(e) => setNewAssignLopId(parseInt(e.target.value))}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-card)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                  >
                    <option value="" disabled>-- Chọn lớp cần chấm chéo --</option>
                    {dbState.DanhMucLop.map(lop => (
                      <option key={lop.MaLop} value={lop.MaLop}>Lớp {lop.TenLop}</option>
                    ))}
                  </select>
                </div>

                <div className="dialog-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                  <button type="button" className="btn btn-outline" onClick={() => setActiveDialog(null)}>Hủy</button>
                  <button type="submit" className="btn btn-primary">Thêm Dòng</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 3. Dialog: Breakdown lượt vi phạm của tiêu chí trong tuần (violation-detail) */}
      {activeDialog === "violation-detail" && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setActiveDialog(null)}>
          <div className="glass-dialog form-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px', width: '95%', display: 'block' }}>
            <div className="dialog-content" style={{ alignItems: 'stretch', textAlign: 'left' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-card)', paddingBottom: '0.75rem', marginBottom: '1rem', gap: '1rem' }}>
                <h3 style={{ margin: 0, fontFamily: 'var(--font-heading)', fontSize: '1.1rem' }}>
                  {violationDetailTitle}
                </h3>
                <button 
                  className="btn btn-icon btn-sm btn-outline" 
                  onClick={() => setActiveDialog(null)} 
                  style={{ border: 'none', padding: '4px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', borderRadius: '50%', width: '28px', height: '28px' }}
                >
                  <span className="material-symbols-rounded" style={{ fontSize: '1.25rem' }}>close</span>
                </button>
              </div>
              <div className="table-responsive" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Học sinh vi phạm</th>
                      <th>Lớp chủ quản</th>
                      <th style={{ textAlign: 'center', width: '150px' }}>Số lượt vi phạm</th>
                    </tr>
                  </thead>
                  <tbody>
                    {violationDetailRows.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="no-data" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 0' }}>
                          Chưa ghi nhận lượt vi phạm cá nhân nào trong tuần này.
                        </td>
                      </tr>
                    ) : (
                      violationDetailRows.map((item, idx) => (
                        <tr key={idx}>
                          <td><strong>{item.hoTen}</strong></td>
                          <td><span className="badge badge-warning" style={{ fontSize: '0.75rem' }}>Lớp {item.tenLop}</span></td>
                          <td style={{ textAlign: 'center', fontWeight: 700, color: 'var(--danger-color)', fontSize: '0.95rem' }}>{item.soLuong} lượt</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Dialog: Sổ ghi chép chi tiết học tập / kỷ luật của cá nhân học sinh (student-detail) */}
      {activeDialog === "student-detail" && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setActiveDialog(null)}>
          <div className="glass-dialog form-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '650px', width: '95%', display: 'block' }}>
            <div className="dialog-content" style={{ alignItems: 'stretch', textAlign: 'left' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-card)', paddingBottom: '0.75rem', marginBottom: '1rem', gap: '1rem' }}>
                <h3 style={{ margin: 0, fontFamily: 'var(--font-heading)', fontSize: '1.1rem' }}>
                  {studentDetailTitle}
                </h3>
                <button 
                  className="btn btn-icon btn-sm btn-outline" 
                  onClick={() => setActiveDialog(null)} 
                  style={{ border: 'none', padding: '4px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', borderRadius: '50%', width: '28px', height: '28px' }}
                >
                  <span className="material-symbols-rounded" style={{ fontSize: '1.25rem' }}>close</span>
                </button>
              </div>
              
              <div className="table-responsive" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ width: '100px' }}>Thời gian</th>
                      <th style={{ width: '120px', textAlign: 'center' }}>Phân loại</th>
                      <th>Nội dung sự việc</th>
                      <th>Ghi chú thêm</th>
                      <th style={{ width: '100px', textAlign: 'center' }}>Số điểm</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentDetailRows.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="no-data" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 0' }}>
                          Học sinh không có ghi chép khen thưởng hay kỷ luật nào trong tuần này.
                        </td>
                      </tr>
                    ) : (
                      studentDetailRows.map((item, idx) => (
                        <tr key={idx}>
                          <td className="family-pt-mono">{item.day}</td>
                          <td style={{ textAlign: 'center' }}>
                            <span className={`badge ${item.type === 'Vi phạm' ? 'badge-danger' : 'badge-success'}`}>
                              {item.type}
                            </span>
                          </td>
                          <td><strong>{item.content}</strong></td>
                          <td><span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{item.detail}</span></td>
                          <td style={{ textAlign: 'center', fontWeight: 700, color: item.type === 'Vi phạm' ? 'var(--danger-color)' : 'var(--success-color)' }}>
                            {item.points}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Dialog: Thêm tiêu chí thi đua mới (add-criterion) */}
      {activeDialog === "add-criterion" && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setActiveDialog(null)}>
          <div className="glass-dialog form-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px', width: '90%', display: 'block' }}>
            <div className="dialog-content">
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', marginBottom: '1.2rem' }}>
                {editingCriterionId !== null ? "Cập Nhật Tiêu Chí Thi Đua" : "Thêm Tiêu Chí Thi Đua Mới"}
              </h3>
              
              <form onSubmit={handleAddNewCriterion} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label htmlFor="criterion-content" style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>Nội Dung Quy Định <span className="required">*</span></label>
                  <input 
                    type="text" 
                    id="criterion-content" 
                    placeholder="Ví dụ: Đi học muộn, Giờ học: Tốt..." 
                    required 
                    value={newCriterionContent}
                    onChange={(e) => setNewCriterionContent(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-card)', background: 'var(--bg-card)', color: 'var(--text-primary)', marginTop: '6px' }}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="criterion-type" style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>Loại Điểm <span className="required">*</span></label>
                  <select 
                    id="criterion-type" 
                    required
                    value={newCriterionType}
                    onChange={(e) => setNewCriterionType(e.target.value as "TRU" | "CONG")}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-card)', background: 'var(--bg-card)', color: 'var(--text-primary)', marginTop: '6px' }}
                  >
                    <option value="TRU">Điểm Trừ (Vi phạm)</option>
                    <option value="CONG">Điểm Cộng (Thành tích)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="criterion-score" style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>Điểm Quy Đổi <span className="required">*</span></label>
                  <input 
                    type="number" 
                    id="criterion-score" 
                    min="1" 
                    max="100" 
                    placeholder="Ví dụ: 5, 10..." 
                    required 
                    value={newCriterionScore}
                    onChange={(e) => setNewCriterionScore(e.target.value === "" ? "" : Number(e.target.value))}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-card)', background: 'var(--bg-card)', color: 'var(--text-primary)', marginTop: '6px' }}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="criterion-unit" style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>Đơn Vị Tính <span className="required">*</span></label>
                  <input 
                    type="text" 
                    id="criterion-unit" 
                    placeholder="Ví dụ: /HS, /lớp, /tiết, /buổi..." 
                    required 
                    value={newCriterionUnit}
                    onChange={(e) => setNewCriterionUnit(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-card)', background: 'var(--bg-card)', color: 'var(--text-primary)', marginTop: '6px' }}
                  />
                </div>

                <div className="dialog-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                  <button type="button" className="btn btn-outline" onClick={() => setActiveDialog(null)}>Hủy</button>
                  <button type="submit" className="btn btn-primary">Lưu Tiêu Chí</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 6. Dialog: Thêm học sinh mới (add-student) */}
      {activeDialog === "add-student" && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setActiveDialog(null)}>
          <div className="glass-dialog form-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px', width: '90%', display: 'block' }}>
            <div className="dialog-content">
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', marginBottom: '1.2rem' }}>
                {editingStudentId !== null ? "Cập Nhật Thông Tin Học Sinh" : "Thêm Học Sinh Mới"}
              </h3>
              
              <form onSubmit={handleAddNewStudent} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label htmlFor="student-name" style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>Họ Và Tên <span className="required">*</span></label>
                  <input 
                    type="text" 
                    id="student-name" 
                    placeholder="Ví dụ: Nguyễn Văn A" 
                    required 
                    value={newStudentName}
                    onChange={(e) => setNewStudentName(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-card)', background: 'var(--bg-card)', color: 'var(--text-primary)', marginTop: '6px' }}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="student-dob" style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>Ngày Sinh <span className="required">*</span></label>
                  <input 
                    type="date" 
                    id="student-dob" 
                    required
                    value={newStudentDob}
                    onChange={(e) => setNewStudentDob(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-card)', background: 'var(--bg-card)', color: 'var(--text-primary)', marginTop: '6px' }}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="student-gender" style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>Giới Tính <span className="required">*</span></label>
                  <select 
                    id="student-gender" 
                    required 
                    value={newStudentGender}
                    onChange={(e) => setNewStudentGender(e.target.value as "Nam" | "Nữ")}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-card)', background: 'var(--bg-card)', color: 'var(--text-primary)', marginTop: '6px' }}
                  >
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                  </select>
                </div>

                <div className="dialog-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                  <button type="button" className="btn btn-outline" onClick={() => setActiveDialog(null)}>Hủy</button>
                  <button type="submit" className="btn btn-primary">Lưu Học Sinh</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 7. Dialog: Nhập học sinh từ Excel (import-student) */}
      {activeDialog === "import-student" && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setActiveDialog(null)}>
          <div className="glass-dialog form-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '550px', width: '95%', display: 'block' }}>
            <div className="dialog-content">
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', marginBottom: '0.5rem' }}>Nhập Học Sinh Từ Excel</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                Vui lòng chọn file CSV/Excel mẫu đã nhập dữ liệu học sinh (Họ tên, Ngày sinh dạng DD/MM/YYYY, Giới tính).
              </p>
              
              <form onSubmit={handleImportStudentsSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label htmlFor="student-file-input" style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>Chọn File Dữ Liệu <span className="required">*</span></label>
                  <input 
                    type="file" 
                    id="student-file-input" 
                    accept=".csv" 
                    required 
                    onChange={handleImportFileChange}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-card)', background: 'var(--bg-card)', color: 'var(--text-primary)', marginTop: '6px' }}
                  />
                </div>

                {importError && (
                  <p style={{ color: 'var(--danger-color)', fontSize: '0.85rem', marginTop: '0.5rem', fontWeight: 500 }}>
                    {importError}
                  </p>
                )}

                {/* Preview Area */}
                {importPreviewData.length > 0 && (
                  <div style={{ marginTop: '1.2rem' }}>
                    <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--primary-color)' }}>Xem trước dữ liệu nhập mẫu</h4>
                    <div className="table-responsive" style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--border-card)', borderRadius: '6px' }}>
                      <table className="data-table" style={{ fontSize: '0.8rem', width: '100%' }}>
                        <thead>
                          <tr>
                            <th>Họ Và Tên</th>
                            <th>Ngày Sinh</th>
                            <th>Giới Tính</th>
                          </tr>
                        </thead>
                        <tbody>
                          {importPreviewData.map((item, idx) => (
                            <tr key={idx}>
                              <td>{item.HoTen}</td>
                              <td>{item.NgaySinh}</td>
                              <td>{item.GioiTinh}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                      Tìm thấy {importPreviewData.length} học sinh hợp lệ để nhập.
                    </p>
                  </div>
                )}

                <div className="dialog-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                  <button type="button" className="btn btn-outline" onClick={() => setActiveDialog(null)}>Hủy</button>
                  <button type="submit" className="btn btn-primary" disabled={importPreviewData.length === 0}>Cập Nhật</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
