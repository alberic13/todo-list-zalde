# 🚀 Zalde Todo AI - Modern Fullstack Productivity Suite

Aplikasi manajemen tugas modern berbasis **AI & RAG (Retrieval-Augmented Generation)** dengan arsitektur type-safe dan performa tinggi.

[![CI/CD Pipeline](https://github.com/alberic13/todo-list-zalde/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/alberic13/todo-list-zalde/actions/workflows/ci-cd.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7+-blue.svg?logo=typescript)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-v1.3+-black.svg?logo=bun)](https://bun.sh)
[![React](https://img.shields.io/badge/React-19.0-61DAFB.svg?logo=react)](https://react.dev)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4.0-38B2AC.svg?logo=tailwind-css)](https://tailwindcss.com)
[![PostgreSQL](https://img.shields.io/badge/Neon-PostgreSQL%20(pgvector)-00E599.svg?logo=postgresql)](https://neon.tech)
[![Google Gemini](https://img.shields.io/badge/Google%20Gemini-Flash%20%2B%20Embeddings-8E75B2.svg?logo=google-gemini)](https://ai.google.dev)
[![Vercel Deployment](https://img.shields.io/badge/Deploy-Vercel-000000.svg?logo=vercel)](https://todo-list-zalde.vercel.app/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 🌐 Live Demo & Akses Aplikasi

| Layanan | URL Akses | Deskripsi |
|---|---|---|
| 🖥️ **Web App (Frontend)** | [https://todo-list-zalde.vercel.app/](https://todo-list-zalde.vercel.app/) | Dashboard Kanban, Task CRUD, AI Chat Copilot |
| 📚 **Swagger API Docs** | [https://todo-list-zalde-backend.vercel.app/swagger](https://todo-list-zalde-backend.vercel.app/swagger) | Dokumentasi interaktif OpenAPI / Swagger Elysia |
| ⚡ **Backend Health Endpoint** | [https://todo-list-zalde-backend.vercel.app/](https://todo-list-zalde-backend.vercel.app/) | Root JSON health check status |

### 👤 Kredensial Akun Demo (Pre-seeded di Neon DB):
- **Email**: `demo@zalde.com`
- **Password**: `Password123!`
- *(Tersedia juga tombol **Login Cepat** di halaman login untuk autofill otomatis)*

---

## 🛠️ Tech Stack

- **Backend**: [Bun](https://bun.sh) + [Elysia.js](https://elysiajs.com) + [Drizzle ORM](https://orm.drizzle.team) + PostgreSQL (`pgvector`) di [Neon](https://neon.tech)
- **Frontend**: [React 19](https://react.dev) + [TypeScript](https://www.typescriptlang.org) + [Vite](https://vitejs.dev) + [Tailwind CSS v4](https://tailwindcss.com) + [Lucide Icons](https://lucide.dev)
- **AI & RAG Engine**: Google Gemini API (`gemini-embedding-001` 768-dim normalized embeddings + `gemini-3.5-flash-lite` / `gemini-3.6-flash`)
- **CI/CD & Cloud Hosting**: Vercel Serverless (Bun & Node runtime) + GitHub Actions CI/CD Pipeline

---

## 📁 Struktur Direktori Workspace

```text
todo-list-zalde/
├── .github/
│   └── workflows/
│       └── ci-cd.yml           # GitHub Actions Quality Gate & CI/CD Pipeline
├── backend/                    # Bun + Elysia.js + Drizzle ORM + pgvector
│   ├── src/
│   │   ├── config/             # DB (Neon), AI (Gemini client), & Env config
│   │   ├── controllers/        # Auth (Profile & Phone), Task, Category, AI endpoints
│   │   ├── middlewares/        # JWT Auth & Centralized Error handlers
│   │   ├── models/             # Drizzle PostgreSQL schemas (users.phone_number, tasks, vectors)
│   │   ├── services/           # Auth, Task, Category, Embedding, & RAG logic
│   │   ├── utils/              # Standardized response formatters
│   │   └── index.ts            # Elysia Server & Swagger API entry point
│   ├── test/                   # Bun unit & E2E integration test suites
│   ├── drizzle.config.ts       # Drizzle Kit migration configuration
│   ├── vercel.json             # Backend Bun runtime serverless configuration
│   └── package.json
├── frontend/                   # React 19 + TypeScript + Tailwind CSS v4 + Vite
│   ├── public/                 # Static assets & icons
│   ├── src/
│   │   ├── components/         # UI Elements (Modal with Portal), Layout (Navbar & SettingsModal), Tasks, AI Drawer
│   │   │   ├── ai/             # AiChatDrawer (WhatsApp 1-Click share & contextual copilot)
│   │   │   ├── auth/           # AuthHero & AuthForm (Refactored Clean Code login components)
│   │   │   ├── layout/         # Navbar (Mac-style gear trigger), SettingsModal (WhatsApp phone setup)
│   │   │   ├── stats/          # StatOverview & progress cards
│   │   │   ├── tasks/          # KanbanBoard, TaskCard, TaskList, TaskModal, FilterBar
│   │   │   └── ui/             # Button, Input, Badge, Modal, Skeleton, BrandDots
│   │   ├── hooks/              # useAuth (with profile & phone state), useTasks custom state hooks
│   │   ├── pages/              # Dashboard (Kanban workspace) & AuthPage (Wrapper layout)
│   │   ├── services/           # Axios/Fetch API client & error handling
│   │   ├── types/              # TypeScript definitions & data contracts
│   │   └── utils/              # Date formatters & styling helpers
│   ├── index.html
│   ├── vite.config.ts
│   ├── vercel.json             # Frontend SPA route rewrites configuration
│   └── package.json
├── vercel.json                 # Multi-service monorepo deployment orchestration
├── PRD.md                      # Product Requirement Document & Specifications
├── package.json                # Root workspace orchestrator (lint, test, build scripts)
└── README.md
```

---

## ✨ Fitur Utama (Features)

1. **📋 Manajemen Tugas & Visualisasi Kanban**:
   - CRUD Todo, subtasks checklist bertingkat, kategori kustom dengan warna unik.
   - Status tracking interaktif (*Todo*, *In Progress*, *Done*) & filter prioritas (*Low*, *Medium*, *High*, *Urgent*).
2. **🧠 AI Assistant dengan RAG (Retrieval-Augmented Generation)**:
   - Floating Copilot drawer cerdas yang memahami konteks seluruh tugas tersimpan via semantic vector search.
   - **Semantic Search Engine**: Pencarian tugas berdasarkan makna bahasa alami.
   - **AI Task Decomposition (Breakdown)**: Memecah tugas besar menjadi subtasks otomatis dalam 1 klik.
3. **📲 Integrasi WhatsApp Jadwal Prioritas**:
   - **Pengaturan Nomor Akun**: Simpan nomor WhatsApp pengguna langsung ke database PostgreSQL (`users.phone_number`).
   - **1-Click WhatsApp Delivery**: Zalde AI merangkum jadwal prioritas harian dan menyediakan tombol direct chat WhatsApp terformat rapi.
   - **UI/UX macOS Theme**: Trigger icon gear minimalis di navbar dengan pop-up React Portal terpusat.
4. **🔒 Keamanan & Type-Safety End-to-End**:
   - Autentikasi JWT dengan password hashing Argon2id.
   - Validasi schema input TypeBox & proteksi SQL Injection via Drizzle ORM.

---

## ⚡ Panduan Menjalankan Project

### 1. Prasyarat
- [Bun](https://bun.sh) (v1.1+)
- [Node.js](https://nodejs.org) (v20+)
- PostgreSQL Database ([Neon](https://neon.tech) / Local Postgres)

### 2. Setup Environment
Salin file `.env.example` ke `backend/.env`:
```bash
cp .env.example backend/.env
```
Sesuaikan `DATABASE_URL`, `JWT_SECRET`, dan `GEMINI_API_KEY`.

### 3. Setup Database & Seed Data Dummy ke Neon
```bash
cd backend
bun run db:push
bun run db:seed
```

### 4. Menjalankan Backend Lokal
```bash
cd backend
bun install
bun run dev
```
- API Server: `http://localhost:3001`
- Swagger API Docs: `http://localhost:3001/swagger`

### 5. Menjalankan Frontend Lokal
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
| **Frontend Typecheck** | `tsc --noEmit` | ✅ PASS | 0 Type Error, 100% Type-Safe |
| **Frontend Build** | `tsc -b && vite build` | ✅ PASS | Production bundle terkompresi (~88 kB Gzip) |
| **API & Security** | `test/auth.test.ts` | ✅ PASS (4/4) | Standardized JSON Response, Auth Guard, Health Check |
| **E2E Task Flow** | `test/e2e.test.ts` | ✅ PASS (4/4) | Register ➔ Login ➔ Task & Subtasks CRUD ➔ Stats |
| **RAG & Vector Search** | `test/rag.test.ts` | ✅ PASS (2/2) | Text Chunking & L2-Normalized Vector Embeddings |

### 🖥️ Output Log Eksekusi QA Suite (`npm run test:all`):
```text
> todo-list-zalde@1.0.0 test:all
> npm run lint && npm run test

> todo-list-zalde@1.0.0 lint
> npm run lint:backend && npm run lint:frontend

> todo-list-zalde@1.0.0 lint:backend
> cd backend && bun run typecheck

$ tsc --noEmit

> todo-list-zalde@1.0.0 lint:frontend
> cd frontend && npm run lint

> frontend@1.0.0 lint
> tsc --noEmit

> todo-list-zalde@1.0.0 test
> cd backend && bun test

bun test v1.3.14 (0d9b296a)

test\auth.test.ts:
✓ API & Response Formatting Tests > should format standardized success response
✓ API & Response Formatting Tests > should format standardized error response
✓ API & Response Formatting Tests > should return healthy status from root endpoint
✓ API & Response Formatting Tests > should reject unauthorized requests to protected routes

test\e2e.test.ts:
✓ E2E Auth & Task Flow > should register new user
✓ E2E Auth & Task Flow > should login with registered credentials
✓ E2E Auth & Task Flow > should create a task with subtasks
✓ E2E Auth & Task Flow > should list tasks and calculate stats

test\rag.test.ts:
✓ RAG & Embedding Unit Tests > should construct standardized chunk text accurately
✓ RAG & Embedding Unit Tests > should generate valid normalized vector embedding

 10 pass
 0 fail
 38 expect() calls
Ran 10 tests across 3 files. [10.97s]
```

---

## 📅 Roadmap Rilis

- [x] **Fase 1**: Core Foundation, Auth JWT, Drizzle Schema, Task CRUD, List & Kanban View.
- [x] **Fase 2**: RAG Integration, `pgvector` Semantic Search, Gemini Task Breakdown, AI Chat Copilot Drawer.
- [x] **Fase 3**: Integrasi WhatsApp Jadwal Prioritas, Database Profile Persistence, & UI/UX Refinements.
- [x] **Fase 4**: Automated CI/CD Data Pipeline & Production Vercel + Neon DB Deployment.
