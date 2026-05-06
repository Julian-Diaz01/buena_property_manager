# Bueno Property Manager - Current Technical Status

This document describes the current implementation status of the project and clearly separates the frontend and backend applications.

## Project Snapshot

- **Architecture**: Split frontend and backend applications
- **Frontend**: Next.js 16 (App Router) + React 19 + Tailwind CSS 4
- **Backend**: Express 4 + TypeScript
- **Current integration**: Frontend calls backend health endpoint and displays online/offline status
- **Development state**: Early foundation

## Repository Structure

- `frontend/` - user interface and server-rendered page
- `backend/` - API server

## Frontend Status (Next.js App)

### Current Purpose

The frontend currently acts as a minimal status dashboard that confirms backend connectivity.

### Run Commands

From `frontend/`:

```bash
npm run dev
```