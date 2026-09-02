# 🚀 Zalde Todo AI - Modern Fullstack Productivity Suite

Aplikasi manajemen tugas modern berbasis **AI & RAG (Retrieval-Augmented Generation)** dengan arsitektur type-safe dan performa tinggi.

---

## 🛠️ Tech Stack

- **Backend**: [Bun](https://bun.sh) + [Elysia.js](https://elysiajs.com) + [Drizzle ORM](https://orm.drizzle.team) + PostgreSQL (`pgvector`)
- **Frontend**: [React 19](https://react.dev) + [TypeScript](https://www.typescriptlang.org) + [Vite](https://vitejs.dev) + [Tailwind CSS v4](https://tailwindcss.com) + [Lucide Icons](https://lucide.dev)
- **AI & RAG**: Google Gemini API (`gemini-embedding-001` 768-dim & `gemini-3.5-flash-lite` / `gemini-3.6-flash`)
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

### 3. Setup Database & Seed Data Dummy
```bash
cd backend
bun run db:push
bun run db:seed
```
*Akun Demo Default: `demo@zalde.com` / `Password123!`*

### 4. Menjalankan Backend
```bash
cd backend
bun install
bun run dev
```
- API Server: `http://localhost:3001`
- Swagger API Docs: `http://localhost:3001/swagger`

### 5. Menjalankan Frontend
```bash
cd frontend
npm install
npm run dev
```
- Frontend App: `http://localhost:5173`

---

## 🧪 Pengujian & Linting (Quality Assurance)

Workspace dilengkapi pipeline testing & type safety otomatis:

```bash
# Jalankan Typecheck & Linting seluruh workspace (Backend + Frontend)
npm run lint

# Jalankan Test Suite Backend (Auth, Task CRUD, E2E, RAG Vector)
npm run test

# Jalankan Lint + Test sekaligus
npm run test:all
```

### 📊 Ringkasan Hasil Uji Kualitas Kode:
| Test Suite | File Uji | Status | Cakupan |
|---|---|---|---|
| **Backend Typecheck** | `tsc --noEmit` | ✅ PASS | 0 Type Error, 100% Type-Safe |
| **Frontend Typecheck** | `tsc -b && vite build` | ✅ PASS | 0 Type Error, Build Sukses (4.3s) |
| **API & Security** | `test/auth.test.ts` | ✅ PASS (4/4) | Standardized JSON Response, Auth Guard, Health Check |
| **E2E Task Flow** | `test/e2e.test.ts` | ✅ PASS (4/4) | Register ➔ Login ➔ Task & Subtasks CRUD ➔ Stats |
| **RAG & Vector Search** | `test/rag.test.ts` | ✅ PASS (2/2) | Text Chunking & L2-Normalized Vector Embeddings |

---

## 📅 Roadmap Rilis

- [x] **Fase 1**: Core Foundation, Auth JWT, Drizzle Schema, Task CRUD, List & Kanban View.
- [x] **Fase 2**: RAG Integration, `pgvector` Semantic Search, Gemini Task Breakdown, AI Chat Copilot Drawer.
- [ ] **Fase 3**: Automated CI/CD Data Pipeline & Production Vercel Deployment.
