# AI-Powered SQL Query Generator Monorepo

This production-ready monorepo contains the source code configuration for the AI-Powered SQL Query Generator. It is split into a React 19 frontend workspace, an Express.js backend workspace, and a shared module.

## Project Structure

```
QueryGenAI/
├── package.json                 # Monorepo root configuration (npm workspaces + scripts)
├── README.md                    # Root setup, run, and deployment documentation
├── .gitignore                   # Root gitignore
├── .prettierrc                  # Root formatter config
├── docs/                        # Root documentation folder
│   └── architecture.md          # Architecture overview
├── shared/                      # Shared code/types/schemas workspace
│   ├── package.json
│   └── src/
│       └── index.js
├── frontend/                    # Frontend React Application
│   ├── package.json             # React 19 + Vite + Tailwind + Axios dependencies
│   ├── vite.config.js           # Vite configuration
│   ├── eslint.config.js         # ESLint Flat configuration (React-specific)
│   ├── .prettierrc              # Prettier config for frontend
│   ├── .gitignore               # Frontend-specific gitignore
│   ├── .env.example             # Example environment variables (API URL, etc.)
│   ├── index.html               # Main index HTML
│   └── src/
│       ├── main.jsx             # React entrypoint
│       ├── App.jsx              # Main App component with React Router
│       ├── index.css            # Global CSS / Tailwind directives
│       ├── components/          # Reusable UI components
│       ├── layouts/             # Page layouts (e.g. MainLayout)
│       ├── contexts/            # React context providers (e.g. AppContext)
│       ├── pages/               # Page components
│       ├── routes/              # Router configuration
│       ├── services/            # Axios API client setup and services
│       └── utils/               # Frontend utility functions
└── backend/                     # Backend Express Application
    ├── package.json             # Node.js + Express + Prisma + Zod + Dev dependencies
    ├── eslint.config.js         # ESLint Flat configuration (Node-specific)
    ├── .prettierrc              # Prettier config for backend
    ├── .gitignore               # Backend-specific gitignore
    ├── .env.example             # Example environment variables (Port, DB, JWT, LLM, etc.)
    ├── prisma/
    │   └── schema.prisma        # Prisma Schema referencing PostgreSQL database
    └── src/
        ├── app.js               # Express application initialization & middleware
        ├── server.js            # Express server entry point (listening on port)
        ├── routes/              # Express route declarations
        ├── controllers/         # Route request handlers
        ├── services/            # Backend services (e.g., AI/LLM, DB wrapper)
        ├── utils/               # Backend utility functions
        ├── middleware/          # Express middleware (cors, errors, logging)
        └── config/              # Database and env setup configuration
```

---

## Getting Started

### Prerequisites

Ensure you have the following installed on your machine:
- **Node.js** (v18.x or higher recommended)
- **npm** (v9.x or higher)

### Setup Instructions

1. **Clone the repository** and navigate to the project directory:
   ```bash
   cd QueryGenAI
   ```

2. **Install all dependencies** from the root directory:
   ```bash
   npm install
   ```
   This automatically installs dependencies for the root, frontend, backend, and links the workspaces.

3. **Configure Environment Variables**:
   - Copy `frontend/.env.example` to `frontend/.env` and update variables:
     ```bash
     cp frontend/.env.example frontend/.env
     ```
   - Copy `backend/.env.example` to `backend/.env` and update database and token variables:
     ```bash
     cp backend/.env.example backend/.env
     ```

4. **Initialize the Database (Prisma)**:
   Ensure your PostgreSQL instance is running and matches the `DATABASE_URL` specified in your backend `.env` file, then run:
   ```bash
   npm run prisma:generate -w backend
   npm run prisma:migrate -w backend
   ```

---

## Running the Application

This monorepo provides convenient root npm scripts to run workspace tasks.

### Development Mode

Run both the frontend and backend servers concurrently:
```bash
npm run dev
```
- **Frontend** runs at [http://localhost:3000](http://localhost:3000)
- **Backend** runs at [http://localhost:5000](http://localhost:5000)

You can also run services independently:
- **Frontend only**: `npm run frontend:dev`
- **Backend only**: `npm run backend:dev`

### Formatting & Linting

Ensure code quality and style standards are met:
- **Lint check**: `npm run lint` (runs ESLint in all workspaces)
- **Format code**: `npm run format` (runs Prettier auto-formatting in all workspaces)

---

## Production Deployment Guide

### Frontend (Vercel)

1. Import the repository into **Vercel**.
2. Set the **Root Directory** to `frontend`.
3. Configure the **Build Command** as `npm run build`.
4. Configure the **Output Directory** as `dist`.
5. Add your environment variables (e.g., `VITE_API_URL` pointing to your deployed Render server API).

### Backend (Render)

1. Create a new **Web Service** on **Render**.
2. Set the **Root Directory** to `backend`.
3. Configure the **Build Command** to:
   ```bash
   npm install && npm run prisma:generate
   ```
4. Configure the **Start Command** to:
   ```bash
   npm run start
   ```
5. In the **Environment** tab, add your environment variables (`DATABASE_URL`, `JWT_SECRET`, `LLM_API_KEY`, `NODE_ENV=production`).
