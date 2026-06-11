# LEVM Backend

Backend API cho hệ thống học tiếng Anh trực tuyến LEVM.

## Tổng quan

LEVM được xây dựng để hỗ trợ người dùng học tiếng Anh trên nền tảng web với các nhóm chức năng chính:

- Học từ vựng theo chủ đề và làm bài tập từ vựng
- Học ngữ pháp và làm bài tập ngữ pháp
- Làm bài quiz
- Luyện nghe
- Theo dõi tiến độ học tập, XP, streak, thành tích và bảng xếp hạng

Hệ thống có 2 vai trò chính:

- User
- Admin

## Mục tiêu dự án

- Xây dựng trải nghiệm học tập có lộ trình và dễ theo dõi
- Cho phép quản trị viên quản lý toàn bộ nội dung học tập
- Lưu lại lịch sử học tập, kết quả làm bài và thống kê cá nhân
- Tạo cơ chế gamification với XP, streak, achievement và leaderboard

## Công nghệ sử dụng

- Backend: Node.js, Express.js, Zod
- Database: MongoDB
- Xác thực: JWT, bcryptjs
- Hỗ trợ API: cookie-parser, cors, swagger-ui-express, swagger-jsdoc
- Công cụ dev: nodemon

> Theo định hướng toàn hệ thống, phần giao diện có thể sử dụng React, TypeScript, Tailwind CSS và Shadcn trong repository frontend riêng.

## Chức năng backend hiện tại

### Xác thực

- Đăng ký tài khoản
- Đăng nhập
- Đăng xuất
- Refresh access token

### Quản lý người dùng

- Xem thông tin cá nhân
- Cập nhật thông tin cá nhân
- Đổi mật khẩu

### Quản lý ngành nghề

- Lấy danh sách nhóm ngành nghề
- Lấy danh sách ngành nghề theo nhóm
- Admin tạo mới, cập nhật và xóa nhóm ngành nghề
- Admin tạo mới và cập nhật ngành nghề

### Tài liệu API

- Swagger UI được cung cấp tại `/api-docs`

## Định hướng module của hệ thống

### 1. Module từ vựng

- Danh sách chủ đề từ vựng
- Danh sách bài học theo chủ đề
- Danh sách từ vựng theo bài học
- Xem chi tiết từ vựng
- Lưu từ vựng yêu thích
- Quản trị dữ liệu từ vựng cho Admin

### 2. Module ngữ pháp

- Danh sách bài học ngữ pháp
- Xem chi tiết bài học
- Hiển thị nội dung dưới dạng HTML
- Tìm kiếm bài học
- Đánh dấu hoàn thành và theo dõi tiến độ
- Upload tài liệu và chuyển đổi sang HTML

### 3. Module Quiz

- Danh sách bài kiểm tra
- Làm bài kiểm tra
- Xem kết quả và điểm số
- Xem lịch sử làm bài
- Quản lý câu hỏi, thời gian làm bài và đáp án đúng cho Admin

### 4. Module Listening

- Danh sách bài học Listening
- Nghe audio và làm bài tập
- Upload file audio và transcript
- Quản lý câu hỏi Listening

### 5. Module theo dõi tiến độ học tập

- Lưu bài học đã hoàn thành
- Lưu tiến độ theo từng chủ đề
- Lưu kết quả và điểm số bài kiểm tra
- Thống kê tiến độ học tập cá nhân

### 6. Module từ vựng yêu thích

- Thêm hoặc xóa từ vựng khỏi danh sách yêu thích
- Xem danh sách từ vựng đã lưu
- Ôn tập từ vựng yêu thích

### 7. Module thành tích, XP và streak

- Hệ thống huy hiệu và thành tích
- Điểm XP và cấp độ học tập
- Chuỗi học tập liên tiếp
- Bảng xếp hạng theo XP và điểm quiz

## Cấu trúc thư mục

- `src/controllers`: xử lý request/response
- `src/routes`: khai báo route
- `src/services`: xử lý nghiệp vụ
- `src/models`: schema MongoDB
- `src/middlewares`: xác thực, phân quyền, validate
- `src/validations`: schema kiểm tra dữ liệu đầu vào
- `src/libs`: cấu hình kết nối cơ sở dữ liệu
- `src/utils`: tiện ích dùng chung

## Yêu cầu môi trường

- Node.js
- MongoDB
- Một file `.env` chứa biến cấu hình cần thiết

## Cài đặt

1. Cài dependencies:

```bash
npm install
```

2. Tạo file `.env` ở thư mục gốc và khai báo các biến môi trường:

```env
PORT=5001
CLIENT_URL=http://localhost:3000
MONGODB_CONNECTIONSTRING=your_mongodb_connection_string
ACCESS_TOKEN_SECRET=your_access_token_secret
```

3. Chạy môi trường phát triển:

```bash
npm run dev
```

4. Chạy production:

```bash
npm start
```

## Scripts

- `npm run dev`: chạy server với `nodemon`
- `npm start`: chạy server bằng `node`

## API chính

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/auth/refresh`

### User

- `GET /api/users/me`
- `PATCH /api/users/me`
- `PATCH /api/users/change-password`

### Occupation categories

- `GET /api/occupation-categories`
- `POST /api/occupation-categories`
- `PATCH /api/occupation-categories/:id`
- `DELETE /api/occupation-categories/:id`

### Occupations

- `GET /api/occupations/category/:categoryId`
- `POST /api/occupations`
- `PATCH /api/occupations/:id`

## Lưu ý xác thực

- Các route bảo vệ yêu cầu header `Authorization: Bearer <accessToken>`
- Refresh token được lưu trong cookie `refreshToken`
- Các route quản trị yêu cầu role `admin`

## Ghi chú

- Repository này hiện tập trung vào phần backend cốt lõi: xác thực, người dùng và quản lý ngành nghề
- Các module học tập nâng cao như từ vựng, ngữ pháp, quiz, listening, XP và leaderboard là định hướng phát triển của hệ thống LEVM
