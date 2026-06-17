import json

# Đọc dữ liệu từ db.json
with open("db.json", "r", encoding="utf-8") as f:
    db = json.load(f)

# Ánh xạ bảng
mapping = {
    "TDHD_DanhMucLop": "DanhMucLop",
    "TDHD_DanhMucTuan": "DanhMucTuan",
    "TDHD_QuyDinhThiDua": "QuyDinhThiDua",
    "TDHD_DanhSachHocSinh": "DanhSachHocSinh",
    "TDHD_NguoiDung": "NguoiDung",
    "TDHD_PhanCongCoDo": "PhanCongCoDo",
    "TDHD_ChiTietViPhamHocSinh": "ChiTietViPhamHocSinh",
    "TDHD_ChiTietThanhTichHocSinh": "ChiTietThanhTichHocSinh",
    "TDHD_NhatKyViPhamHangNgay": "NhatKyViPhamHangNgay",
    "TDHD_ThanhTichHocTapTheoTuan": "ThanhTichHocTapTheoTuan",
    "TDHD_TongKetThiDuaTuan": "TongKetThiDuaTuan"
}

order = [
    "TDHD_DanhMucLop",
    "TDHD_DanhMucTuan",
    "TDHD_QuyDinhThiDua",
    "TDHD_DanhSachHocSinh",
    "TDHD_NguoiDung",
    "TDHD_PhanCongCoDo",
    "TDHD_ChiTietViPhamHocSinh",
    "TDHD_ChiTietThanhTichHocSinh",
    "TDHD_NhatKyViPhamHangNgay",
    "TDHD_ThanhTichHocTapTheoTuan",
    "TDHD_TongKetThiDuaTuan"
]

sql_output = []

def escape_val(v):
    if v is None:
        return "NULL"
    if isinstance(v, bool):
        return "TRUE" if v else "FALSE"
    if isinstance(v, (int, float)):
        return str(v)
    v_str = str(v).replace("'", "''")
    return f"'{v_str}'"

# Thiết lập transaction để thực thi an toàn
sql_output.append("BEGIN;")
sql_output.append("")

for local_key in order:
    if local_key not in db:
        continue
    table_name = mapping[local_key]
    records = db[local_key]
    if isinstance(records, str):
        records = json.loads(records)
    if not records:
        continue
        
    sql_output.append(f"-- ============================================================================")
    sql_output.append(f"-- BẢNG: {table_name}")
    sql_output.append(f"-- ============================================================================")
    
    for rec in records:
        columns = [f'"{col}"' for col in rec.keys()]
        values = [escape_val(val) for val in rec.values()]
        sql_output.append(f'INSERT INTO "{table_name}" ({", ".join(columns)}) VALUES ({", ".join(values)}) ON CONFLICT DO NOTHING;')
    sql_output.append("")

sql_output.append("COMMIT;")

# Ghi ra file seed.sql
with open("seed.sql", "w", encoding="utf-8") as f:
    f.write("\n".join(sql_output))

print("Đã tạo thành công tệp seed.sql với toàn bộ dữ liệu INSERT!")
