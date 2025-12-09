# AgentForge AI - Smart Programming Platform

## Overview
AgentForge AI is a bilingual (Arabic/English) web platform that enables users to create complete software projects using 5 parallel AI Agents with human programmer fallback. The platform features a professional cloud IDE, real-time billing, encrypted file management, WebSocket chat, and one-click deployment capabilities.

**Brand Identity:** 5 AI Agents + Human Expert - The Future of AI-Powered Development

## Tech Stack
- **Frontend**: React, TypeScript, TailwindCSS, Shadcn UI, Tanstack Query
- **Backend**: Node.js, Express, WebSocket (ws)
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: Firebase Authentication (fully platform-independent)
- **Email Service**: Resend for verification and password reset emails

## Project Structure
```
├── client/                  # Frontend React application
│   └── src/
│       ├── components/      # Reusable UI components
│       │   ├── ui/         # Shadcn UI components
│       │   ├── app-sidebar.tsx
│       │   ├── AgentCard.tsx
│       │   ├── AIChatInterface.tsx  # AI team chat with 5 agents
│       │   ├── BalanceDisplay.tsx
│       │   ├── ChatPanel.tsx
│       │   ├── CodeEditor.tsx       # IDE code editor component
│       │   ├── FileList.tsx
│       │   ├── ProjectCard.tsx
│       │   ├── ThemeProvider.tsx
│       │   ├── ThemeToggle.tsx
│       │   ├── TransactionHistory.tsx
│       │   └── WorkTimer.tsx
│       ├── hooks/          # Custom React hooks
│       │   └── useAuth.ts
│       ├── lib/            # Utilities and API client
│       ├── pages/          # Page components
│       │   ├── landing.tsx
│       │   ├── auth.tsx             # Login/Register page
│       │   ├── programmer-register.tsx  # Programmer registration
│       │   ├── home.tsx
│       │   ├── projects.tsx
│       │   ├── new-project.tsx
│       │   ├── project-detail.tsx
│       │   ├── ide.tsx              # Integrated development environment
│       │   ├── balance.tsx
│       │   ├── programmer-dashboard.tsx
│       │   ├── settings.tsx
│       │   └── not-found.tsx
│       └── App.tsx         # Root component with routing
├── server/                  # Backend Express server
│   ├── db.ts              # MongoDB connection (Mongoose)
│   ├── models.ts          # Mongoose models for all collections
│   ├── storage.ts         # Database operations (CRUD)
│   ├── routes.ts          # API endpoints
│   ├── firebaseAuth.ts    # Firebase authentication middleware
│   ├── firebaseAdmin.ts   # Firebase Admin SDK configuration
│   ├── emailService.ts    # Resend email service for verification
│   ├── websocket.ts       # WebSocket service for real-time communication
│   ├── workspaceService.ts # Real filesystem operations per project
│   ├── processManager.ts  # Dev server process management
│   ├── terminalService.ts # PTY terminal sessions with node-pty
│   ├── previewProxy.ts    # HTTP reverse proxy for live preview
│   └── index.ts           # Server entry point
└── shared/
    └── schema.ts          # Zod validation schemas and TypeScript types
```

## Database Schema (MongoDB Collections)
- **users**: User accounts with Firebase UID, profile info, role, balance (clients, programmers, admins)
- **programmers**: Extended programmer profiles (skills, experience, rates)
- **projects**: Software projects with status tracking
- **files**: Generated code files with content
- **tasks**: Work tasks for programmers
- **messages**: Chat messages between users
- **aiChatMessages**: AI agent conversation history
- **transactions**: Balance transactions (topup, charge, refund)
- **agentLogs**: AI agent activity logs
- **cryptoPayments**: Cryptocurrency payment records
- **pricing**: Agent pricing configuration

## Key Features

### 1. Firebase Authentication (Platform-Independent)
- Firebase Auth SDK for client-side authentication
- Firebase Admin SDK for server-side token verification
- Role-based access (client, programmer, admin)
- Works on any hosting platform (Replit, AWS, Vercel, etc.)
- **Email Verification Flow:**
  - User registers with Firebase Auth (createUserWithEmailAndPassword)
  - Firebase sends verification email with link automatically
  - User clicks verification link, redirected to `/auth/verify-email?oobCode=xxx`
  - Frontend applies oobCode via Firebase to verify email
  - Backend syncs verification status via `/api/auth/sync-email-verification`

### External Hosting Configuration
When deploying outside Replit, set these environment variables:

**Firebase Client (Frontend) - Required:**
- `VITE_FIREBASE_API_KEY` - Firebase Web API Key
- `VITE_FIREBASE_AUTH_DOMAIN` - Firebase Auth Domain (e.g., yourproject.firebaseapp.com)
- `VITE_FIREBASE_PROJECT_ID` - Firebase Project ID
- `VITE_FIREBASE_STORAGE_BUCKET` - Firebase Storage Bucket
- `VITE_FIREBASE_MESSAGING_SENDER_ID` - Firebase Messaging Sender ID
- `VITE_FIREBASE_APP_ID` - Firebase App ID
- `VITE_FIREBASE_MEASUREMENT_ID` - Firebase Analytics Measurement ID (optional, for Google Analytics)

**Firebase Admin (Backend) - Required:**
- `FIREBASE_SERVICE_ACCOUNT_KEY` - JSON string of Firebase service account credentials
- `FIREBASE_PROJECT_ID` - Your Firebase project ID

**Application Configuration:**
- `APP_URL` - Your application URL (e.g., https://yourdomain.com)
- `MONGODB_URI` - MongoDB connection string
- `RESEND_API_KEY` - Resend API key for email service
- `RESEND_FROM_EMAIL` - Email address to send from

### Authentication Flow (Step-by-Step)
1. **User Signup:** Frontend uses Firebase SDK to create account (createUserWithEmailAndPassword)
2. **Email Sent:** Firebase automatically sends verification email with link
3. **Profile Creation:** Frontend sends profile data to `/api/auth/register-profile` with Firebase ID token
4. **Email Verification:** User clicks link in email, redirected to `/auth/verify-email?oobCode=xxx`
5. **Verification Applied:** Frontend applies oobCode via Firebase to verify email
6. **Sync Status:** Frontend calls `/api/auth/sync-email-verification` to update backend
7. **Login:** User signs in with Firebase SDK, frontend stores ID token
8. **API Requests:** All authenticated requests include Firebase ID token in `Authorization: Bearer <token>` header
9. **Server Verification:** Backend verifies token using Firebase Admin SDK before processing requests

### 2. AI Agents (5 Parallel)
- **UI/UX Agent**: Interface design
- **Backend Agent**: API and server logic
- **Database Agent**: Schema and queries
- **QA Agent**: Testing and quality
- **DevOps Agent**: Deployment and infrastructure

### 3. AI Chat Interface
- Real-time agent status display
- Message history with agent attribution
- Code block display with syntax info
- Request human help button

### 4. Integrated Development Environment (IDE) - Real Implementation
- **Real File System**: Files stored on disk per project in workspace directories
- **Real Terminal**: PTY terminal using node-pty with xterm.js frontend
- **Process Management**: Start/stop dev servers with real process execution
- **Live Preview**: Reverse proxy for real application preview
- **File Explorer**: Real filesystem operations (CRUD, folders)
- **Multi-tab Code Editor**: CodeMirror-based with syntax highlighting
- **WebSocket Integration**: Real-time terminal I/O and process output

**Backend Services (server/):**
- `workspaceService.ts`: Real filesystem operations per project
- `processManager.ts`: Dev server process management (spawn, kill)
- `terminalService.ts`: PTY terminal sessions with node-pty
- `previewProxy.ts`: HTTP reverse proxy for live preview

**API Endpoints:**
- `POST /api/workspace/:projectId/init` - Initialize project workspace
- `GET /api/workspace/:projectId/files` - List files in workspace
- `GET /api/workspace/:projectId/file` - Read file content
- `POST /api/workspace/:projectId/file` - Write file
- `DELETE /api/workspace/:projectId/file` - Delete file
- `POST /api/workspace/:projectId/folder` - Create folder
- `DELETE /api/workspace/:projectId/folder` - Delete folder
- `PATCH /api/workspace/:projectId/rename` - Rename file/folder
- `POST /api/process/:projectId/start` - Start dev server
- `POST /api/process/:projectId/stop` - Stop dev server
- `GET /api/process/:projectId/status` - Get process status
- `GET /api/preview/:projectId` - Get preview URL

### 5. Human Programmer Fallback
- Request programmer when AI fails
- Programmers can accept available tasks
- Real-time chat between client and programmer
- Work timer and billing

### 6. Real-time Billing
- Pay per line/file/task
- USDT TRC20 payments via CryptAPI
- Transaction history

### 7. UI Features
- Dark/Light theme toggle
- Bilingual support (Arabic RTL / English LTR)
- Responsive design

## API Endpoints

### Authentication (Firebase-based)
- `POST /api/auth/register-profile` - Create user profile after Firebase registration
- `POST /api/auth/register-profile/programmer` - Register as programmer
- `GET /api/auth/me` - Get current user (requires Firebase token)
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/sync-email-verification` - Sync email verification status
- `GET /api/auth/check-profile/:firebaseUid` - Check if user profile exists

### Projects
- `GET /api/projects` - List user projects
- `POST /api/projects` - Create new project
- `GET /api/projects/:id` - Get project details
- `POST /api/projects/:id/start-ai` - Start AI processing
- `POST /api/projects/:id/request-programmer` - Request human help

### Files
- `GET /api/projects/:id/files` - List project files
- `POST /api/projects/:id/files` - Create file
- `PATCH /api/files/:id` - Update file content
- `DELETE /api/files/:id` - Delete file

### AI Chat
- `GET /api/projects/:id/ai-chat` - Get AI chat messages
- `POST /api/projects/:id/ai-chat` - Send message to AI (supports `collaborative: true` for multi-agent mode)
- `GET /api/projects/:id/ai-context` - Get AI context for project

### AI Configuration
- `GET /api/ai/status` - Get AI provider status and available models
- `POST /api/ai/configure` - Configure AI provider and model

### Transactions
- `GET /api/transactions` - Get transaction history
- `POST /api/transactions/topup` - Add balance

### Programmer
- `GET /api/programmer/profile` - Get programmer profile
- `PATCH /api/programmer/profile` - Update programmer profile
- `GET /api/programmer/available-tasks` - Get available tasks
- `POST /api/programmer/accept-task/:id` - Accept a task

## Development Commands
- `npm run dev` - Start development server

## Recent Updates
- **Multi-Agent AI System (Dec 2025)**: Advanced AI architecture with 5 specialized agents
  - **AI Provider Service** (`server/aiProvider.ts`): Supports multiple AI backends:
    - Ollama (local) - Free, runs on your machine
    - LM Studio (local) - OpenAI-compatible local server
    - Gemini API - Google's API (1500 free requests/day)
    - OpenAI API - Optional paid API
  - **Agent Orchestrator** (`server/agentOrchestrator.ts`):
    - Shared memory between all 5 agents for context understanding
    - Chain-of-thought reasoning with inter-agent communication
    - Collaborative mode where all agents work together
    - Each agent has specialized persona and expertise
  - **Recommended Open-Source Models**:
    - UI/UX Agent: Qwen 2.5 Coder 7B (88.4% HumanEval)
    - Backend Agent: DeepSeek Coder 6.7B (81.1% HumanEval)
    - Database Agent: Qwen 2.5 Coder 7B (82% Spider SQL)
    - QA Agent: CodeLlama 7B
    - DevOps Agent: Mistral 7B
  - **AI Settings Page** (`/ai-settings`): Configure providers and models
  - **Team Mode Toggle**: Enable collaborative multi-agent processing
  - **Real-time Agent Communication**: WebSocket-based inter-agent messages

- **Real IDE Implementation (Dec 2025)**: Replaced simulated IDE with real implementation
  - Real filesystem operations using Node.js fs module
  - PTY terminal with node-pty and xterm.js
  - Process management for dev servers
  - Live preview with reverse proxy
  - Workspace directories per project at `/home/runner/workspace/workspaces`
  - WebSocket integration for real-time terminal I/O
- **Firebase Auth Migration (Dec 2025)**: Migrated to Firebase-only authentication
  - Removed local authentication (no session-based auth, fully stateless)
  - Full Firebase Authentication for client-side user registration/login
  - Firebase Admin SDK for server-side token verification
  - Firebase's native email verification (link-based)
  - Platform-independent: works on Replit, AWS, Vercel, or any hosting platform
- **Database Migration (Dec 2025)**: Migrated from PostgreSQL/Drizzle to MongoDB/Mongoose
  - All collections now use MongoDB with Mongoose ODM
  - Removed all PostgreSQL/Drizzle dependencies
  - All existing functionality preserved
- Created AI Chat Interface with 5 agent support
- Built integrated IDE with code editor and terminal
- Implemented human programmer request system

## Database Details
- **Connection**: Uses Mongoose for MongoDB connection
- **ODM**: Mongoose for type-safe database operations
- **Authentication**: Stateless (Firebase token-based, no server sessions)
- **Models**: Defined in server/models.ts with Mongoose schemas
- **Validation**: Zod schemas in shared/schema.ts for API validation
