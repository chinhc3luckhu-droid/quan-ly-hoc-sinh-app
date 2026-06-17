# Hệ Thống Thi Đua Học Đường (TDHD) - Next.js Version

Hệ thống quản lý, theo dõi và chấm điểm thi đua học tập và kỷ luật dành cho các lớp học phổ thông, được xây dựng lại trên nền tảng **Next.js 14 (React & TypeScript)** và tích hợp cơ sở dữ liệu đám mây **Supabase**.

Ứng dụng giữ nguyên giao diện phong cách báo in cổ điển (**Alabaster Warm Paper**), tối ưu hóa trải nghiệm người dùng bằng cách quản lý trạng thái bằng React State và đồng bộ hóa ngầm trực tuyến.

---

## ✨ Tính Năng Nổi Bật

1. **Dashboard & Bảng Xếp Hạng**: Vinh danh Top 3 lớp dẫn đầu tuần trên bục Podium và hiển thị bảng tổng sắp điểm số chi tiết của tất cả các lớp.
2. **Chấm Điểm Thi Đua (Ma Trận Vi Phạm)**: Dành cho Cờ đỏ và Admin. Nhấp chọn nhanh học sinh vi phạm, tự động tính toán điểm trừ dựa trên Quy chế thi đua.
3. **Nhật Ký Vi Phạm Hàng Ngày**: Báo cáo tổng hợp số lỗi phát sinh của từng lớp theo từng ngày trong tuần.
4. **Phân Công Cờ Đỏ**: Quản lý lịch trực tuần chéo giữa các thành viên cờ đỏ một cách rõ ràng.
5. **Quy Chế Thi Đua**: Danh mục các hành vi vi phạm & khen thưởng, hỗ trợ bật/tắt áp dụng quy chế trực tiếp.
6. **Hồ Sơ Học Sinh**: Tra cứu thông tin cá nhân học sinh, lịch sử vi phạm và thành tích đạt được trong học kỳ.
7. **Trình Giả Lập Vai Trò (Simulator Role)**: Cho phép chuyển đổi quyền xem giữa **Admin**, **Giáo viên**, và **Cờ đỏ** để kiểm tra giao diện và quyền hạn tương ứng.
8. **Đồng Bộ Hóa Ngầm (Sync Adapter)**: Lưu trữ tạm thời ở LocalStorage để thao tác phản hồi lập tức, sau đó đồng bộ ngầm lên database Supabase khi bấm "Lưu". Nếu không kết nối mạng hoặc chưa cấu hình, ứng dụng sẽ chạy offline và tải dữ liệu từ tệp fallback `db.json`.

---

## 🛠️ Hướng Dẫn Cài Đặt & Cấu Hình

### 1. Khởi Tạo Cơ Sở Dữ Liệu Supabase

Nếu bạn muốn lưu trữ dữ liệu trực tuyến trên Supabase:
1. Tạo một dự án mới trên [Supabase](https://supabase.com/).
2. Vào phần **SQL Editor** trong Supabase Dashboard -> Nhấn **New Query**.
3. Mở tệp [schema.sql](file:///c:/Users/ADMIN/Downloads/web/thidua-dashboard/schema.sql), sao chép toàn bộ nội dung SQL và dán vào ô nhập liệu của Supabase.
4. Nhấn **Run** để tạo 11 bảng cơ sở dữ liệu.

### 2. Di Cư Dữ Liệu Ban Đầu (Migration)

Để nạp dữ liệu mẫu từ tệp `db.json` lên Supabase của bạn:
1. Đảm bảo máy của bạn đã cài đặt Python 3 và thư viện `requests` (`pip install requests`).
2. Mở terminal và chạy lệnh:
   ```bash
   python migrate.py
   ```
3. Nhập **Supabase Project URL** và **Supabase Service Role Key** (lấy ở mục `Project Settings -> API` trên Supabase) khi được yêu cầu.

### 3. Cấu Hình Biến Môi Trường (Environment Variables)

Tạo tệp `.env.local` ở thư mục gốc của dự án `thidua-dashboard/` với nội dung sau:

```env
NEXT_PUBLIC_SUPABASE_URL=URL_DỰ_ÁN_SUPABASE_CỦA_BẠN
NEXT_PUBLIC_SUPABASE_ANON_KEY=PUBLIC_ANON_KEY_CỦA_BẠN
```

*Lưu ý: Nếu không cấu hình tệp này hoặc các biến môi trường trống, ứng dụng sẽ tự động chuyển sang chế độ **Offline Fallback** và đọc dữ liệu từ tệp tĩnh [public/db.json](file:///c:/Users/ADMIN/Downloads/web/thidua-dashboard/public/db.json).*

---

## 🚀 Chạy Thử Nghiệm & Triển Khai

### Chạy Cục Bộ (Local Development)

1. Cài đặt các thư viện phụ thuộc:
   ```bash
   npm install
   ```
2. Khởi động máy chủ Next.js dev server:
   ```bash
   npm run dev
   ```
3. Mở trình duyệt và truy cập: [http://localhost:3000](http://localhost:3000)

### Triển Khai Lên Vercel (Production Deploy)

1. Đẩy toàn bộ mã nguồn dự án lên một kho lưu trữ Git của bạn (ví dụ: GitHub, GitLab).
2. Đăng nhập vào trang quản lý [Vercel](https://vercel.com/) và liên kết tài khoản Git của bạn.
3. Import dự án `thidua-dashboard`.
4. Trong mục **Environment Variables**, thêm hai biến môi trường:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Nhấn **Deploy**. Vercel sẽ tự động đóng gói ứng dụng bằng lệnh `npm run build` và cung cấp đường dẫn truy cập công khai.
