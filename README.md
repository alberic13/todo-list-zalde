# 🚀 Zalde Todo AI - Modern Fullstack Productivity Suite

Aplikasi manajemen tugas modern berbasis **AI & RAG (Retrieval-Augmented Generation)** dengan arsitektur type-safe dan performa tinggi.

---

## 🛠️ Tech Stack

- **Backend**: [Bun](https://bun.sh) + [Elysia.js](https://elysiajs.com) + [Drizzle ORM](https://orm.drizzle.team) + PostgreSQL (`pgvector`)
- **Frontend**: [React 19](https://react.dev) + [TypeScript](https://www.typescriptlang.org) + [Vite](https://vitejs.dev) + [Tailwind CSS v4](https://tailwindcss.com) + [Lucide Icons](https://lucide.dev)
- **AI & RAG**: Google Gemini API (`text-embedding-004` & `gemini-1.5/2.0-flash`)
- **Deployment**: Vercel Serverless + GitHub Actions

---

## 📁 Struktur Direktori

```text
todo-list-zalde/
├── .github/workflows/ci-cd.yml # GitHub Actions CI/CD Pipeline
├── backend/                    # Bun + Elysia.js + Drizzle ORM
│   ├── src/
│   │   ├── config/             # DB & Environment config
│   │   ├── controllers/        # Auth, Task, Category handlers
│   │   ├── middlewares/        # JWT Auth & Global Error handlers
│   │   ├── models/             # Drizzle PostgreSQL + pgvector schemas
│   │   ├── services/           # Business logic
│   │   └── index.ts            # Elysia Server & Swagger API
│   ├── drizzle.config.ts
│   └── package.json
├── frontend/                   # React 19 + Tailwind CSS v4 + Vite
│   ├── src/
│   │   ├── components/         # UI, Layout, Tasks, Stats
│   │   ├── hooks/              # useAuth, useTasks
│   │   ├── pages/              # Dashboard, AuthPage
│   │   ├── services/           # API Client
│   │   └── types/              # TypeScript definitions
│   ├── index.html
│   └── vite.config.ts
├── vercel.json                 # Vercel Deployment Orchestration
├── PRD.md                      # Product Requirement Document
└── README.md
```

---

## ⚡ Panduan Menjalankan Project

### 1. Prasyarat
- [Bun](https://bun.sh) (v1.1+)
- [Node.js](https://nodejs.org) (v20+)
- PostgreSQL Database (Neon / Supabase / Local)

### 2. Setup Environment
Salin file `.env.example` ke `backend/.env`:
```bash
cp .env.example backend/.env
```

Sesuaikan `DATABASE_URL` dan `JWT_SECRET`.

### 3. Menjalankan Backend
```bash
cd backend
bun install
bun run dev
```
- API Server: `http://localhost:3001`
- Swagger API Docs: `http://localhost:3001/swagger`

### 4. Menjalankan Frontend
```bash
cd frontend
npm install
npm run dev
```
- Frontend App: `http://localhost:5173`

---

## 📅 Roadmap Rilis

- [x] **Fase 1**: Core Foundation, Auth JWT, Drizzle Schema, Task CRUD, List & Kanban View.
- [x] **Fase 2**: RAG Integration, `pgvector` Semantic Search, Gemini Task Breakdown, AI Chat Copilot Drawer.
- [ ] **Fase 3**: Automated CI/CD Data Pipeline & Production Vercel Deployment.
