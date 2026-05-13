# Buena Property Manager

**Video:** [YouTube](https://youtu.be/17sk_uwrsnI)

## Project Snapshot

- **Architecture**: Split frontend and backend applications
- **Frontend**: Next.js 16 (App Router) + React 19 + Tailwind CSS 4
- **Backend**: Express 4 + TypeScript
- **Development state**: Early foundation 

## Repository Structure

- `frontend/` - user interface and server-rendered page
- `backend/` - API server

## Run Locally

Run the backend from `backend/`:

```bash
cd backend
```


```bash
npm install
npm run docker:up
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

### Backend Without Docker

Use this option if your database is already running and `backend/.env` points to it.

```bash
npm install
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

In a second terminal, run the frontend from `frontend/`:

```bash
cd frontend
```

```bash
npm install
npm run dev
```