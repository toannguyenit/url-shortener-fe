# URL Shortener Frontend

Modern URL shortener dashboard built with Next.js 16, TypeScript, Tailwind CSS, and shadcn/ui-style components.

> **Deploy production (VPS):** [DEPLOY.md](./DEPLOY.md)  
> **Hướng dẫn start local (FE + BE):** [STARTUP.md](./STARTUP.md) | [Backend STARTUP](https://github.com/toannguyenit/url-shortener-be/blob/main/STARTUP.md)

## Features

- User authentication (register/login with JWT)
- Shorten URLs with custom alias and expiry
- Link management (CRUD, activate/deactivate)
- QR code generation
- Analytics dashboard with charts (Recharts)
- Geographic click distribution
- Dark mode support

## Prerequisites

- Node.js 20+
- Backend API running on http://localhost:8080

## Quick Start

```bash
# Install dependencies
npm install

# Configure environment
cp .env.local.example .env.local

# Start dev server
npm run dev
```

Open http://localhost:3000

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| NEXT_PUBLIC_API_URL | http://localhost:8080 | Backend API Gateway URL |
| NEXT_PUBLIC_SHORT_URL_BASE | http://localhost:8083 | Redirect service base URL |

## Docker

```bash
docker build -t url-shortener-fe .
docker run -p 3000:3000 -e NEXT_PUBLIC_API_URL=http://host.docker.internal:8080 url-shortener-fe
```

## Pages

| Route | Description |
|-------|-------------|
| `/login` | Sign in |
| `/register` | Create account |
| `/dashboard` | Overview with stats and charts |
| `/shorten` | Create new short link |
| `/links` | Manage all links |
| `/links/[id]` | Link analytics detail |

## Tech Stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS v4
- Radix UI primitives
- React Hook Form + Zod
- Axios with JWT refresh interceptor
- Recharts
- qrcode.react
- Sonner (toasts)
