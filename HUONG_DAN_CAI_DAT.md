# Hướng dẫn cài đặt lên Android

Đây là ứng dụng web (PWA) chạy offline — không cần Play Store.

## Cách 1 — Nhanh nhất (mở trực tiếp)
1. Copy cả thư mục `App_DuBao_XSMN` này vào điện thoại (qua cáp USB, Zalo, Google Drive...).
2. Dùng ứng dụng **Quản lý tệp** (Files) trên điện thoại, mở file `index.html` bằng **Chrome**.
3. Trong Chrome, bấm menu (⋮) → **"Thêm vào Màn hình chính"** (Add to Home screen) → app sẽ có icon riêng như app thật.
4. Toàn bộ tính năng dự báo, thống kê, lưu so sánh đều chạy được ngay (dữ liệu gốc đã nhúng sẵn trong app).

> Lưu ý: theo cách này, nút "Cập nhật dữ liệu" (lấy kết quả mới qua mạng) vẫn hoạt động bình thường vì nó gọi Internet trực tiếp, không phụ thuộc việc mở file cục bộ.

## Cách 2 — Cài như PWA đầy đủ (có biểu tượng cài đặt, chạy nền offline tốt hơn)
Cách 1 đã dùng được ngay, nhưng để Chrome hiện nút **"Cài đặt ứng dụng"** (Install app) đầy đủ như PWA chuẩn, cần mở app qua địa chỉ `http://` thay vì mở file trực tiếp:
1. Cài một ứng dụng server nhỏ trên điện thoại, ví dụ **"Simple HTTP Server"** (miễn phí trên Play Store) hoặc dùng Termux với lệnh `python -m http.server 8080`.
2. Trỏ server vào thư mục `App_DuBao_XSMN`.
3. Mở Chrome, vào `http://localhost:8080/index.html` → Chrome sẽ hiện nút cài đặt → bấm **Cài đặt**.

## Cập nhật dữ liệu về sau
- App đã có sẵn dữ liệu ~6–7 kỳ gần nhất/tỉnh (21 tỉnh miền Nam).
- Vào tab **Cài đặt** → bấm **"Cập nhật tất cả 21 tỉnh"** định kỳ (cần Internet) để dữ liệu dày dần lên tới ~50 kỳ/tỉnh.
- Nếu nút cập nhật lỗi (trang nguồn đổi cấu trúc), dùng ô **"Dán dữ liệu thủ công"**: mở trang kết quả 1 tỉnh trên minhngoc.net.vn, copy nội dung, dán vào ô đó rồi bấm Phân Tích & Nhập.

## Lưu ý quan trọng
Đây là công cụ **thống kê tham khảo** dựa trên dữ liệu quá khứ (tần suất, số gan, đầu-đuôi...). Mỗi kỳ xổ số là một sự kiện độc lập, hoàn toàn ngẫu nhiên — không có công thức nào đảm bảo trúng thưởng. Vui lòng chơi có trách nhiệm.
