# ProctorGuard MVP - Enterprise Online Proctoring Platform

> **Status**: ✅ Authentication Working | Admin & Author Dashboards Complete | Phase 1 Done

Enterprise online proctoring platform with role-based access control, built as a monorepo with Next.js 16, Prisma, and Better Auth.

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.example .env
# Edit .env with your database credentials

# 3. Set up database
npm run db:generate
npm run db:migrate
npm run db:seed

# 4. Start all applications
npm run dev
```

**Applications will be available at:**
- 🟦 Candidate Portal: http://localhost:4000
- 🟦 Admin Dashboard: http://localhost:4001
- 🟩 Question Author: http://localhost:4002
- 🟪 Exam Coordinator: http://localhost:4003
- 🟧 Session Reviewer: http://localhost:4004

---

## 📋 Table of Contents

- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Database Schema](#-database-schema)
- [Authentication](#-authentication)
- [Permissions System](#-permissions-system)
- [Development](#-development)
- [Database Commands](#-database-commands)
- [Demo Accounts](#-demo-accounts)
- [Deployment](#-deployment)
- [Documentation](#-documentation)

---

## 🏗 Architecture

### Monorepo Structure

```
proctor-exam-mvp/
├── apps/                    # Next.js Applications (5 apps)
│   ├── candidate/          # Exam taking portal (Port 3001)
│   ├── admin/              # Organization management (Port 3002)
│   ├── author/             # Question bank creation (Port 3003)
│   ├── coordinator/        # Exam scheduling (Port 3004)
│   └── reviewer/           # Session review (Port 3005)
│
├── packages/               # Shared Packages
│   ├── database/          # Prisma ORM + Schema
│   ├── auth/              # Better Auth configuration
│   ├── permissions/       # RBAC system
│   ├── ui/                # shadcn/ui components
│   └── config/            # Shared configuration
│
├── .env                   # Environment variables
├── turbo.json            # Turborepo configuration
└── package.json          # Workspace configuration
```

### Design Principles

- **Separation of Duties**: Each app serves a specific role
- **Shared Packages**: Common functionality in reusable packages
- **Type Safety**: TypeScript throughout
- **Security First**: RBAC, middleware protection, audit logging
- **Monorepo Benefits**: Atomic commits, consistent tooling, code sharing

---

## 🛠 Tech Stack

### Frontend
- **Framework**: Next.js 16 (App Router)
- **UI Library**: React 19
- **Styling**: Tailwind CSS
- **Components**: shadcn/ui (Radix UI primitives)
- **Language**: TypeScript 5.7

### Backend
- **Database**: PostgreSQL
- **ORM**: Prisma 6.19
- **Authentication**: Better Auth 1.1
- **API**: Next.js Server Actions + API Routes

### Infrastructure
- **Monorepo Tool**: Turborepo
- **Package Manager**: npm workspaces
- **Deployment**: Vercel (recommended)
- **Storage**: Vercel Blob (for recordings)

### Development
- **Runtime**: Node.js >= 20.0.0
- **Linting**: ESLint
- **Code Quality**: TypeScript strict mode

---

## 📁 Project Structure

See full documentation in [CLAUDE.md](../CLAUDE.md) at repository root.

**Key Packages:**
- `@proctorguard/database` - Prisma schema and client
- `@proctorguard/auth` - Better Auth configuration
- `@proctorguard/permissions` - RBAC system
- `@proctorguard/ui` - shadcn/ui components
- `@proctorguard/config` - Shared configuration

---

## 🗄 Database Schema

### Core Models

**User Management**: User, UserRole, Organization, Department  
**Content**: QuestionBank, Question  
**Exams**: Exam, Enrollment, ExamSession  
**Proctoring**: Flag, Answer, AuditLog

### Key Features

- **9 Roles**: From SUPER_ADMIN to CANDIDATE
- **Multi-role Support**: Users can have multiple roles
- **Separation of Duties**: Authors can't see exam takers
- **Audit Logging**: All sensitive operations tracked

---

## 🔐 Authentication

**Better Auth** is configured with:
- Email/password authentication
- 7-day session management
- Prisma database adapter
- Automatic session refresh
- Route protection via middleware

### API Routes

All apps have authentication routes at `/api/auth/*`

### Protected Routes

Middleware automatically protects all routes except:
- `/` (home)
- `/auth/signin`
- `/auth/signup`
- `/api/auth/*`

---

## 🔑 Permissions System

### Role-Based Access Control (RBAC)

**9 Roles with Specific Permissions:**

| Role | Capabilities |
|------|-------------|
| EXAM_AUTHOR | Create questions, cannot see exam takers |
| EXAM_COORDINATOR | Schedule exams, cannot create questions |
| ENROLLMENT_MANAGER | Invite candidates, approve enrollments |
| PROCTOR_REVIEWER | Review sessions, adjudicate flags |
| CANDIDATE | Take exams, view own results |

See `packages/permissions/index.ts` for complete permission matrix.

---

## 💻 Development

### Prerequisites

- Node.js >= 20.0.0
- PostgreSQL database
- npm (comes with Node.js)

### Environment Setup

1. Copy `.env.example` to `.env`
2. Configure PostgreSQL connection
3. Run `npm install`
4. Run database migrations
5. Seed demo data

### Development Commands

```bash
# Run all apps
npm run dev

# Build all apps
npm run build

# Lint code
npm run lint

# Clean artifacts
npm run clean
```

---

## 🗃 Database Commands

```bash
# Generate Prisma Client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed demo data
npm run db:seed

# Open Prisma Studio
npm run db:studio
```

### PostgreSQL Setup

```sql
CREATE USER proctorguard_user WITH PASSWORD 'ProctorGuard2024!Secure';
CREATE DATABASE proctorguard_dev OWNER proctorguard_user;
\c proctorguard_dev
ALTER USER proctorguard_user CREATEDB;
GRANT CREATE ON SCHEMA public TO proctorguard_user;
```

---

## 👥 Demo Accounts

After running `npm run db:seed`:

| Email | Role | Organization |
|-------|------|--------------|
| admin@acme.com | Super Admin | ACME Corp |
| author@acme.com | Exam Author | ACME Corp |
| coordinator@acme.com | Exam Coordinator | ACME Corp |
| enrollment@acme.com | Enrollment Manager | ACME Corp |
| reviewer@acme.com | Proctor Reviewer | ACME Corp |
| candidate@acme.com | Candidate | ACME Corp |

**Demo Data Includes:**
- 1 Organization (ACME Corporation)
- 2 Departments (IT, HR)
- 7 Users with roles
- 1 Question Bank
- 3 Sample Questions

---

## 🚀 Deployment

### Vercel Deployment (Recommended)

```bash
# Deploy candidate app
cd apps/candidate
vercel --prod

# Deploy all apps
for app in apps/*; do
  cd $app
  vercel --prod
  cd ../..
done
```

### Environment Variables

Set in Vercel:
- `DATABASE_URL` - PostgreSQL connection string
- `DIRECT_URL` - Direct database connection
- `BETTER_AUTH_SECRET` - Random secret key
- `BETTER_AUTH_URL` - Your app URL
- `BLOB_READ_WRITE_TOKEN` - Vercel Blob token

---

## 📚 Documentation

- **[CLAUDE.md](../CLAUDE.md)** - Comprehensive development guide
- **[GETTING_STARTED.md](./GETTING_STARTED.md)** - Step-by-step setup
- **[FIXES_APPLIED.md](./FIXES_APPLIED.md)** - Recent fixes and improvements

### Package Documentation
- `packages/database/prisma/schema.prisma` - Database schema
- `packages/permissions/index.ts` - Permission matrix
- `packages/auth/index.ts` - Auth configuration

---

## 🧪 Testing

```bash
# Start all apps
npm run dev

# Open candidate portal
open http://localhost:4000

# Open database editor
npm run db:studio
```

---

## 🐛 Troubleshooting

**Port in use:**
```bash
lsof -ti:4000 | xargs kill -9
```

**Database connection failed:**
```bash
# Test connection
psql -U proctorguard_user -d proctorguard_dev

# Check .env file has correct credentials
```

**Prisma client not generated:**
```bash
npm run db:generate
```

**Module not found:**
```bash
rm -rf node_modules package-lock.json
npm install
```

---

## 🔒 Security

### Implemented

- ✅ Environment variables for secrets
- ✅ Password hashing (Better Auth)
- ✅ Session-based authentication
- ✅ CSRF protection
- ✅ Role-based access control
- ✅ SQL injection prevention (Prisma)
- ✅ Route protection middleware
- ✅ Audit logging

### Production Checklist

- [ ] Enable email verification
- [ ] Set up rate limiting
- [ ] Configure CORS
- [ ] Use HTTPS
- [ ] Regular security audits
- [ ] Enable 2FA for admins

---

## 📈 Roadmap

### Phase 1: Authentication ✅
- ✅ Database schema
- ✅ Auth infrastructure
- 🔄 Sign-in/sign-up pages (Next)

### Phase 2: Core Features
- [ ] Question bank management
- [ ] Exam configuration
- [ ] Enrollment system
- [ ] Exam delivery

### Phase 3: Proctoring
- [ ] AI monitoring
- [ ] Flag generation
- [ ] Session recording
- [ ] Review interface

### Phase 4: Reporting
- [ ] Admin dashboard
- [ ] Analytics
- [ ] Audit logs
- [ ] Export functionality

---

## 🆘 Support

1. Check [CLAUDE.md](../CLAUDE.md) for comprehensive docs
2. Review [GETTING_STARTED.md](./GETTING_STARTED.md) for setup help
3. Check [FIXES_APPLIED.md](./FIXES_APPLIED.md) for known issues
4. Test with demo accounts

---

## 🎯 Quick Reference

**Repository**: `/Users/muntasir/workspace/proctor-exam/proctor-exam-mvp`

**Applications**:
- Candidate: Port 3001 | CANDIDATE
- Admin: Port 3002 | ORG_ADMIN
- Author: Port 3003 | EXAM_AUTHOR
- Coordinator: Port 3004 | EXAM_COORDINATOR
- Reviewer: Port 3005 | PROCTOR_REVIEWER

**Database**: `proctorguard_dev` @ localhost:5432

---

**Built with ❤️ using Next.js 16, Prisma, Better Auth, and shadcn/ui**

Last Updated: 2026-01-28
