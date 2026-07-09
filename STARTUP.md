# Hướng dẫn chạy Frontend

> Hướng dẫn đầy đủ cho cả FE + BE: xem [`../url-shortener-be/STARTUP.md`](../url-shortener-be/STARTUP.md)

## Yêu cầu

- Node.js 20+
- Backend API Gateway chạy tại http://localhost:8080

## Quick Start

```bash
cd ~/Documents/url-shortener-fe

# 1. Cài dependencies
npm install

# 2. Tạo file env (lần đầu)
cp .env.local.example .env.local

# 3. Chạy dev server
npm run dev
```

Mở http://localhost:3000

## Biến môi trường (`.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_SHORT_URL_BASE=http://localhost:8083
```

| Biến | Mô tả |
|------|--------|
| `NEXT_PUBLIC_API_URL` | URL API Gateway |
| `NEXT_PUBLIC_SHORT_URL_BASE` | Base URL cho short link (redirect service) |

## Scripts

| Lệnh | Mô tả |
|------|--------|
| `npm run dev` | Dev server (hot reload) |
| `npm run build` | Build production |
| `npm run start` | Chạy bản production (sau `build`) |
| `npm run lint` | Kiểm tra ESLint |

## Chạy bằng Docker

```bash
docker build -t url-shortener-fe .
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_API_URL=http://host.docker.internal:8080 \
  -e NEXT_PUBLIC_SHORT_URL_BASE=http://host.docker.internal:8083 \
  url-shortener-fe
```

Hoặc dùng Docker Compose từ repo backend (đã include frontend):

```bash
cd ~/Documents/url-shortener-be
docker compose up -d --build
```

## Các trang

| Route | Chức năng |
|-------|-----------|
| `/register` | Đăng ký |
| `/login` | Đăng nhập |
| `/dashboard` | Tổng quan + biểu đồ |
| `/shorten` | Tạo short link + QR |
| `/links` | Quản lý links |
| `/links/[id]` | Analytics chi tiết |

## Lưu ý

- Backend phải chạy **trước** khi mở frontend
- JWT lưu trong `localStorage` — xóa cache nếu gặp lỗi auth
- Short link redirect qua port **8083**, không qua frontend
