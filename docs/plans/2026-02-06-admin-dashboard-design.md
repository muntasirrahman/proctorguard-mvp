# Admin Dashboard Design

**Date**: 2026-02-06
**Status**: Approved
**Issue**: proctor-exam-mvp-5xs

## Overview

Build the admin dashboard (port 3002) for organization management, user/role management, and department CRUD.

## Route Structure

```
/dashboard              → Overview (stats + recent activity)
/dashboard/users        → User list + invite
/dashboard/users/[id]   → User detail (view/edit roles)
/dashboard/departments  → Department list + CRUD
```

Sidebar navigation with active state highlighting. Uses existing DashboardShell component.

## Pages

### Overview (`/dashboard`)

**Stats Cards** (top row):
- Total Users - count of org members
- Departments - count of departments
- Roles Assigned - total UserRole records

**Recent Activity** (below stats):
- Last 10 audit log entries for user/role/department changes
- Format: "John Doe was added as EXAM_AUTHOR" - 2 hours ago

### Users Page (`/dashboard/users`)

**Header**: "Users" title + "Invite User" button

**Search**: Filter by name/email

**Table Columns**:
| Name | Email | Roles | Joined | Actions |
|------|-------|-------|--------|---------|
| John Doe | john@acme.com | Author, Coordinator | Jan 15 | Edit, Remove |

- Roles shown as badges
- Edit → user detail page
- Remove → confirmation modal, removes from org

**Invite User Modal**:
- Email (required)
- Name (optional)
- Roles (multi-select checkboxes, min 1 required)

Creates: User (if not exists), OrganizationMember, UserRole records

### User Detail Page (`/dashboard/users/[id]`)

- User info header (name, email, joined date)
- Role checkboxes (all 9 roles, check/uncheck to assign/remove)
- Save button for role changes
- Remove from organization button (with confirmation)

### Departments Page (`/dashboard/departments`)

**Header**: "Departments" title + "Create Department" button

**Table**:
| Name | Members | Created | Actions |
|------|---------|---------|---------|
| Engineering | 12 | Jan 10 | Edit, Delete |

- Members = users with roles scoped to department
- Edit → inline rename or modal
- Delete → confirmation, blocked if has members

**Create Department Modal**:
- Name (required)
- No hierarchy for MVP

## Server Actions

### `apps/admin/app/actions/users.ts`

```typescript
getUsers(orgId: string)
// Returns org members with their roles

inviteUser(orgId: string, email: string, name: string | null, roles: Role[])
// Creates User if not exists, OrganizationMember, UserRole records
// Requires: MANAGE_USERS, MANAGE_ROLES

updateUserRoles(orgId: string, userId: string, roles: Role[])
// Replaces all user roles with new set
// Requires: MANAGE_ROLES

removeUser(orgId: string, userId: string)
// Removes OrganizationMember and UserRole records
// Requires: MANAGE_USERS
```

### `apps/admin/app/actions/departments.ts`

```typescript
getDepartments(orgId: string)
// Returns departments with member counts

createDepartment(orgId: string, name: string)
// Creates department
// Requires: MANAGE_DEPARTMENTS

updateDepartment(orgId: string, deptId: string, name: string)
// Renames department
// Requires: MANAGE_DEPARTMENTS

deleteDepartment(orgId: string, deptId: string)
// Deletes department (fails if has members)
// Requires: MANAGE_DEPARTMENTS
```

### `apps/admin/app/actions/dashboard.ts`

```typescript
getDashboardStats(orgId: string)
// Returns { userCount, departmentCount, roleCount }

getRecentActivity(orgId: string, limit: number)
// Returns recent AuditLog entries for org
```

## Permission Matrix

| Action | Required Permission |
|--------|-------------------|
| View users | MANAGE_USERS |
| Invite user | MANAGE_USERS, MANAGE_ROLES |
| Update roles | MANAGE_ROLES |
| Remove user | MANAGE_USERS |
| View departments | MANAGE_DEPARTMENTS |
| Create/Edit/Delete dept | MANAGE_DEPARTMENTS |

ORG_ADMIN role has all these permissions.

## Org Context

For MVP (single org), get user's organization from their first OrganizationMember record. No org switcher needed yet.

## UI Components

Uses `@proctorguard/ui` (shadcn):
- Card, Table, Button, Input, Dialog, Checkbox, Badge
- DataTable pattern for users/departments lists

## Out of Scope

- Email sending for invites (just create records)
- Department hierarchy (parent/child)
- Org switcher (single org MVP)
- Bulk user import
