# Student Data Warehouse

A full‑stack platform to manage student profiles, placements, research projects, clubs, skills, and achievements. The repository contains a React + TypeScript frontend and a Node.js + Express + MySQL backend.

## Overview

- **Frontend**: React (Vite), Tailwind CSS, React Router, React Query, Zustand
- **Backend**: Node.js, Express.js, MySQL (`mysql2/promise`), JWT auth
- **Core Capabilities**: Authentication, student management, companies and job roles, placements tracking, invitations (clubs/placements), skills & interests, research projects, and basic dashboards

## Project Structure

```
./
├── backend/   # API server, services, models, routes
└── frontend/  # Web client, pages, components, stores
```

## Roles & Access

- **Admin**: Full control across modules
- **CIR**: Company and placements management
- **Faculty**: Research projects and participants
- **Student**: Profile, invitations, and placements visibility

## Quick Start

### Prerequisites

- Node.js 16+
- MySQL 8+
- npm (or yarn)

### Backend (API)

```bash
cd backend
npm install
cp env.example .env
# Configure MySQL and JWT in .env
npm run migrate        # apply database migrations
npm run seed           # optional: seed baseline data
npm run dev            # starts API at http://localhost:4000
```

### Frontend (Web App)

```bash
cd frontend
npm install
cp env.example .env
# Configure API base
echo VITE_API_BASE_URL=http://localhost:4000/api >> .env
npm run dev            # starts web app (e.g., http://localhost:5173)
```

If port `5173` is in use, Vite will select the next available port.

## Configuration

- **Backend**: See `backend/env.example` for database and auth settings
- **Frontend**: Set `VITE_API_BASE_URL` to your API (defaults to `http://localhost:4000/api`)

## Build & Deploy

- **Frontend**: `npm run build` creates a production bundle in `frontend/dist/`
- **Backend**: `npm start` runs the server. Use a process manager (PM2/system service) and point Nginx/Apache at the API and the built frontend

## Contributing

- Keep changes scoped and consistent with existing patterns
- Add loading/error states for async features
- Follow TypeScript and linting guidelines

## License

MIT License