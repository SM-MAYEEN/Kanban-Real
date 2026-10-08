# 🚀 KanbanFlow - Enterprise Agile Project Management Platform

A high-performance, real-time Agile workflow and project management system inspired by modern tools like Jira and Linear. Built using the **MERN Stack** (MongoDB, Express, React, Node.js) with real-time multi-user synchronization powered by **Socket.io**.

---

## 🌟 Key Features

- **⚡ Real-Time Collaboration**: Instant synchronization across team members for task movements, issue creation, and updates using Socket.io.
- **📋 Interactive Kanban Board**: Smooth drag-and-drop workflow management (`@hello-pangea/dnd`) with custom WIP limits, columns, and task ordering.
- **🏃 Agile Sprints & Backlog**: Plan upcoming sprints, prioritize unassigned backlogs, track sprint trajectories, and toggle sprint lifecycles (Future, Active, Completed).
- **📈 Velocity & Burndown Analytics**: Comprehensive sprint burndown trajectory tracking ideal vs. actual remaining story points.
- **📅 Delivery Timeline & Calendar View**: Scheduled issue deliveries organized by deadlines and due dates.
- **💬 Team Channels & Workspace Chat**: Integrated contextual channel messaging for real-time team communication.
- **🤖 AI-Powered Subtask Generator**: Generate structured subtask checklists automatically using smart AI assistance.
- **👥 Team Collaboration & Invitation**: Secure email invitations, customizable member permissions, and instant invite link generation.
- **🔐 Secure Authentication**: JWT-based session management, protected routes, and self-service password reset capabilities.
- **🌐 Bilingual Interface**: Instant multi-language support (English & Bengali).
- **📊 CSV Data Export**: Export board tasks and statuses directly into CSV for external reporting.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React.js (Vite)
- **Styling**: Tailwind CSS (Glassmorphism & luxury dark UI)
- **State Management**: Zustand
- **Drag & Drop**: `@hello-pangea/dnd`
- **Network / API**: Axios
- **Real-Time Client**: Socket.io Client

### Backend
- **Runtime**: Node.js & Express.js (ES Modules)
- **Database**: MongoDB with Mongoose ODM
- **Real-Time Engine**: Socket.io Server
- **Authentication**: JSON Web Tokens (JWT) & bcryptjs
- **Security**: CORS, Environment Variable Management (`dotenv`)

---

## 📁 Project Structure

```text
├── client/                     # Frontend Application (Vite + React)
│   ├── src/
│   │   ├── api/                # Axios instance & interceptors
│   │   ├── components/         # Reusable UI components & modals
│   │   ├── pages/              # Views (BoardView, Login, Register, ForgotPassword)
│   │   ├── store/              # Zustand state stores (auth, board, language)
│   │   ├── socket/             # Socket.io client configuration
│   │   └── utils/              # Translations, helpers, sound effects
│   └── package.json
│
└── server/                     # Backend API & WebSocket Server
    ├── src/
    │   ├── config/             # MongoDB connection setup
    │   ├── controllers/        # Request handlers (auth, board, task, sprint)
    │   ├── middlewares/        # JWT verification & error handling
    │   ├── models/             # Mongoose schemas (User, Board, Column, Task, etc.)
    │   ├── routes/             # Express API endpoints
    │   ├── socket/             # Socket.io event listeners & emitters
    │   ├── app.js              # Express app setup & route mounting
    │   └── server.js           # HTTP & WebSocket server entry point
    └── package.json






🚀 Getting Started
1. Prerequisites

    Node.js (v18 or higher)

    MongoDB (Local instance or MongoDB Atlas cluster)

    Git

2. Clone the Repository
Bash

git clone [https://github.com/your-username/kanban-project.git](https://github.com/your-username/kanban-project.git)
cd kanban-project

3. Setup Backend
Bash

cd server
npm install
# Setup your .env file
npm run dev

Backend will start on http://localhost:5000.
4. Setup Frontend
Bash

cd ../client
npm install
# Setup your .env file
npm run dev

Frontend will run on http://localhost:5173.




