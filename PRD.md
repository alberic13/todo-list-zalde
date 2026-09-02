# 📋 Product Requirement Document (PRD)
# Modern Fullstack AI-Powered Todo List Web App
**With RAG (Retrieval-Augmented Generation) & Automated CI/CD Data Pipelines**

> **Tech Stack Summary**:
> - **Backend**: Bun + Elysia.js (TypeBox, JWT, CORS, Swagger)
> - **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS v4 + Lucide Icons
> - **Database & Vector DB**: PostgreSQL (`pgvector` enabled on Neon / Supabase) + Drizzle ORM
> - **AI & RAG Engine**: Google Gemini API (Embedding `text-embedding-004` & LLM `gemini-1.5/2.0-flash`)
> - **Deployment & CI/CD**: Vercel Serverless + GitHub Actions Pipeline

---

## 1. 📌 Overview & Product Goals

### 1.1 Ringkasan Eksekutif
Aplikasi web **AI-Powered Todo List & Productivity Suite** yang mengintegrasikan manajemen tugas modern dengan kecerdasan buatan berbasis **RAG (Retrieval-Augmented Generation)**. Pengguna tidak hanya dapat mencatat dan mengorganisir tugas (List & Kanban View), tetapi juga dapat berinteraksi dengan **AI Productivity Assistant** yang memahami seluruh konteks tugas pengguna secara cerdas melalui pencarian semantik (vektor) dan otomatisasi dekomposisi tugas.

### 1.2 Value Proposition
1. **AI Assistant dengan Konteks Pribadi (RAG)**: AI menjawab pertanyaan seputar beban kerja harian dan memberikan saran prioritas berdasarkan data tugas pengguna yang tersimpan di database.
2. **Pencarian Semantik (Semantic Search)**: Mencari tugas berdasarkan makna kontekstual (contoh: mencari *"pekerjaan desain grafis"* akan memunculkan *"Bikin mockup logo Figma"* meskipun tidak mengandung kata kunci yang sama).
3. **AI Task Decomposition**: Memecah satu tugas besar menjadi daftar subtasks actionable secara otomatis dalam 1 klik.
4. **End-to-End Type Safety & Kecepatan**: Bun + Elysia.js + Drizzle ORM + PostgreSQL `pgvector`.
5. **Automated Pipelines**: Pipeline embedding data otomatis & CI/CD pipeline dari push kode hingga deploy Vercel.

---

## 2. 👥 User Personas & User Stories

### 2.1 Target Persona
- **Developer / Tech Lead**: Membutuhkan sistem todo yang cepat, type-safe, serta AI yang dapat membantu memecah backlog teknis.
- **Project Manager / Freelancer**: Membutuhkan visualisasi Kanban dan asisten AI untuk memprioritaskan deadline kritis.
- **Pengguna Produktif Harian**: Membutuhkan pencatatan cepat, pencarian pintar berbasis bahasa alami, dan checklist subtask otomatis.

### 2.2 User Stories
| ID | As a... | I want to... | So that... |
|---|---|---|---|
| **US-01** | Pengguna | Mendaftar & login dengan token aman | Data tugas dan embedding vector tersimpan privat. |
| **US-02** | Pengguna | Mengelola tugas (CRUD), subtask, dan prioritas | Seluruh pekerjaan harian terstruktur rapi. |
| **US-03** | Pengguna | Bertanya ke AI: *"Apa yang harus saya selesaikan sebelum besok sore?"* | AI menganalisis data tugas dengan RAG dan memberikan ringkasan prioritas yang relevan. |
| **US-04** | Pengguna | Mengklik tombol *"AI Breakdown"* pada task baru | AI otomatis membuatkan daftar subtasks terstruktur. |
| **US-05** | Pengguna | Mencari tugas menggunakan bahasa alami (Semantic Search) | Menemukan tugas meski lupa judul persisnya. |
| **US-06** | Developer | Melakukan push git ke branch main | Pipeline otomatis menjalankan lint, type-check, test, dan deploy ke Vercel. |

---

## 3. 🧠 Spesifikasi RAG (Retrieval-Augmented Generation)

### 3.1 Arsitektur RAG Flow

```
[ Ingestion Pipeline ]
Task Created/Updated ──► Vectorizer Service ──► Gemini Embedding API ──► Upsert pgvector (PostgreSQL)

[ Retrieval & Generation Pipeline ]
User Query / Prompt
        │
        ▼
Generate Query Embedding (Gemini API)
        │
        ▼
Cosine Similarity Search (<=>) in PostgreSQL (Top-K Tasks)
        │
        ▼
Construct Augmented Prompt (Context = Top-K Tasks + User Metadata)
        │
        ▼
Gemini LLM Inference (Stream Response) ──► Frontend AI Chat Drawer
```

### 3.2 Fitur AI Berbasis RAG
1. **AI Chat Assistant (Productivity Copilot)**:
   - Floating drawer interaktif di pojok kanan bawah.
   - Mengambil konteks tugas pengguna (status, deadline, prioritas, tags) via vector similarity & structured filters.
   - Menjawab pertanyaan produktivitas, estimasi waktu, dan rekomendasi fokus kerja.
2. **Semantic Search Engine**:
   - Tab pencarian cerdas yang mengurutkan tugas berdasarkan relevansi semantik cosine similarity (Threshold > 0.65).
3. **AI Task Auto-Breakdown**:
   - Membaca judul & deskripsi tugas ➔ Mengirim ke LLM ➔ Menghasilkan array subtasks JSON ➔ Otomatis masuk ke tabel `subtasks`.

---

## 4. 🔄 Spesifikasi Pipelines

### 4.1 Data & Embedding Pipeline (Real-Time Ingestion)
1. **Trigger**: Event saat tugas dibuat (`POST /api/tasks`) atau diperbarui (`PUT/PATCH /api/tasks/:id`).
2. **Payload Sanitizer**: Menggabungkan teks representatif:
   ```text
   Title: [Judul Task] | Description: [Deskripsi] | Category: [Kategori] | Priority: [Prioritas] | Status: [Status]
   ```
3. **Embedding Generator**: Memanggil model `text-embedding-004` (vektor 768 dimensi).
4. **Vector Storage**: Menyimpan/mengupdate baris pada tabel `task_embeddings` dengan indeks HNSW/IVFFlat untuk pencarian cepat.

### 4.2 CI/CD & Deployment Pipeline (GitHub Actions ➔ Vercel)
Alur otomatis pada file `.github/workflows/ci-cd.yml`:
1. **Quality Gate (CI)**:
   - Trigger pada `push` dan `pull_request` ke branch `main`.
   - Setup Bun runtime (`oven-sh/setup-bun`).
   - Run TypeCheck: `bun run typecheck` (Frontend & Backend).
   - Run Linter: `bun run lint`.
   - Run Unit & Integration Tests: `bun test`.
2. **Database Migration Gate**:
   - Drizzle migrations dry-run / push ke staging DB branch di Neon.
3. **Deployment Gate (CD)**:
   - Deploy ke Vercel via Vercel Action (`amondnet/vercel-action` / Vercel CLI).
   - Preview deployment pada PR, Production deployment pada merge ke `main`.

---

## 5. 🗄️ Skema Database PostgreSQL (Dengan `pgvector`)

```mermaid
erDiagram
    USERS ||--o{ TASKS : "owns"
    USERS ||--o{ CATEGORIES : "creates"
    TASKS ||--o{ SUBTASKS : "contains"
    TASKS ||--o| TASK_EMBEDDINGS : "has vector"
    CATEGORIES ||--o{ TASKS : "categorizes"

    USERS {
        uuid id PK
        string email UK
        string password_hash
        string name
        timestamp created_at
        timestamp updated_at
    }

    CATEGORIES {
        uuid id PK
        uuid user_id FK
        string name
        string color_hex
        timestamp created_at
    }

    TASKS {
        uuid id PK
        uuid user_id FK
        uuid category_id FK
        string title
        text description
        enum status
        enum priority
        timestamp due_date
        int order_index
        timestamp created_at
        timestamp updated_at
    }

    TASK_EMBEDDINGS {
        uuid id PK
        uuid task_id FK
        uuid user_id FK
        vector embedding_768
        text content_chunk
        timestamp updated_at
    }

    SUBTASKS {
        uuid id PK
        uuid task_id FK
        string title
        boolean is_completed
        timestamp created_at
    }
```

### 5.1 Data Dictionary Khusus RAG (`task_embeddings`)
- `id`: `UUID` (Primary Key)
- `task_id`: `UUID` (Foreign Key -> `tasks.id` ON DELETE CASCADE, Unique)
- `user_id`: `UUID` (Foreign Key -> `users.id` ON DELETE CASCADE, Indexed)
- `embedding`: `VECTOR(768)` (PostgreSQL `pgvector` type)
- `content_chunk`: `TEXT` (Snapshot teks yang di-embed)
- `updated_at`: `TIMESTAMP WITH TIME ZONE` (Default `NOW()`)
- **Index**: HNSW index pada kolom `embedding` menggunakan metrik cosine similarity:
  ```sql
  CREATE INDEX task_embedding_hnsw_idx ON task_embeddings USING hnsw (embedding vector_cosine_ops);
  ```

---

## 6. 🔌 API Specifications (Termasuk Endpoint AI & RAG)

### Standard Response Format
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... },
  "errors": null
}
```

### Daftar Endpoint Lengkap
| Method | Endpoint | Deskripsi | Auth |
|---|---|---|---|
| **Auth** | | | |
| `POST` | `/api/auth/register` | Registrasi user baru | Public |
| `POST` | `/api/auth/login` | Login & generate JWT | Public |
| `GET` | `/api/auth/me` | Ambil profil user aktif | Bearer |
| **Tasks** | | | |
| `GET` | `/api/tasks` | List tasks (Filter: status, priority, category, date) | Bearer |
| `POST` | `/api/tasks` | Tambah task baru (Otomatis trigger embedding pipeline) | Bearer |
| `GET` | `/api/tasks/stats` | Statistik produktivitas | Bearer |
| `GET` | `/api/tasks/:id` | Detail 1 task + subtasks | Bearer |
| `PUT` | `/api/tasks/:id` | Update task (Otomatis re-embed vector) | Bearer |
| `PATCH` | `/api/tasks/:id/status` | Update status task (`todo`, `in_progress`, `done`) | Bearer |
| `DELETE` | `/api/tasks/:id` | Hapus task (Cascade hapus embedding) | Bearer |
| **Subtasks** | | | |
| `POST` | `/api/tasks/:id/subtasks` | Tambah subtask manual | Bearer |
| `PATCH` | `/api/subtasks/:id/toggle` | Toggle checklist subtask | Bearer |
| `DELETE` | `/api/subtasks/:id` | Hapus subtask | Bearer |
| **AI & RAG Engine** | | | |
| `POST` | `/api/ai/search` | **Semantic Search** berbasis cosine similarity vector | Bearer |
| `POST` | `/api/ai/chat` | **RAG AI Assistant**: Chat kontekstual dengan knowledge tugas | Bearer |
| `POST` | `/api/ai/breakdown` | **AI Decomposition**: Generate subtasks otomatis dari deskripsi | Bearer |
| **Categories** | | | |
| `GET` | `/api/categories` | Daftar kategori user | Bearer |
| `POST` | `/api/categories` | Tambah kategori baru | Bearer |

---

## 7. 🎨 UI/UX Design System (AI Enhanced)

- **Engine**: Tailwind CSS v4 (`@import "tailwindcss"`).
- **Icons**: Lucide React.
- **Komponen AI**:
  - **AI Assistant Drawer**: Floating widget di pojok kanan bawah dengan collapsible chat interface, message history, dan streaming response indicator.
  - **Magic Wand Button (`AI Breakdown`)**: Terletak di samping input subtask dalam Task Modal untuk generate otomatis.
  - **Semantic Search Toggle**: Switch antara *Keyword Search* dan *AI Semantic Search* di Filter Bar.
- **Theme**: Dark Mode (`slate-950`/`zinc-950`) & Light Mode (`slate-50`/`white`) dengan nuansa aksen Indigo/Purple untuk fitur AI.

---

## 8. 📁 Struktur Direktori Project Lengkap

```text
todo-list-zalde/
├── .github/
│   └── workflows/
│       └── ci-cd.yml          # GitHub Actions CI/CD Pipeline
│
├── frontend/                   # React 19 + TypeScript + Tailwind v4
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── ui/            # Button, Input, Dialog, Badge, Skeleton
│   │   │   ├── layout/        # Navbar, Sidebar, Container
│   │   │   ├── tasks/         # TaskCard, TaskList, TaskModal, KanbanBoard
│   │   │   ├── ai/            # AiChatDrawer, AiBreakdownButton, SemanticSearch
│   │   │   └── stats/         # StatOverview, ProgressBar
│   │   ├── pages/             # Dashboard, Login, Register
│   │   ├── services/          # API Client (Task, Auth, AI API)
│   │   ├── hooks/             # useTasks, useAuth, useAiChat, useTheme
│   │   ├── types/             # TypeScript interfaces (Task, Subtask, AiResponse)
│   │   ├── utils/             # Formatters, cn helper
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── backend/                    # Bun + Elysia.js + Drizzle ORM
│   ├── src/
│   │   ├── config/            # DB (Drizzle + pgvector), Gemini AI, Env
│   │   │   ├── db.ts
│   │   │   └── ai.ts
│   │   ├── controllers/       # Elysia Route Handlers
│   │   │   ├── auth.controller.ts
│   │   │   ├── task.controller.ts
│   │   │   ├── ai.controller.ts       # AI Search, Chat RAG, Breakdown
│   │   │   └── category.controller.ts
│   │   ├── services/          # Business Logic
│   │   │   ├── auth.service.ts
│   │   │   ├── task.service.ts
│   │   │   ├── rag.service.ts         # Vector search, context builder
│   │   │   ├── embedding.service.ts   # Vector generation pipeline
│   │   │   └── category.service.ts
│   │   ├── models/            # Drizzle Schemas with pgvector
│   │   │   └── schema.ts
│   │   ├── middlewares/       # JWT Auth, Error Handler, Rate Limiter
│   │   │   ├── auth.middleware.ts
│   │   │   └── error.middleware.ts
│   │   ├── utils/             # Response formatters
│   │   └── index.ts           # Elysia Server & Vercel Function Export
│   ├── drizzle.config.ts
│   ├── package.json
│   └── tsconfig.json
│
├── vercel.json                 # Vercel deployment orchestration
├── PRD.md                      # Dokumen PRD resmi
├── .env.example
├── .gitignore
└── README.md
```

---

## 9. 🚀 Vercel & Cloud Environment Configuration

### Variabel Lingkungan (`.env.example`)
```env
# Server
PORT=3001
JWT_SECRET=your_super_secret_jwt_key_here

# Database (PostgreSQL with pgvector enabled on Neon.tech)
DATABASE_URL=postgresql://user:password@ep-xyz.us-east-2.aws.neon.tech/neondb?sslmode=require

# Google Gemini AI (For Embeddings & RAG Chat)
GEMINI_API_KEY=your_gemini_api_key_here
```

### Konfigurasi `vercel.json`
```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "bunVersion": "1.x",
  "builds": [
    {
      "src": "frontend/package.json",
      "use": "@vercel/static-build",
      "config": { "distDir": "dist" }
    },
    {
      "src": "backend/src/index.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "backend/src/index.ts"
    },
    {
      "src": "/(.*)",
      "dest": "frontend/$1"
    }
  ]
}
```

---

## 10. 📅 Roadmap & Tahapan Rilis (Phasing)

- **Fase 1: Core Foundation & CRUD (Sprint 1)**
  - Setup Monorepo (Bun + Elysia + React 19 + Tailwind v4).
  - Skema PostgreSQL + Drizzle ORM + Auth JWT.
  - CRUD Task & Subtasks, List View & Kanban Board.
- **Fase 2: RAG & AI Copilot Integration (Sprint 2)**
  - Aktivasi extension `pgvector` di PostgreSQL & tabel `task_embeddings`.
  - Integrasi Gemini Embedding Pipeline (Auto-embed on create/update).
  - Endpoint & UI untuk Semantic Search, AI Task Breakdown, dan AI Chat Drawer.
- **Fase 3: CI/CD Pipeline & Deployment (Sprint 3)**
  - GitHub Actions Workflow (Lint, Typecheck, Test).
  - Deployment ke Vercel Serverless & verifikasi performa end-to-end.
