# DevBoard — Full-Stack Developer Learning & Resource Roadmap

A high-performance, full-stack developer learning management platform featuring **React (Vite)**, **Node.js/Express**, **Redis Caching**, **PostgreSQL (Supabase)**, and an autonomous **AI Copilot** powered by the **Google Gemini SDK** with multi-turn tool/function calling.

---

## 🏗️ System Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                          CLIENT (React / Vite)                         │
│   • Hierarchical Navigation (Sections -> Topics -> Resources)          │
│   • Real-Time AI Copilot Drawer (Interactive Gemini Agent)             │
│   • Difficulty Badges, Resource Links & Status Tracking                │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP / REST & WebSockets
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        BACKEND (Node.js / Express)                     │
│   • RESTful Resource Controllers & Routers                             │
│   • Redis Cache-Aside Pattern (Sub-millisecond query responses)        │
│   • Gemini Agent Engine (Schema-declared Tool & Function Calling)      │
└───────────────────────┬────────────────────────────┬───────────────────┘
                        │                            │
                        ▼                            ▼
        ┌──────────────────────────────┐    ┌──────────────────────────────┐
        │       REDIS IN-MEMORY        │    │     SUPABASE (PostgreSQL)    │
        │   • devboard:sections        │    │   • sections (id, name)      │
        │   • devboard:topics:<id>     │    │   • topics (id, section_id)  │
        │   • devboard:resources:<id>  │    │   • resources (id, topic_id) │
        │   • Cache Invalidation hooks │    │   • Row-Level Security       │
        └──────────────────────────────┘    └──────────────────────────────┘
```

---

## 🚀 Key Features

### 1. High-Performance Caching (Redis Cache-Aside Pattern)
- Implements the **Cache-Aside** pattern across read routes (`/api/sections`, `/api/topics/:sectionId`, `/api/resources/:topicId`).
- **Cache Hit**: Returns cached JSON in `< 5ms`.
- **Cache Miss**: Queries Supabase PostgreSQL, populates the Redis cache with a 1-hour TTL, and serves the client.
- **Cache Invalidation**: Mutation endpoints (`POST /api/resources`, `PATCH /api/resources/:id/status`) automatically purge stale Redis cache keys to ensure strict data consistency.

### 2. Autonomous AI Copilot with Function Calling
- Integrated with `@google/genai` (Gemini API) using explicit schema-declared tool declarations:
  - `getSections()`: Retrieves all learning domains.
  - `getTopics(sectionId)`: Fetches topics under a domain.
  - `getResources(topicId)`: Fetches resource links and difficulty.
  - `addTopic(section_id, name)`: Adds new topics and auto-invalidates cache.
  - `addResource(...)`: Inserts learning links directly into the database.
- Supports multi-turn reasoning: the agent autonomously navigates from high-level domains down to granular topic IDs to answer queries or insert resources on demand.

### 3. Database & Relational Modeling (PostgreSQL)
- 3-tier normalized relational schema: `sections` ➔ `topics` ➔ `resources`.
- Relational foreign key constraints and indexed lookup queries.

---

## 💻 Tech Stack

- **Frontend**: React 18, Vite, CSS Modules / Tailwind, Lucide React
- **Backend**: Node.js, Express 5, CORS, Dotenv
- **Caching**: Redis, `ioredis`
- **Database**: Supabase (PostgreSQL), `@supabase/supabase-js`
- **AI / LLM**: Google Gemini API (`@google/genai`), Function Calling

---

## 🛠️ Local Setup & Installation

### Prerequisites
- Node.js (v18+)
- Redis instance (local or cloud Redis)
- Supabase Project with `sections`, `topics`, and `resources` tables
- Google Gemini API Key

---

### 1. Server Setup
```bash
cd server
npm install
```
Create a `.env` file in `server/` (see `.env.example`):
```env
PORT=5000
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
GEMINI_API_KEY=your-gemini-api-key
```
Start the server:
```bash
npm run dev
```

---

### 2. Client Setup
```bash
cd client/devboard
npm install
```
Create a `.env` file in `client/devboard/` (see `.env.example`):
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_URL=http://localhost:5000
```
Start the client:
```bash
npm run dev
```

---

## 📡 API Endpoints

| Method | Endpoint | Description | Cache Strategy |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/sections` | Fetch all learning sections | Redis Cached (`devboard:sections`) |
| `GET` | `/api/topics/:sectionId` | Fetch topics by section ID | Redis Cached (`devboard:topics:<id>`) |
| `GET` | `/api/resources/:topicId` | Fetch resources by topic ID | Redis Cached (`devboard:resources:<id>`) |
| `POST` | `/api/resources` | Insert a new resource | Invalidates topic cache |
| `PATCH` | `/api/resources/:id/status` | Update resource status | Invalidates topic cache |
| `POST` | `/api/agent/chat` | AI Copilot query with tool execution | Executes tools & updates cache |

---

## 📄 License
MIT License. Built by [Sanjeev Prasad](https://github.com/SanjeevPrasad10).
