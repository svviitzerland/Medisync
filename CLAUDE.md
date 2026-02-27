# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MediSync is an AI Hospital Orchestration platform that intelligently coordinates patient care workflows. The system uses AI agents to orchestrate triage, doctor assistance, and patient support, automating care coordination across medical staff roles.

## Architecture

### Backend (FastAPI + Python 3.14)
- **Location**: `backend/`
- **Framework**: FastAPI with modular routers
- **AI Agents**: Uses Strands framework with OpenAI-compatible API (OpenRouter)
  - `agents/triage/`: Patient triage and doctor assignment
  - `agents/doctor_assistant/`: Diagnostic suggestions and treatment plans
  - `agents/patient_chatbot/`: Post-consultation patient Q&A
  - `agents/core/llm.py`: Shared LLM configuration
- **Routers**:
  - `routers/ai.py`: AI endpoints (triage, pre-assessment, doctor assist, patient chat)
  - `routers/tickets.py`: Ticket CRUD and workflow
  - `routers/admin.py`: Admin operations
  - `routers/patients.py`: Patient management
- **Database**: Supabase client (`database.py`)

### Frontend (Next.js 16 + React 19)
- **Location**: `frontend/`
- **Framework**: Next.js App Router with TypeScript
- **UI**: Tailwind CSS + shadcn/ui components
- **Auth**: Supabase authentication
- **Structure**:
  - `app/`: Pages and layouts
  - `app/dashboard/views/`: Role-based dashboard views (Admin, Doctor, FO, Nurse, Patient, Pharmacy)
  - `components/`: Reusable UI components
  - `lib/api.ts`: Centralized API client for backend
  - `lib/config.ts`: Environment and constants
  - `types/`: TypeScript type definitions

### Database (Supabase/PostgreSQL)
- **Location**: `supabase/migrations/`
- **Key Tables**: profiles, tickets, doctors, nurses, prescriptions, invoices, chat_messages, ai_pre_assessments
- **User Roles**: patient, admin, fo, doctor_specialist, nurse, pharmacist, agent
- **Ticket Statuses**: draft, assigned_doctor, inpatient, operation, waiting_pharmacy, completed
- **RLS**: Row-level security policies enforce role-based access

### Infrastructure
- **Docker**: Multi-stage build in `backend/Dockerfile`
- **Terraform**: AWS ECR configuration in `terraform/`
- **CI/CD**: GitHub Actions workflow in `.github/workflows/deploy.yml`

## Development Commands

### Backend
```bash
cd backend

# Start development server (with auto-reload)
poe dev

# Format and lint code
poe format

# Run with uvicorn directly
uvicorn main:app --reload

# Install dependencies
uv pip install -r pyproject.toml
```

### Frontend
```bash
cd frontend

# Start development server
bun dev

# Build for production
bun build

# Start production server
bun start

# Lint code
bun lint

# Install dependencies
bun install
```

### Supabase
```bash
# Start local Supabase (from project root)
supabase start

# Stop local Supabase
supabase stop

# Create new migration
supabase migration new <migration_name>

# Apply migrations
supabase db push

# Reset database (applies all migrations)
supabase db reset

# Generate TypeScript types
supabase gen types typescript --local > frontend/types/supabase.ts
```

### Database Seeding
```bash
cd backend
python scripts/seed.py
```

### Docker
```bash
# Build backend image
docker build -t medisync-backend ./backend

# Run backend container
docker run -p 8000:8000 --env-file backend/.env medisync-backend
```

### Terraform
```bash
cd terraform

# Initialize Terraform
terraform init

# Plan infrastructure changes
terraform plan

# Apply infrastructure changes
terraform apply
```

## Environment Variables

### Backend (`backend/.env`)
```
SUPABASE_URL=<supabase_project_url>
SUPABASE_KEY=<supabase_service_key>
AI_API_KEY=<openrouter_api_key>
AI_MODEL_ID=<model_id>
AI_BASE_URL=https://openrouter.ai/api/v1
```

### Frontend (create `.env.local` in `frontend/`)
```
NEXT_PUBLIC_SUPABASE_URL=<supabase_project_url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<supabase_anon_key>
NEXT_PUBLIC_BACKEND_URL=http://127.0.0.1:8000  # Optional, defaults to this
```

## Key Workflows

### Ticket Lifecycle
1. **Draft**: FO creates ticket with patient complaint
2. **AI Triage**: System analyzes complaint, suggests doctor and severity
3. **Assigned Doctor**: Ticket assigned to specialist
4. **In Progress**: Doctor examines patient
5. **Waiting Pharmacy**: Doctor completes checkup, prescribes medicine
6. **Inpatient/Operation**: Patient requires hospitalization
7. **Completed**: Ticket closed

### AI Agent Flow
- **Pre-Assessment**: Generate follow-up questions → Submit Q&A history → Create ticket
- **Triage**: Analyze complaint → Check doctor availability → Check patient history → Assign doctor
- **Doctor Assist**: Fetch patient data → Generate/review diagnosis → Suggest treatment plan
- **Patient Chat**: Fetch ticket/doctor notes → Answer patient questions

## Database Schema Overview

### Core Tables
- **profiles**: User accounts (linked to auth.users via trigger)
  - Stores: NIK, role, name, age, phone, email
  - Roles: patient, admin, fo, doctor_specialist, nurse, pharmacist, agent

- **doctors**: Specialist doctor records
  - Links to profiles table for user info
  - Stores specialization field

- **nurses**: Nurse records with team assignments
  - Links to profiles and nurse_teams
  - Stores shift information

- **tickets**: Core workflow entity
  - Tracks patient journey from complaint to completion
  - Contains: fo_note (complaint), doctor_note (diagnosis), status, severity_level, ai_reasoning
  - Foreign keys: patient_id, doctor_id, room_id, nurse_team_id

- **ai_pre_assessments**: Stores pre-consultation Q&A
  - Links to tickets
  - Contains: qa_history (JSON array), ai_summary

- **prescriptions**: Medicine prescriptions per ticket
  - Links to tickets and catalog_medicines
  - Stores: quantity, notes (dosage instructions)

- **invoices**: Billing records
  - Links to tickets
  - Contains: doctor_fee, medicine_fee, room_fee, total_amount, status (paid/unpaid)

- **chat_messages**: Patient-doctor communication
  - Links to tickets
  - Stores: sender_id, message, timestamp

### Key Relationships
- One patient (profile) → Many tickets
- One ticket → One doctor, One room (optional), One nurse_team (optional)
- One ticket → Many prescriptions
- One ticket → One invoice
- One ticket → Many chat_messages
- One ticket → One ai_pre_assessment (optional)

## API Endpoints Reference

### AI Endpoints (`/api/ai`)
- `POST /generate-pre-assessment-questions`: Generate follow-up questions from initial complaint
- `POST /submit-pre-assessment`: Create ticket from Q&A history
- `POST /analyze-ticket`: AI triage analysis (doctor assignment, severity)
- `POST /doctor-assist`: Diagnostic suggestions for doctors
- `POST /patient-chat`: Patient chatbot for post-consultation questions

### Ticket Endpoints (`/api/tickets`)
- `POST /create`: Create new ticket (FO workflow)
- `POST /{ticket_id}/assign-doctor`: Assign doctor to ticket
- `POST /{ticket_id}/complete-checkup`: Doctor completes examination

### Admin Endpoints (`/api/admin`)
- Dashboard statistics and staff management

### Patient Endpoints (`/api/patients`)
- Patient profile management

## Special Logic

### Nurse Team Assignment (Round-Robin)
When `requires_inpatient=true`:
1. Fetch all active nurse teams from nurses table
2. Count current inpatient/operation tickets per team
3. Assign to team with lowest load
4. Default teams: 1, 2, 3

### Pre-Assessment Flow
1. Patient enters initial complaint
2. AI generates 3-5 follow-up questions
3. Patient answers questions (Q&A history stored)
4. AI generates summary from Q&A
5. System creates ticket with AI summary as fo_note
6. Optionally suggests doctor_id

### Ticket Status Transitions
```
draft → assigned_doctor → in_progress → waiting_pharmacy → completed
                                      ↘ inpatient → completed
                                      ↘ operation → completed
```

## Code Patterns

### Backend API Responses
All AI endpoints return structured responses with `status` field:
```python
{"status": "success", "analysis": {...}}
{"status": "error", "message": "..."}
```

### Frontend API Client
Use centralized API client from `lib/api.ts`:
```typescript
import { analyzeTicket, createTicket } from "@/lib/api";
```
All functions throw `ApiError` on non-2xx responses.

### Supabase Queries
Backend uses Supabase Python client:
```python
from database import supabase
data, count = supabase.table("tickets").select("*").execute()
# Returns tuple: (response_object, data_list)
# Access data via: data[1] or response.data
```

Frontend uses Supabase JS client with RLS policies enforced.

### Strands Agent Pattern
```python
from strands import Agent, tool

@tool
def my_tool(param: str) -> str:
    """Tool description for LLM."""
    return json.dumps(result)

agent = Agent(model=model, system_prompt=prompt, tools=[my_tool])
result = agent("User prompt")
# Access messages: agent.messages
```

## Deployment

### AWS App Runner (Production)
- **Trigger**: Push to `main` branch with changes in `backend/` or workflow file
- **Region**: ap-southeast-1
- **Service**: medisync-backend-service
- **Resources**: 1 vCPU, 2 GB memory
- **Health Check**: `/api/health` endpoint

### Required GitHub Secrets
```
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
SUPABASE_URL
SUPABASE_KEY
AI_API_KEY
AI_MODEL_ID
AI_BASE_URL
APP_RUNNER_SERVICE_ROLE_ARN
```

## AI Agent Behavior

### Triage Agent (`agents/triage/`)
**Purpose**: Analyze patient complaints and assign appropriate doctor with severity assessment

**Tools Available**:
- `get_available_doctors()`: Lists all doctors with specializations
- `get_patient_history(patient_id)`: Retrieves last 10 tickets for patient
- `submit_triage_decision(...)`: Final decision with doctor, severity, inpatient flag
- `reject_complaint(reasoning)`: Rejects invalid/non-medical complaints

**Rules**:
- **Severity Levels**: Must be exactly "low", "medium", or "high" (no combinations)
- **Input Validation**: Rejects gibberish, non-medical complaints, or overly vague inputs
- **Inpatient Criteria**: Only for severe/life-threatening conditions (trauma, internal bleeding, cardiovascular emergencies, severe infections, pregnancy complications)
- **Default Behavior**: When in doubt about inpatient care, defaults to `false`
- **Tool Sequence**: Always checks doctor availability → patient history (if available) → submits decision
- **Language**: Reasoning in English, rejection messages can be in Indonesian

### Doctor Assistant Agent (`agents/doctor_assistant/`)
**Purpose**: Help doctors during examination with diagnostic suggestions and treatment plans

**Tools Available**:
- `get_patient_info(nik)`: Fetch patient profile by NIK
- `get_patient_ticket_history(patient_id)`: Last 10 tickets with diagnoses
- `get_current_ticket(patient_id)`: Active ticket being examined
- `get_medicine_catalog()`: Available medicines in pharmacy (stock > 0)
- `submit_doctor_suggestion(...)`: Final suggestion with diagnosis, treatment, medicines

**Behavior**:
- If `doctor_draft` provided: Reviews and enhances the draft
- If `doctor_draft` empty: Generates full diagnostic suggestion from scratch
- Only recommends medicines that are in stock
- Provides detailed reasoning for suggestions

### Patient Chatbot (`agents/patient_chatbot/`)
**Purpose**: Answer patient questions about their medical situation post-consultation

**Implementation**: Uses OpenAI client directly (not Strands framework)

**Rules**:
- ONLY answers based on doctor's notes provided in context
- If no doctor notes available, tells patient to wait or contact front office
- NEVER invents or hallucinates medical information
- Explains medical terms in simple, patient-friendly language
- Empathetic, warm, and reassuring tone
- Responds in same language as patient (English or Indonesian)
- NEVER provides new diagnoses or changes doctor's assessment

**Context Fetched**:
- Ticket data (FO note, doctor note, status, severity)
- Doctor information (name, specialization)
- Prescription data if available

## UI/UX Details

- **Theme**: Dark mode by default (set in root layout)
- **Font**: Public Sans (Google Fonts)
- **Color System**: Role-based and status-based color coding (see `lib/config.ts`)
- **Dashboard**: Role-specific views for each user type

## Common Development Tasks

### Adding a New AI Agent
1. Create directory in `backend/agents/<agent_name>/`
2. Create files: `agent.py`, `tools.py`, `prompts.py`, `__init__.py`
3. Define tools using `@tool` decorator from Strands
4. Create agent with `Agent(model=model, system_prompt=prompt, tools=[...])`
5. Export main function in `__init__.py`
6. Add router endpoint in `backend/routers/ai.py`

### Adding a New Database Table
1. Create migration: `supabase migration new <name>`
2. Write SQL in `supabase/migrations/<timestamp>_<name>.sql`
3. Add RLS policies for role-based access
4. Apply: `supabase db push` (local) or push to main (production)
5. Update TypeScript types: `supabase gen types typescript --local`

### Adding a New API Endpoint
1. Add function to appropriate router in `backend/routers/`
2. Use FastAPI decorators with response examples
3. Import and use `supabase` from `database.py`
4. Add corresponding function in `frontend/lib/api.ts`
5. Update TypeScript types in `frontend/types/` if needed

### Debugging AI Agents
- Check `agent.messages` to see full conversation history
- Tool results are in message content blocks with `toolUse` and `toolResult`
- Agent reasoning is in text blocks between tool calls
- Use `print(json.dumps(agent.messages, indent=2))` for debugging

### Working with Supabase RLS
- Backend uses service key (bypasses RLS) - be careful with permissions
- Frontend uses anon key (enforces RLS) - policies control access
- Test RLS by querying as different user roles
- Common pattern: `auth.jwt() -> 'user_metadata' ->> 'role'`

## Troubleshooting

### Backend won't start
- Check `.env` file exists with all required variables
- Verify Supabase URL and key are correct
- Ensure Python 3.14 is installed
- Try: `cd backend && uv pip install -r pyproject.toml`

### Frontend build fails
- Ensure Bun is installed (not npm/yarn)
- Check `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set
- Try: `cd frontend && bun install`

### AI agent errors
- Verify `AI_API_KEY`, `AI_MODEL_ID`, `AI_BASE_URL` in backend `.env`
- Check OpenRouter API key is valid and has credits
- Model ID format: `provider/model-name` (e.g., `minimax/minimax-m2.1`)

### Supabase connection issues
- Local: Ensure `supabase start` is running
- Check ports: API (54321), DB (54322)
- Verify service key vs anon key usage (backend vs frontend)

### Database migration conflicts
- Reset local: `supabase db reset`
- Check migration order (timestamps must be sequential)
- Verify no duplicate migration names

## Security Considerations

- **Never commit `.env` files** - they contain sensitive keys
- **Backend uses service key** - bypasses RLS, use carefully
- **Frontend uses anon key** - RLS policies enforce access control
- **User roles stored in JWT** - `user_metadata.role` field
- **Validate user input** - especially in AI agent prompts
- **Sanitize patient data** - NIK and medical info are sensitive

## Performance Notes

- AI agent calls take 2-5 seconds - show loading states
- Supabase queries with joins can be slow - use `.select()` carefully
- Frontend API client has no caching - implement if needed
- Database indexes on: `profiles.nik`, ticket foreign keys
- Consider pagination for large ticket lists

## Important Notes

- Backend uses Python 3.14 (ensure compatibility)
- Frontend uses Bun as package manager (not npm/yarn)
- AI agents use Strands framework with tool calling
- All AI operations are async and may take 2-5 seconds
- RLS policies enforce role-based access - use service key for admin operations
- Ticket workflow is sequential - respect status transitions
- NIK (National ID) is used as patient identifier in some contexts
- Frontend API client (`lib/api.ts`) throws `ApiError` on non-2xx responses
- Supabase client in frontend uses anon key with RLS, backend uses service key
- Dark mode is default theme (set in root layout)
- Public Sans font loaded from Google Fonts
