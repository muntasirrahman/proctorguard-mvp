# Getting Started with ProctorGuard MVP

## What Was Created

✅ **Monorepo Structure**
- 5 Next.js applications (one per role)
- 5 shared packages (database, auth, permissions, ui, config)
- Turborepo configuration for efficient builds

✅ **Database Schema**
- Complete Prisma schema with 9 roles
- Multi-role support per user
- Separation of duties enforced at database level
- Audit logging built-in

✅ **Authentication System**
- Better Auth configured with Prisma adapter
- 7-day session management
- Email/password authentication ready

✅ **RBAC System**
- 9 distinct roles with clear responsibilities
- 40+ granular permissions
- Resource-based access control helpers
- Permission validation utilities

✅ **UI Components**
- shadcn/ui components (Button, Card, Input, Label)
- Shared across all applications
- Tailwind CSS configured
- Dark mode support

✅ **Development Tools**
- Turborepo for parallel builds
- TypeScript configuration
- ESLint configuration
- Database migration scripts
- Seed data for testing

## Next Steps

### 1. Set Up Environment (5 minutes)

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your database credentials
# For Vercel Postgres: Get from Vercel dashboard
# For local PostgreSQL: Use your local connection string
```

### 2. Install Dependencies (2-3 minutes)

```bash
npm install
```

### 3. Set Up Database (2 minutes)

```bash
# Generate Prisma Client
npm run db:generate

# Create database tables
npm run db:migrate

# Seed demo data
npm run db:seed
```

### 4. Start Development Servers (1 minute)

```bash
# Run all apps in parallel
npm run dev
```

Visit:
- http://localhost:3001 - Candidate Portal
- http://localhost:3002 - Admin Dashboard
- http://localhost:3003 - Question Author
- http://localhost:3004 - Exam Coordinator
- http://localhost:3005 - Session Reviewer

### 5. Test with Demo Accounts

The seed script creates these test users:
- admin@acme.com (Super Admin)
- author@acme.com (Exam Author)
- coordinator@acme.com (Exam Coordinator)
- enrollment@acme.com (Enrollment Manager)
- reviewer@acme.com (Proctor Reviewer)
- candidate@acme.com (Candidate)

## Development Priorities

### Phase 1: Core Authentication (Week 1)
- [ ] Implement sign-in pages in all apps
- [ ] Implement sign-up flow for candidates
- [ ] Add password reset functionality
- [ ] Create protected route middleware
- [ ] Add session management UI

### Phase 2: Question Management (Week 1-2)
- [ ] Question bank CRUD in author app
- [ ] Question CRUD with multiple types
- [ ] Question preview/review interface
- [ ] Question bank approval workflow
- [ ] Question statistics dashboard

### Phase 3: Exam Configuration (Week 2-3)
- [ ] Exam creation wizard in coordinator app
- [ ] Exam scheduling interface
- [ ] Question bank selection
- [ ] Proctoring settings configuration
- [ ] Exam preview mode

### Phase 4: Enrollment Management (Week 3)
- [ ] Candidate invitation system
- [ ] Enrollment approval workflow
- [ ] Enrollment status tracking
- [ ] Email notifications for invites
- [ ] Bulk enrollment import

### Phase 5: Exam Delivery (Week 4-5)
- [ ] Exam taking interface for candidates
- [ ] Timer and progress tracking
- [ ] Question navigation
- [ ] Answer submission
- [ ] Exam completion flow

### Phase 6: Proctoring (Week 5-6)
- [ ] Integrate external AI provider for monitoring
- [ ] Flag generation system
- [ ] Session recording (Vercel Blob)
- [ ] Real-time monitoring dashboard
- [ ] Violation detection logic

### Phase 7: Review & Appeals (Week 6-7)
- [ ] Session review interface for reviewers
- [ ] Evidence viewer with video playback
- [ ] Flag adjudication workflow
- [ ] Appeals submission for candidates
- [ ] Appeals review process

### Phase 8: Reporting & Analytics (Week 7-8)
- [ ] Admin dashboard with metrics
- [ ] Exam results reports
- [ ] Candidate performance analytics
- [ ] Flag statistics
- [ ] Audit log viewer

## Useful Commands

### Development

```bash
# Run all apps
npm run dev

# Run specific app
cd apps/candidate && npm run dev

# Build all apps
npm run build

# Lint code
npm run lint

# Clean build artifacts
npm run clean
```

### Database

```bash
# Open Prisma Studio (visual database editor)
npm run db:studio

# Create new migration
npm run db:migrate

# Reset database (WARNING: deletes all data)
cd packages/database && npx prisma migrate reset

# Seed database
npm run db:seed
```

### Adding New Features

```bash
# Add new permission
# Edit: packages/permissions/index.ts

# Add new database model
# Edit: packages/database/prisma/schema.prisma
npm run db:migrate

# Add new UI component
# Create: packages/ui/components/your-component.tsx
# Export: packages/ui/index.tsx

# Add new page to app
# Create: apps/[app-name]/app/your-page/page.tsx
```

## Architecture Decisions

### Why Monorepo?
- Share code between applications (database, auth, permissions, UI)
- Consistent tooling and dependencies
- Atomic commits across multiple apps
- Easier refactoring

### Why Separate Apps?
- **Security**: Complete isolation between roles
- **Performance**: Each app bundles only what it needs
- **Deployment**: Deploy apps independently
- **Team Structure**: Different teams can own different apps

### Why Better Auth?
- Modern, type-safe authentication
- Built for Next.js App Router
- Prisma adapter included
- Session management out of the box

### Why Prisma?
- Type-safe database access
- Automatic migrations
- Visual database editor (Studio)
- Excellent Next.js integration

## Common Issues

### "Module not found" errors
```bash
# Regenerate Prisma Client
npm run db:generate

# Clear node_modules
rm -rf node_modules package-lock.json
npm install
```

### Port already in use
```bash
# Kill process on specific port
lsof -ti:3001 | xargs kill -9
```

### Database connection errors
1. Check DATABASE_URL in .env
2. Verify PostgreSQL is running
3. Test connection with Prisma Studio: `npm run db:studio`

### TypeScript errors
```bash
# Check types without building
npx tsc --noEmit

# Regenerate types
npm run db:generate
```

## Project Structure Explanation

```
proctor-exam/
├── apps/                          # Next.js Applications
│   ├── candidate/                 # Port 3001
│   │   ├── app/                   # Next.js App Router
│   │   │   ├── page.tsx           # Home page
│   │   │   ├── layout.tsx         # Root layout
│   │   │   └── globals.css        # Global styles
│   │   ├── package.json           # App dependencies
│   │   ├── next.config.ts         # Next.js config
│   │   ├── tsconfig.json          # TypeScript config
│   │   └── tailwind.config.ts     # Tailwind config
│   ├── admin/                     # Port 3002 (same structure)
│   ├── author/                    # Port 3003
│   ├── coordinator/               # Port 3004
│   └── reviewer/                  # Port 3005
│
├── packages/                      # Shared Packages
│   ├── database/                  # Prisma
│   │   ├── prisma/
│   │   │   ├── schema.prisma      # Database schema
│   │   │   └── seed.ts            # Seed data
│   │   ├── index.ts               # Prisma client export
│   │   └── package.json
│   │
│   ├── auth/                      # Better Auth
│   │   ├── index.ts               # Auth configuration
│   │   └── package.json
│   │
│   ├── permissions/               # RBAC
│   │   ├── index.ts               # Permissions logic
│   │   └── package.json
│   │
│   ├── ui/                        # UI Components
│   │   ├── components/            # shadcn/ui components
│   │   ├── lib/utils.ts           # Utility functions
│   │   ├── index.tsx              # Component exports
│   │   ├── tailwind.config.js     # Tailwind config
│   │   └── package.json
│   │
│   └── config/                    # Shared Config
│       ├── index.ts               # App configuration
│       └── package.json
│
├── package.json                   # Root package (workspace)
├── turbo.json                     # Turborepo config
├── .gitignore                     # Git ignore rules
├── README.md                      # Quick reference
├── CLAUDE.md                      # Comprehensive docs
└── GETTING_STARTED.md            # This file
```

## Resources

- **Next.js 16**: https://nextjs.org/docs
- **React 19**: https://react.dev
- **Better Auth**: https://better-auth.com
- **Prisma**: https://www.prisma.io/docs
- **shadcn/ui**: https://ui.shadcn.com
- **Tailwind CSS**: https://tailwindcss.com/docs
- **Turborepo**: https://turbo.build/repo/docs

## Support

1. Read [CLAUDE.md](./CLAUDE.md) for detailed documentation
2. Check database schema in `packages/database/prisma/schema.prisma`
3. Review permissions in `packages/permissions/index.ts`
4. Test with demo accounts from seed data

## Success Criteria

You'll know everything is working when:

✅ All 5 applications start without errors
✅ You can access all apps on their respective ports
✅ Database migrations run successfully
✅ Demo data is seeded
✅ TypeScript compiles without errors
✅ You can see the landing pages on all apps

Happy coding! 🚀
