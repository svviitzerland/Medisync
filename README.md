<div align="center">

# MediSync

[![Python](https://img.shields.io/badge/Python-3.14-3776AB?style=flat&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=flat&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat&logo=supabase&logoColor=white)](https://supabase.com/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat&logo=docker&logoColor=white)](https://www.docker.com/)

**AI Hospital Orchestration Platform**

Automates triage, diagnostic assistance, and care coordination across medical staff through advanced AI agents.

</div>

<br />

## Features

- **AI Triage**: Automated patient complaint analysis and doctor assignment
- **Pre-Assessment**: Interactive Q&A system for initial patient evaluation
- **Doctor Assistant**: AI-powered diagnostic suggestions and treatment planning
- **Patient Chatbot**: Post-consultation support based on doctor's notes
- **Ticket Management**: Complete workflow from registration to billing
- **Role-Based Access**: Separate interfaces for patients, doctors, nurses, pharmacists, and admin staff

## Tech Stack

**Backend**
- FastAPI (Python 3.14)
- Strands AI Agent Framework
- OpenRouter API (LLM provider)
- Supabase (PostgreSQL)

**Frontend**
- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS + shadcn/ui
- Bun (package manager)

**Infrastructure**
- Docker
- AWS App Runner
- Terraform
- GitHub Actions

## Prerequisites

- Python 3.14+
- Bun
- Supabase CLI
- Docker (optional)

## Quick Start

### 1. Clone Repository

```bash
git clone <repository-url>
cd Medisync
```

### 2. Setup Supabase

```bash
supabase start
supabase db reset
```

### 3. Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env with your credentials
uv pip install -r pyproject.toml
poe dev
```

Backend runs at `http://localhost:8000`

### 4. Frontend Setup

```bash
cd frontend
cp .env.example .env.local
# Edit .env.local with Supabase credentials
bun install
bun dev
```

Frontend runs at `http://localhost:3000`

## Environment Variables

### Backend (.env)

```env
SUPABASE_URL=<your-supabase-url>
SUPABASE_KEY=<your-service-key>
AI_API_KEY=<openrouter-api-key>
AI_MODEL_ID=<model-id>
AI_BASE_URL=https://openrouter.ai/api/v1
```

### Frontend (.env.local)

```env
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

## Project Structure

```
Medisync/
├── backend/           # FastAPI application
│   ├── agents/        # AI agents (triage, doctor assist, chatbot)
│   ├── routers/       # API endpoints
│   └── main.py        # Application entry point
├── frontend/          # Next.js application
│   ├── app/           # Pages and layouts
│   ├── components/    # React components
│   └── lib/           # Utilities and API client
├── supabase/          # Database migrations
├── terraform/         # Infrastructure as code
└── .github/           # CI/CD workflows
```

## API Documentation

Once the backend is running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Database Seeding

```bash
cd backend
python scripts/seed.py
```

## Deployment

The project uses GitHub Actions for automated deployment to AWS App Runner. Push to `main` branch triggers deployment.

Required GitHub Secrets:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `SUPABASE_URL`
- `SUPABASE_KEY`
- `AI_API_KEY`
- `AI_MODEL_ID`
- `AI_BASE_URL`
- `APP_RUNNER_SERVICE_ROLE_ARN`

## User Roles

- **Patient**: Register, submit complaints, view medical records
- **Front Office**: Create tickets, manage patient registration
- **Doctor**: Examine patients, write diagnoses, prescribe medication
- **Nurse**: Monitor inpatient care
- **Pharmacist**: Process prescriptions
- **Admin**: System management and analytics

## Development

### Backend Commands

```bash
poe dev          # Start development server
poe format       # Format and lint code
```

### Frontend Commands

```bash
bun dev          # Start development server
bun build        # Build for production
bun lint         # Lint code
```

### Supabase Commands

```bash
supabase start           # Start local instance
supabase db reset        # Reset database
supabase migration new   # Create new migration
supabase db push         # Apply migrations
```

## License

Proprietary - All rights reserved

## Support

For issues and questions, please contact the development team.
