# 🚀 Zalde Todo AI - Modern Fullstack Productivity Suite

Aplikasi manajemen tugas modern berbasis **AI & RAG (Retrieval-Augmented Generation)** dengan arsitektur type-safe dan performa tinggi.

[![CI/CD Pipeline](https://github.com/alberic13/todo-list-zalde/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/alberic13/todo-list-zalde/actions/workflows/ci-cd.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7+-blue.svg?logo=typescript)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-v1.3+-black.svg?logo=bun)](https://bun.sh)
[![React](https://img.shields.io/badge/React-19.0-61DAFB.svg?logo=react)](https://react.dev)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4.0-38B2AC.svg?logo=tailwind-css)](https://tailwindcss.com)
[![PostgreSQL](https://img.shields.io/badge/Neon-PostgreSQL%20(pgvector)-00E599.svg?logo=postgresql)](https://neon.tech)
[![Google Gemini](https://img.shields.io/badge/Google%20Gemini-Flash%20%2B%20Embeddings-8E75B2.svg?logo=google-gemini)](https://ai.google.dev)
[![iCalendar](https://img.shields.io/badge/iCalendar-RFC%205545%20(Webcal)-FF6B6B.svg?logo=google-calendar&logoColor=white)](https://tools.ietf.org/html/rfc5545)
[![Google Calendar](https://img.shields.io/badge/Google%20Calendar-Auto%20Sync-4285F4.svg?logo=google-calendar&logoColor=white)](https://calendar.google.com/)
[![Playwright](https://img.shields.io/badge/Playwright-E2E%20Testing-2EAD33.svg?logo=playwright&logoColor=white)](https://playwright.dev)
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

- **Backend**: [Bun](https://bun.sh) + [Elysia.js](https://elysiajs.com) + [Drizzle ORM](https://orm.drizzle.team) + PostgreSQL (`pgvector`) di [Neon](https://neon.tech) + [Upstash Redis](https://upstash.com) (Rate Limiting)
- **Frontend**: [React 19](https://react.dev) + [TypeScript](https://www.typescriptlang.org) + [Vite](https://vitejs.dev) + [Tailwind CSS v4](https://tailwindcss.com) + [Lucide Icons](https://lucide.dev)
- **Autentikasi & Keamanan**: JWT Scoped (`argon2id` hashing) + Google OAuth 2.0 SSO (`@react-oauth/google` & `google-auth-library`)
- **AI & RAG Engine**: Google Gemini API (`gemini-3.6-flash` untuk LLM/RAG Copilot + `gemini-embedding-001` untuk Semantic Vector Search 768-dim)
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
│   │   ├── controllers/        # Auth, Task, Category, AI, Calendar, & Collaboration endpoints
│   │   ├── db/                 # Database Seeder (seed.ts: demo user, tasks, subtasks & embeddings)
│   │   ├── middlewares/        # Scoped JWT Auth & Centralized Error handlers
│   │   ├── models/             # Drizzle PostgreSQL schemas (users, tasks, categories, embeddings, collaborators, chats)
│   │   ├── services/           # Auth, Task, Category, Calendar (iCal RFC 5545), Embedding, RAG, & Collaboration
│   │   ├── utils/              # Standardized response formatters (ApiResponse)
│   │   └── index.ts            # Elysia Server & Swagger API entry point
│   ├── test/                   # Bun unit & E2E integration test suites (auth, collaboration, cron, e2e, rag)
│   ├── drizzle/                # Generated Drizzle SQL migrations
│   ├── drizzle.config.ts       # Drizzle Kit migration configuration
│   ├── vercel.json             # Backend Bun runtime serverless configuration
│   └── package.json
├── frontend/                   # React 19 + TypeScript + Tailwind CSS v4 + Vite
│   ├── public/                 # Static assets & icons
│   ├── src/
│   │   ├── components/         # UI Elements, Layout, Settings, Tasks Kanban, AI Drawer
│   │   │   ├── ai/             # AiChatDrawer (Dual-Tab: Zalde AI Copilot & Task Discussion Chat)
│   │   │   ├── auth/           # AuthHero & AuthForm (Login, Register, OTP & Reset)
│   │   │   ├── layout/         # Navbar, SettingsModal (Modal container dialog)
│   │   │   ├── settings/       # CalendarTab (Google/Apple sync) & WhatsAppTab (WA reminder)
│   │   │   ├── stats/          # StatOverview & progress cards
│   │   │   ├── tasks/          # KanbanBoard, TaskCard, TaskList, TaskModal, FilterBar, TaskCollaborationSection
│   │   │   └── ui/             # Button, Input, Badge, Modal, Skeleton, BrandDots
│   │   ├── hooks/              # useAuth (remember me session), useTasks custom state hooks
│   │   ├── pages/              # Dashboard (Lazy-loaded Kanban) & AuthPage (Authentication)
│   │   ├── services/           # API client handlers (ai, auth, category, task, calendar, collaboration)
│   │   ├── types/              # TypeScript definitions & data contracts
│   │   ├── utils/              # Date formatters & styling helpers
│   │   ├── App.tsx             # Main App router & auth state wrapper
│   │   ├── index.css           # Tailwind CSS v4 theme tokens & styles
│   │   └── main.tsx            # Vite React entry point
│   ├── tests/                  # Playwright E2E browser test suites (todo-flow.spec.ts)
│   ├── playwright.config.ts    # Playwright browser testing configuration
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
3. **📅 Sinkronisasi Kalender Otomatis (iCal / Webcal & Google Calendar)**:
   - **Live Webcal Subscription Feed (RFC 5545)**: Sinkronisasi jadwal otomatis 2 arah ke Google Calendar, Apple Calendar (iOS/macOS), dan Microsoft Outlook via URL unik terenkripsi per pengguna.
   - **Auto-Filter Tugas Aktif**: Tugas ber-deadline yang aktif (*Todo*, *In Progress*) otomatis masuk kalender, dan otomatis terhapus dari kalender begitu ditandai selesai (*Done*).
   - **Checklist & Prioritas Lengkap**: Rincian subtask dan level urgensi terlampir rapi di deskripsi acara kalender.
   - **1-Click Google Calendar Action**: Tombol pintas pada modal dan dropdown menu kartu tugas untuk menambahkan tugas spesifik ke Google Calendar tanpa copy-paste.
   - **Keamanan Token Feed**: Opsi *Reset URL* (regenerate token) kapan saja dari tab Pengaturan untuk mencabut akses link kalender lama.
4. **📲 Integrasi WhatsApp Jadwal Prioritas**:
   - **Pengaturan Nomor Akun**: Simpan nomor WhatsApp pengguna langsung ke database PostgreSQL (`users.phone_number`).
   - **1-Click WhatsApp Delivery**: Zalde AI merangkum jadwal prioritas harian dan menyediakan tombol direct chat WhatsApp terformat rapi.
   - **UI/UX macOS Theme**: Trigger icon gear minimalis di navbar dengan pop-up React Portal terpusat.
5. **🔒 Keamanan, Verifikasi OTP & Manajemen Sesi**:
   - **Google Single Sign-On (SSO)**: Autentikasi 1-klik terintegrasi Google Identity Services & OAuth 2.0; akun otomatis aktif (`isVerified = true`) tanpa perlu registrasi manual atau verifikasi kode OTP.
   - **Verifikasi Email OTP**: Pengiriman kode verifikasi 6-digit aman saat pendaftaran akun via Nodemailer.
   - **1-Click Password Reset**: Alur pemulihan kata sandi dengan token terenkripsi dan batas waktu kadaluwarsa.
   - **Kontrol Sesi "Ingat Saya"**: Penyimpanan fleksibel (*LocalStorage* untuk sesi persisten vs *SessionStorage* untuk privasi perangkat umum).
   - **Upstash Redis Rate Limiter**: Proteksi endpoint AI serverless-ready untuk mencegah eksploitasi dan pembengkakan tagihan API.
6. **🚀 Optimasi Performa & Clean Code**:
   - **Frontend (Code Splitting)**: Implementasi `React.lazy()` & `Suspense` memecah *bundle* halaman `Dashboard`. Halaman Auth kini memuat lebih instan.
   - **Backend (DRY Auth Guard)**: Sentralisasi *middleware* `requireAuth` di Elysia.js menghapus redundansi cek otorisasi pada 15+ endpoint, menghasilkan kode yang jauh lebih ringkas dan *type-safe*.
7. **⏰ Auto Notification Email Reminder (H-3 & Overdue Deadline)**:
   - **Daily Automated Cron Job**: Evaluasi berkala tugas aktif setiap hari melalui Vercel Cron (`CRON_SECRET`) pada endpoint `/api/cron/reminders`.
   - **Pengingat H-3 Sebelum Deadline**: Notifikasi email otomatis 3 hari sebelum tenggat waktu tugas agar pengguna dapat mengantisipasi pekerjaan lebih awal.
   - **Peringatan Tugas Overdue**: Peringatan email untuk tugas yang telah melewati batas waktu dan belum selesai.
   - **Modern Dark-Themed Email Template**: Desain template email responsif bertema gelap profesional dengan daftar tugas, level prioritas, dan tautan langsung ke workspace.
8. **✨ Responsive Landing Hero & Glass Feature Badges**:
   - **Dynamic Feature Showcase**: Tampilan visual landing page dan form login dilengkapi badge transparan modern (*glassmorphism*): `AI Integrated`, `Semantic Search`, `Drag & Drop`, `Realtime Sync`, `Auto Notif Email H-3`, `Google, Apple & Outlook Cal`, dan `SSO Google`.
   - **Pixel-Perfect Scaling**: Tipografi dan padding dinamis menjaga keseimbangan visual desktop dan mobile tanpa merusak tombol aksi CTA.
9. **👥 Kolaborasi Tim, Invite Link & Obrolan Terpadu (1-Tab Discussion Chat)**:
   - **Instant Invite Link & Code**: Pemilik tugas (*owner*) dapat men-generate tautan undangan unik (`/join?code=...`) dan kode invite dalam 1-klik untuk dibagikan ke anggota tim.
   - **Multi-user Realtime Collaboration**: Rekan tim dapat bergabung langsung sebagai kolaborator, memperbarui status tugas (*Kanban drag-and-drop*), menandai checklist subtasks bersama, serta melihat avatar inisial anggota aktif.
   - **Akses & Otoritas Aman (Role-based Guard)**: Pemilik tugas memiliki wewenang penuh (termasuk menghapus tugas atau mengeluarkan kolaborator / *kick member*), sementara kolaborator memiliki opsi *Leave Task* tanpa merusak data task owner.
   - **1-Tab Discussion Chat di AiChatDrawer**: Drawer samping dilengkapi *Dual-Tab Switcher* terpadu: tab **Zalde AI** untuk asisten cerdas RAG dan tab **Diskusi Tugas** untuk ruang obrolan real-time per tugas.
   - **Konteks Diskusi Terfokus**: Obrolan otomatis terikat dengan tugas aktif yang dipilih, dilengkapi indikator aktivitas tugas (*pulsing green dot*), serta tombol pintas "Buka Chat Diskusi" langsung dari kartu tugas (*TaskCard*) maupun modal detail.

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

# Jalankan E2E Testing Browser Frontend (Playwright Headless)
npm run test:e2e

# Jalankan E2E Testing Browser Frontend (Playwright Interactive UI Mode)
npm run test:e2e:ui

# Jalankan Lint + Seluruh Test Sekaligus (Backend & Frontend E2E)
npm run test:all
```

### 📊 Ringkasan Hasil Uji Kualitas Kode:
| Test Suite | File Uji | Status | Cakupan |
|---|---|---|---|
| **Backend Typecheck** | `tsc --noEmit` | ✅ PASS | 0 Type Error, 100% Type-Safe |
| **Frontend Typecheck** | `tsc --noEmit` | ✅ PASS | 0 Type Error, 100% Type-Safe |
| **Frontend Build** | `tsc -b && vite build` | ✅ PASS | Production bundle terkompresi (~88 kB Gzip) |
| **API & Security** | `backend/test/auth.test.ts` | ✅ PASS (9/9) | Standardized JSON Response, Auth Guard, OTP Verification, Password Reset |
| **Task Collaboration & Chat** | `backend/test/collaboration.test.ts` | ✅ PASS (9/9) | Invite Code, Join Flow, Realtime Status Sync, Chat Discussion, Leave Task |
| **Backend E2E Flow** | `backend/test/e2e.test.ts` | ✅ PASS (4/4) | Register ➔ Login ➔ Task & Subtasks CRUD ➔ Stats |
| **RAG & Vector Search** | `backend/test/rag.test.ts` | ✅ PASS (2/2) | Text Chunking & L2-Normalized Vector Embeddings |
| **Cron Email Reminder** | `backend/test/cron.test.ts` | ✅ PASS (4/4) | Timezone WIB/UTC Bounds, Auth Guard, H-3 & Overdue Dispatch |
| **Frontend E2E Browser** | `frontend/tests/todo-flow.spec.ts` | ✅ PASS (1/1) | Real Browser: Demo Login ➔ Kanban Board ➔ Task CRUD Modal |

### 🖥️ Output Log Eksekusi QA Suite:

#### 1. Backend Test Suite (`bun test`):
```text
bun test v1.3.14 (0d9b296a)

test\auth.test.ts:
✓ API & Response Formatting Tests > should format standardized success response
✓ API & Response Formatting Tests > should format standardized error response
✓ API & Response Formatting Tests > should return healthy status from root endpoint
✓ API & Response Formatting Tests > should reject unauthorized requests to protected routes
✓ API & Response Formatting Tests > should process forgot-password request cleanly
✓ API & Response Formatting Tests > should reject reset-password with invalid token
✓ API & Response Formatting Tests > should complete full password reset flow with valid token
✓ API & Response Formatting Tests > should reject registration with disposable email domain
✓ API & Response Formatting Tests > should reject registration with nonexistent email domain

test\collaboration.test.ts:
✓ Task Collaboration & Discussion Chat Flow > should register and verify User A (Owner) and User B (Collaborator)
✓ Task Collaboration & Discussion Chat Flow > should create a task as User A and generate invite code
✓ Task Collaboration & Discussion Chat Flow > should allow User B to join task via invite code
✓ Task Collaboration & Discussion Chat Flow > should show collaborative task in User B task list with isOwner=false
✓ Task Collaboration & Discussion Chat Flow > should allow User B (collaborator) to update task status
✓ Task Collaboration & Discussion Chat Flow > should sync subtask checklist toggle between User B (collaborator) and User A (owner)
✓ Task Collaboration & Discussion Chat Flow > should list all collaborators correctly
✓ Task Collaboration & Discussion Chat Flow > should send and retrieve chat messages between User A and User B
✓ Task Collaboration & Discussion Chat Flow > should prevent User B from deleting task, but allow User B to leave task

test\cron.test.ts:
✓ Cron Daily Task Reminder (00:00 WIB / 17:00 UTC) > should calculate correct UTC bounds for Asia/Jakarta timezone
✓ Cron Daily Task Reminder (00:00 WIB / 17:00 UTC) > should reject cron requests without valid CRON_SECRET authorization
✓ Cron Daily Task Reminder (00:00 WIB / 17:00 UTC) > should reject cron requests with incorrect bearer token
✓ Cron Daily Task Reminder (00:00 WIB / 17:00 UTC) > should accept cron requests with matching CRON_SECRET and execute reminders

test\e2e.test.ts:
✓ E2E Auth & Task Flow > should register new user and complete email verification
✓ E2E Auth & Task Flow > should login with registered credentials
✓ E2E Auth & Task Flow > should create a task with subtasks
✓ E2E Auth & Task Flow > should list tasks and calculate stats

test\rag.test.ts:
✓ RAG & Embedding Unit Tests > should construct standardized chunk text accurately
✓ RAG & Embedding Unit Tests > should generate valid normalized vector embedding

 29 pass
 0 fail
 124 expect() calls
Ran 29 tests across 5 files.
```

#### 2. Frontend Browser E2E Suite (`npx playwright test`):
```text
> todo-list-zalde@1.0.0 test:e2e
> cd frontend && npm run test:e2e

> frontend@1.0.0 test:e2e
> playwright test

Running 1 test using 1 worker

[1/1] [chromium] › tests\todo-flow.spec.ts:4:3 › Zalde Todo E2E User Flow › User login and task management flow
  1 passed (10.7s)
```

---

## 📅 Roadmap Rilis

- [x] **Fase 1**: Core Foundation, Auth JWT, Drizzle Schema, Task CRUD, List & Kanban View.
- [x] **Fase 2**: RAG Integration, `pgvector` Semantic Search, Gemini Task Breakdown, AI Chat Copilot Drawer.
- [x] **Fase 3**: Integrasi WhatsApp Jadwal Prioritas, Database Profile Persistence, & UI/UX Refinements.
- [x] **Fase 4**: Automated CI/CD Data Pipeline & Production Vercel + Neon DB Deployment.
- [x] **Fase 5**: Integrasi Kalender RFC 5545 (Google, Apple, Outlook), Google Single Sign-On (SSO), Auto Notification Email Reminder H-3 via Cron Job, & Glassmorphism Hero Badges.
- [x] **Fase 6**: Kolaborasi Tim Realtime, Invite Link Instan, Multi-user Task Sharing, & 1-Tab Chat Diskusi Terpadu pada AI Drawer.
