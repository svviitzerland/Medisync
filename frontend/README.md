<div align="center">

# MediSync

[![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=flat&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-000000?style=flat&logo=shadcnui&logoColor=white)](https://ui.shadcn.com/)
[![Bun](https://img.shields.io/badge/Bun-1.0-000000?style=flat&logo=bun&logoColor=white)](https://bun.sh/)

**Frontend Client Application**

</div>

<br />

This is the Next.js frontend application for the MediSync orchestration platform. The application provides role-based interfaces for medical staff and patients.

## Getting Started

First, ensure you have the required environment variables configured in `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

Install dependencies using Bun (as per our standard guidelines):

```bash
bun install
```

Run the development server:

```bash
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Architecture Guidelines

- Always use Bun as the package manager
- Strict TypeScript enforcement
- Tailwind CSS for all styling (no custom CSS when possible)
- shadcn/ui components for rapid UI development
- Server Actions for data mutations

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com/docs)
