# Hướng dẫn Deploy Frontend lên VPS (Production)

Tài liệu triển khai cho **url-shortener-fe** — Next.js, Docker, GHCR, CI/CD.

**Hạ tầng chung (VPS, DNS, SSL, MongoDB, Nginx):** xem [url-shortener-be/DEPLOY.md](https://github.com/toannguyenit/url-shortener-be/blob/main/DEPLOY.md).

---

## Mục lục

1. [Vai trò Frontend trong hệ thống](#1-vai-trò-frontend-trong-hệ-thống)
2. [URL production](#2-url-production)
3. [Điểm quan trọng: biến môi trường build-time](#3-điểm-quan-trọng-biến-môi-trường-build-time)
4. [Cấu hình GitHub (CI/CD)](#4-cấu-hình-github-cicd)
5. [Deploy lần đầu](#5-deploy-lần-đầu)
6. [CI/CD workflow](#6-cicd-workflow)
7. [Deploy thủ công trên VPS](#7-deploy-thủ-công-trên-vps)
8. [Rebuild FE khi đổi domain](#8-rebuild-fe-khi-đổi-domain)
9. [Kiểm tra sau deploy](#9-kiểm-tra-sau-deploy)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Vai trò Frontend trong hệ thống

Frontend là **Next.js 16** dashboard:

- Đăng ký / đăng nhập (JWT)
- Tạo & quản lý short link
- QR code, analytics charts

Trên production, FE chạy trong Docker container `urlshortener-frontend`, phía sau Nginx:

```
Browser → https://urlshort.toannguyenit.cloud → nginx → frontend:3000
Browser → https://api-urlshort.toannguyenit.cloud → nginx → api-gateway:8080
```

FE **không** deploy đứng một mình — cần backend + infra đã chạy (xem repo BE).

---

## 2. URL production

| Mục đích | URL |
|----------|-----|
| Dashboard | https://urlshort.toannguyenit.cloud |
| API (gateway) | https://api-urlshort.toannguyenit.cloud |
| Short link | https://go-urlshort.toannguyenit.cloud/{code} |

---

## 3. Điểm quan trọng: biến môi trường build-time

Next.js nhúng `NEXT_PUBLIC_*` **lúc build**, không đổi được khi container đã chạy.

| Biến | Ví dụ production | Mô tả |
|------|------------------|-------|
| `NEXT_PUBLIC_API_URL` | `https://api-urlshort.toannguyenit.cloud` | Base URL gọi API |
| `NEXT_PUBLIC_SHORT_URL_BASE` | `https://go-urlshort.toannguyenit.cloud` | Prefix hiển thị short link |

Nếu build thiếu hoặc sai → browser gọi `http://localhost:8080` → lỗi:

> *Cannot connect to server. Make sure the backend is running on port 8080.*

**Giải pháp:** rebuild image với `--build-arg` đúng (xem mục 8).

File liên quan:

- `Dockerfile` — nhận `ARG NEXT_PUBLIC_API_URL`
- `src/lib/api.ts` — `const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"`

---

## 4. Cấu hình GitHub (CI/CD)

### 4.1 Secrets (bắt buộc cho auto-deploy)

Repo **url-shortener-fe** → **Settings → Secrets and variables → Actions → Secrets**

| Secret | Ví dụ |
|--------|-------|
| `VPS_HOST` | `103.252.93.178` |
| `VPS_USER` | `root` |
| `VPS_PASSWORD` | Mật khẩu SSH VPS |

> Workflow dùng `password`, không cần `VPS_SSH_KEY`.

### 4.2 Variables (khuyến nghị)

**Settings → Variables** (tab Variables, không phải Secrets)

| Variable | Value |
|----------|-------|
| `API_URL` | `https://api-urlshort.toannguyenit.cloud` |
| `SHORT_URL_BASE` | `https://go-urlshort.toannguyenit.cloud` |

Nếu không set Variables, workflow dùng **giá trị mặc định** trong `.github/workflows/deploy.yml`.

### 4.3 Package GHCR

Image: `ghcr.io/toannguyenit/url-shortener-fe:latest`

GitHub → **Packages** → `url-shortener-fe` → **Public** (để VPS pull không bị 403).

---

## 5. Deploy lần đầu

### Điều kiện tiên quyết (làm trước — repo BE)

1. VPS có Docker
2. DNS trỏ 3 subdomain
3. File deploy trong `/opt/url-shortener/` (từ repo BE)
4. SSL + `./infra-up.sh` + backend images đã pull
5. GitHub Secrets đã cấu hình

### Build image lần đầu

```bash
# Push code
git push origin main
```

Hoặc: **Actions → Build & Deploy Frontend → Run workflow**

Đợi job **build-and-push** xanh (~3–5 phút).

### Trên VPS (nếu CI deploy fail hoặc làm tay)

```bash
cd /opt/url-shortener

docker compose --env-file .env -f app/docker-compose.yml pull frontend

docker compose --env-file .env -f app/docker-compose.yml up -d --no-deps frontend nginx
```

---

## 6. CI/CD workflow

File: `.github/workflows/deploy.yml`

### Job 1: `build-and-push`

1. Checkout code
2. `docker build` với:
   - `NEXT_PUBLIC_API_URL=${{ vars.API_URL || 'https://api-urlshort...' }}`
   - `NEXT_PUBLIC_SHORT_URL_BASE=${{ vars.SHORT_URL_BASE || 'https://go-urlshort...' }}`
3. Push `ghcr.io/toannguyenit/url-shortener-fe:latest`

### Job 2: `deploy`

SSH vào VPS → pull image mới → restart `frontend` + `nginx`.

```
push main → build FE image → GHCR → SSH VPS → pull frontend → up -d
```

**Lưu ý:** Mỗi lần đổi `API_URL` / domain → phải **rebuild** (push code hoặc Run workflow), không chỉ restart container.

---

## 7. Deploy thủ công trên VPS

```bash
cd /opt/url-shortener

# Luôn dùng --env-file
docker compose --env-file .env -f app/docker-compose.yml pull frontend
docker compose --env-file .env -f app/docker-compose.yml up -d --no-deps frontend nginx

docker compose --env-file .env -f app/docker-compose.yml ps
```

---

## 8. Rebuild FE khi đổi domain

### Cách A — GitHub Actions (khuyến nghị)

1. Sửa Variables `API_URL`, `SHORT_URL_BASE`
2. Push `main` hoặc Run workflow
3. Trên VPS: `pull frontend` + `up -d` (hoặc đợi job deploy)

### Cách B — Build trực tiếp trên VPS

```bash
cd /tmp
rm -rf url-shortener-fe
git clone https://github.com/toannguyenit/url-shortener-fe.git
cd url-shortener-fe

docker build \
  --build-arg NEXT_PUBLIC_API_URL=https://api-urlshort.toannguyenit.cloud \
  --build-arg NEXT_PUBLIC_SHORT_URL_BASE=https://go-urlshort.toannguyenit.cloud \
  -t ghcr.io/toannguyenit/url-shortener-fe:latest .

cd /opt/url-shortener
# KHÔNG pull — sẽ ghi đè image vừa build
docker compose --env-file .env -f app/docker-compose.yml up -d --no-deps frontend nginx
```

---

## 9. Kiểm tra sau deploy

### API backend (tách biệt — phải UP trước)

```bash
curl -s https://api-urlshort.toannguyenit.cloud/actuator/health
```

### FE có đúng API URL không

```bash
# Phải thấy "api-urlshort", KHÔNG "localhost:8080"
curl -s https://urlshort.toannguyenit.cloud/_next/static/chunks/1t29acn7-o4p6.js \
  | grep -o 'api-urlshort\|localhost:8080' | head -1
```

### Browser

1. Mở https://urlshort.toannguyenit.cloud
2. Hard refresh: `Ctrl+Shift+R` (Mac: `Cmd+Shift+R`)
3. Đăng ký → tạo link → copy short URL

---

## 10. Troubleshooting

| Vấn đề | Nguyên nhân | Giải pháp |
|--------|-------------|-----------|
| "Cannot connect... port 8080" | Image build với localhost | Rebuild với `NEXT_PUBLIC_API_URL` đúng (mục 8) |
| `missing server host` (Actions) | Thiếu `VPS_HOST` | Thêm Secrets |
| Deploy fail, build OK | Thiếu `VPS_PASSWORD` | Thêm Secret `VPS_PASSWORD` (mật khẩu SSH VPS) |
| `403` pull image | Package private | Public **từng** package trên GitHub Packages |
| Trang trắng / 502 | nginx hoặc FE down | `docker logs urlshortener-frontend` |
| CORS error (khác 8080) | Sai `FRONTEND_URL` trên VPS `.env` | Sửa BE `.env`, restart gateway |
| Đổi domain nhưng FE vẫn URL cũ | Chưa rebuild | Run workflow + pull image mới |
| Analytics không có click | RabbitMQ lỗi | Xem logs `urlshortener-analytics`; kiểm tra `RABBITMQ_VHOST` |

---

## Local dev vs Production

| | Local | Production |
|---|-------|------------|
| API URL | `http://localhost:8080` | `https://api-urlshort.toannguyenit.cloud` |
| Config file | `.env.local` | Docker build-args / GitHub Variables |
| Chạy | `npm run dev` | Docker trên VPS |

Xem thêm: [STARTUP.md](./STARTUP.md) (phát triển local).

---

## Liên kết tài liệu

- [ARCHITECTURE.md](./ARCHITECTURE.md) — cấu trúc & tech stack frontend
- [Backend DEPLOY.md](https://github.com/toannguyenit/url-shortener-be/blob/main/DEPLOY.md) — VPS, DNS, SSL, infra
- [Backend ARCHITECTURE.md](https://github.com/toannguyenit/url-shortener-be/blob/main/ARCHITECTURE.md) — kiến trúc full system

---

## Checklist FE go-live

- [ ] Variables `API_URL`, `SHORT_URL_BASE` trên GitHub
- [ ] Secrets `VPS_HOST`, `VPS_USER`, `VPS_PASSWORD`
- [ ] Package `url-shortener-fe` public trên GHCR
- [ ] Workflow build xanh
- [ ] Bundle JS không còn `localhost:8080`
- [ ] Đăng ký / đăng nhập / tạo link OK trên browser

**Live:** https://urlshort.toannguyenit.cloud
