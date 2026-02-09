'use client';

import { Permission } from '@proctorguard/permissions';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  FileQuestion,
  Calendar,
  Video,
  Settings,
  Home,
  LogOut,
  User,
  LucideIcon
} from 'lucide-react';
import { createAuthClient } from 'better-auth/react';

export type NavItem = {
  label: string;
  href: string;
  permission?: Permission;
};

export type NavSection = {
  label: string;
  icon: LucideIcon;
  items: NavItem[];
};

export const staffNavigation: NavSection[] = [
  {
    label: 'Dashboard',
    icon: Home,
    items: [
      { label: 'Overview', href: '/dashboard' },
    ],
  },
  {
    label: 'Questions',
    icon: FileQuestion,
    items: [
      {
        label: 'Question Banks',
        href: '/dashboard/questions',
        permission: Permission.VIEW_QUESTION_BANK,
      },
      {
        label: 'Create Question Bank',
        href: '/dashboard/questions/new',
        permission: Permission.CREATE_QUESTION_BANK,
      },
      {
        label: 'Review Queue',
        href: '/dashboard/questions/review',
        permission: Permission.APPROVE_QUESTION,
      },
    ],
  },
  {
    label: 'Exams',
    icon: Calendar,
    items: [
      {
        label: 'All Exams',
        href: '/dashboard/exams',
        permission: Permission.VIEW_EXAM_CONFIG,
      },
      {
        label: 'Create Exam',
        href: '/dashboard/exams/new',
        permission: Permission.CREATE_EXAM,
      },
      {
        label: 'Enrollments',
        href: '/dashboard/enrollments',
        permission: Permission.VIEW_ENROLLMENTS,
      },
    ],
  },
  {
    label: 'Sessions',
    icon: Video,
    items: [
      {
        label: 'Review Sessions',
        href: '/dashboard/sessions',
        permission: Permission.REVIEW_SESSION,
      },
      {
        label: 'Flagged Sessions',
        href: '/dashboard/sessions/flagged',
        permission: Permission.RESOLVE_FLAG,
      },
    ],
  },
  {
    label: 'Administration',
    icon: Settings,
    items: [
      {
        label: 'Users',
        href: '/dashboard/admin/users',
        permission: Permission.MANAGE_USERS,
      },
      {
        label: 'Departments',
        href: '/dashboard/admin/departments',
        permission: Permission.MANAGE_DEPARTMENTS,
      },
      {
        label: 'Reports',
        href: '/dashboard/reports',
        permission: Permission.VIEW_REPORTS,
      },
      {
        label: 'Audit Logs',
        href: '/dashboard/admin/audit',
        permission: Permission.VIEW_AUDIT_LOGS,
      },
    ],
  },
];

type StaffNavigationProps = {
  userPermissions: Permission[];
  user: {
    name?: string | null;
    email: string;
  };
};

function filterNavigationByPermissions(
  navigation: NavSection[],
  permissions: Permission[]
): NavSection[] {
  return navigation
    .map(section => ({
      ...section,
      items: section.items.filter(item =>
        !item.permission || permissions.includes(item.permission)
      ),
    }))
    .filter(section => section.items.length > 0);
}

export function StaffNavigation({ userPermissions, user }: StaffNavigationProps) {
  const pathname = usePathname();
  const filteredNav = filterNavigationByPermissions(staffNavigation, userPermissions);
  const { signOut } = createAuthClient();

  return (
    <nav className="w-64 bg-white border-r border-gray-200 min-h-screen p-4 flex flex-col">
      <div className="mb-8">
        <h1 className="text-xl font-bold text-gray-900">ProctorGuard</h1>
        <p className="text-sm text-gray-500">Staff Portal</p>
      </div>

      <div className="space-y-6 flex-1">
        {filteredNav.map(section => (
          <div key={section.label}>
            <div className="flex items-center gap-2 mb-2 text-gray-700 font-medium">
              <section.icon className="w-4 h-4" />
              <span className="text-sm">{section.label}</span>
            </div>
            <ul className="space-y-1 ml-6">
              {section.items.map(item => {
                const isActive = pathname === item.href;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`block px-3 py-2 rounded-md text-sm transition-colors ${
                        isActive
                          ? 'bg-blue-50 text-blue-700 font-medium'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {/* User Menu at bottom */}
      <div className="mt-auto pt-4 border-t border-gray-200">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
            <User className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user.name || 'User'}
            </p>
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
          </div>
        </div>
        <button
          onClick={() => {
            signOut({
              fetchOptions: {
                onSuccess: () => {
                  window.location.href = '/auth/signin';
                },
              },
            });
          }}
          className="w-full mt-2 flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </nav>
  );
}
