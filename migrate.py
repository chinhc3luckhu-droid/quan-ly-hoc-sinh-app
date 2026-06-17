import json
import os
import sys

# Đảm bảo python package requests được cài đặt
try:
    import requests
except ImportError:
    print("Thư viện 'requests' chưa được cài đặt. Đang tiến hành cài đặt tự động...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "requests"])
    import requests

# Bản đồ ánh xạ giữa kho khóa LocalStorage/JSON và Tên bảng Supabase
TABLE_MAPPING = {
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

def migrate():
    print("=== CHƯƠNG TRÌNH DI CƯ DỮ LIỆU LÊN CLOUD SUPABASE ===")
    
    # 1. Nhập thông tin kết nối
    if len(sys.argv) > 2:
        supabase_url = sys.argv[1].strip()
        supabase_service_key = sys.argv[2].strip()
    else:
        supabase_url = input("Nhập Supabase Project URL (ví dụ: https://xxxx.supabase.co): ").strip()
        supabase_service_key = input("Nhập Supabase Service Role Key hoặc Anon Key: ").strip()

    if not supabase_url.startswith("http"):
        print("URL không hợp lệ. Vui lòng nhập đầy đủ cả 'https://'")
        return
        
    if not supabase_service_key:
        print("Key không được để trống!")
        return

    # Chuẩn hóa URL
    supabase_url = supabase_url.rstrip("/")

    # 2. Đọc db.json
    db_path = "db.json"
    if not os.path.exists(db_path):
        print(f"Lỗi: Không tìm thấy tệp {db_path} tại thư mục hiện hành.")
        return

    print("Đang đọc tệp db.json...")
    with open(db_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    # 3. Đẩy dữ liệu tuần tự
    headers = {
        "apikey": supabase_service_key,
        "Authorization": f"Bearer {supabase_service_key}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates"  # Upsert trên Postgres
    }

    # Thứ tự đẩy để tránh lỗi khóa ngoại (Lớp, Tuần, Tiêu chí trước, Học sinh/Người dùng tiếp, v.v.)
    insert_order = [
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

    for key in insert_order:
        if key not in data:
            print(f"Bỏ qua {key} (Không tìm thấy trong db.json).")
            continue
            
        table_name = TABLE_MAPPING[key]
        records = data[key]
        
        # Nếu là chuỗi JSON mã hóa trong db.json, parse nó ra
        if isinstance(records, str):
            records = json.loads(records)

        if not records:
            print(f"Bỏ qua bảng '{table_name}' (Bảng trống).")
            continue

        print(f"Đang đẩy {len(records)} bản ghi vào bảng '{table_name}'...")
        endpoint = f"{supabase_url}/rest/v1/{table_name}"
        
        try:
            response = requests.post(endpoint, headers=headers, json=records)
            if response.status_code in [200, 201, 204]:
                print(f"-> Đẩy bảng '{table_name}' THÀNH CÔNG!")
            else:
                print(f"-> Lỗi đẩy bảng '{table_name}': Mã lỗi {response.status_code}")
                print(f"Chi tiết: {response.text}")
        except Exception as e:
            print(f"-> Thất bại kết nối đến bảng '{table_name}': {str(e)}")

    print("\n=== HOÀN THÀNH QUÁ TRÌNH DI CƯ ===")
    print("Vui lòng kiểm tra các bảng trên Dashboard của Supabase.")

if __name__ == "__main__":
    migrate()
