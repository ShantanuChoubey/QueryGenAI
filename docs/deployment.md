# Production Deployment Specification

This document details the deployment setup for the frontend (Vercel), backend (Render), and PostgreSQL database.

---

## 1. Frontend: Vercel

The frontend is a React single-page application built with Vite and Tailwind CSS.

### Configuration Checklist
- **Root Directory**: `frontend`
- **Framework Preset**: `Vite`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

### Environment Variables
Vercel requires the following environment parameter:

| Variable Key | Target Value | Purpose |
| :--- | :--- | :--- |
| `VITE_API_URL` | `https://your-backend-url.onrender.com/api/v1` | Root URL matching Render backend routes. |

### Routing Fallback (`vercel.json`)
Since the application uses React Router, configure Vercel to route all subpaths back to `index.html` to avoid `404` errors on refresh.

Create `frontend/vercel.json` with:
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

---

## 2. Backend: Render

The backend is an Express server using Node.js and ES Modules.

### Configuration Checklist
- **Service Type**: `Web Service`
- **Root Directory**: `backend`
- **Runtime**: `Node`
- **Build Command**: `npm install && npm run prisma:generate`
- **Start Command**: `npm run start`

### Environment Variables
Configure the following keys in the Render environment settings dashboard:

| Variable Key | Example Value | Description |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Enables performance optimizations and limits dev logger flags. |
| `PORT` | `10000` | Port allocated by Render dynamically. |
| `DATABASE_URL`| `postgresql://...` | Connection string for the PostgreSQL database. |
| `JWT_SECRET` | `[secure_random_string]` | Keys used for signing/authenticating user tokens. |
| `LLM_API_KEY` | `[secure_llm_api_key]` | Access keys for the AI integration endpoints. |

---

## 3. Database: PostgreSQL

The application uses PostgreSQL with Prisma ORM.

### Configuration Checklist
- **Hosting Provider**: Render Managed PostgreSQL or AWS RDS.
- **Connection Strategy**: Uses connection pooling via pgBouncer configurations.
- **Prisma Schema Provider**: PostgreSQL module in `schema.prisma`.

### Migration Strategy
Migrations must be automated during backend deployment:
- **Build hook**: The build script `npm run prisma:generate` creates the local Prisma client mappings on the server.
- **Release hook / Startup**: Before the web service boots, the release engine runs `npx prisma migrate deploy` to execute database schemas, applying new tables and column additions safely without dropping table data.
- **Connection Limits**: Ensure the database pool size has limit margins corresponding to the Render auto-scaling parameters to prevent connection exhaustion.
