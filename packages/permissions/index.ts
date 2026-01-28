import { Role, prisma } from '@proctorguard/database';

// ============================================================================
// PERMISSION DEFINITIONS
// ============================================================================

export enum Permission {
  // Organization Management
  MANAGE_ORGANIZATION = 'manage_organization',
  MANAGE_DEPARTMENTS = 'manage_departments',
  MANAGE_USERS = 'manage_users',
  MANAGE_ROLES = 'manage_roles',

  // Question Bank & Content
  CREATE_QUESTION_BANK = 'create_question_bank',
  EDIT_QUESTION_BANK = 'edit_question_bank',
  DELETE_QUESTION_BANK = 'delete_question_bank',
  APPROVE_QUESTION_BANK = 'approve_question_bank',
  VIEW_QUESTION_BANK = 'view_question_bank',

  // Questions
  CREATE_QUESTION = 'create_question',
  EDIT_QUESTION = 'edit_question',
  DELETE_QUESTION = 'delete_question',
  APPROVE_QUESTION = 'approve_question',
  VIEW_QUESTION = 'view_question',

  // Exam Configuration
  CREATE_EXAM = 'create_exam',
  EDIT_EXAM = 'edit_exam',
  DELETE_EXAM = 'delete_exam',
  SCHEDULE_EXAM = 'schedule_exam',
  VIEW_EXAM_CONFIG = 'view_exam_config',

  // Enrollment Management
  INVITE_CANDIDATE = 'invite_candidate',
  APPROVE_ENROLLMENT = 'approve_enrollment',
  REJECT_ENROLLMENT = 'reject_enrollment',
  VIEW_ENROLLMENTS = 'view_enrollments',

  // Exam Sessions
  TAKE_EXAM = 'take_exam',
  VIEW_OWN_RESULTS = 'view_own_results',
  VIEW_ALL_SESSIONS = 'view_all_sessions',

  // Proctoring & Review
  REVIEW_SESSION = 'review_session',
  FLAG_SESSION = 'flag_session',
  RESOLVE_FLAG = 'resolve_flag',
  VIEW_RECORDINGS = 'view_recordings',

  // Appeals
  SUBMIT_APPEAL = 'submit_appeal',
  REVIEW_APPEAL = 'review_appeal',

  // Reporting & Analytics
  VIEW_REPORTS = 'view_reports',
  EXPORT_DATA = 'export_data',

  // Audit & Compliance
  VIEW_AUDIT_LOGS = 'view_audit_logs',
  QUALITY_REVIEW = 'quality_review',
}

// ============================================================================
// ROLE-PERMISSION MATRIX
// ============================================================================

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.SUPER_ADMIN]: [
    // Full system access
    Permission.MANAGE_ORGANIZATION,
    Permission.MANAGE_DEPARTMENTS,
    Permission.MANAGE_USERS,
    Permission.MANAGE_ROLES,
    Permission.CREATE_QUESTION_BANK,
    Permission.EDIT_QUESTION_BANK,
    Permission.DELETE_QUESTION_BANK,
    Permission.APPROVE_QUESTION_BANK,
    Permission.VIEW_QUESTION_BANK,
    Permission.CREATE_QUESTION,
    Permission.EDIT_QUESTION,
    Permission.DELETE_QUESTION,
    Permission.APPROVE_QUESTION,
    Permission.VIEW_QUESTION,
    Permission.CREATE_EXAM,
    Permission.EDIT_EXAM,
    Permission.DELETE_EXAM,
    Permission.SCHEDULE_EXAM,
    Permission.VIEW_EXAM_CONFIG,
    Permission.INVITE_CANDIDATE,
    Permission.APPROVE_ENROLLMENT,
    Permission.REJECT_ENROLLMENT,
    Permission.VIEW_ENROLLMENTS,
    Permission.VIEW_ALL_SESSIONS,
    Permission.REVIEW_SESSION,
    Permission.FLAG_SESSION,
    Permission.RESOLVE_FLAG,
    Permission.VIEW_RECORDINGS,
    Permission.REVIEW_APPEAL,
    Permission.VIEW_REPORTS,
    Permission.EXPORT_DATA,
    Permission.VIEW_AUDIT_LOGS,
    Permission.QUALITY_REVIEW,
  ],

  [Role.ORG_ADMIN]: [
    // Organization-level management
    Permission.MANAGE_DEPARTMENTS,
    Permission.MANAGE_USERS,
    Permission.MANAGE_ROLES,
    Permission.VIEW_QUESTION_BANK,
    Permission.VIEW_EXAM_CONFIG,
    Permission.VIEW_ENROLLMENTS,
    Permission.VIEW_ALL_SESSIONS,
    Permission.VIEW_REPORTS,
    Permission.EXPORT_DATA,
    Permission.VIEW_AUDIT_LOGS,
  ],

  [Role.EXAM_AUTHOR]: [
    // Content creation only - cannot see who takes exams
    Permission.CREATE_QUESTION_BANK,
    Permission.EDIT_QUESTION_BANK,
    Permission.DELETE_QUESTION_BANK,
    Permission.VIEW_QUESTION_BANK,
    Permission.CREATE_QUESTION,
    Permission.EDIT_QUESTION,
    Permission.DELETE_QUESTION,
    Permission.VIEW_QUESTION,
    // CANNOT: View exam schedules, enrollments, or results
  ],

  [Role.EXAM_COORDINATOR]: [
    // Exam scheduling and configuration - cannot create questions
    Permission.VIEW_QUESTION_BANK, // Can view/select but not create
    Permission.CREATE_EXAM,
    Permission.EDIT_EXAM,
    Permission.DELETE_EXAM,
    Permission.SCHEDULE_EXAM,
    Permission.VIEW_EXAM_CONFIG,
    Permission.VIEW_ENROLLMENTS,
    // CANNOT: Create questions, review sessions, or see detailed results
  ],

  [Role.ENROLLMENT_MANAGER]: [
    // Candidate enrollment only
    Permission.INVITE_CANDIDATE,
    Permission.APPROVE_ENROLLMENT,
    Permission.REJECT_ENROLLMENT,
    Permission.VIEW_ENROLLMENTS,
    // CANNOT: Configure exams, create questions, or review sessions
  ],

  [Role.PROCTOR_REVIEWER]: [
    // Session review and proctoring
    Permission.VIEW_ALL_SESSIONS,
    Permission.REVIEW_SESSION,
    Permission.FLAG_SESSION,
    Permission.RESOLVE_FLAG,
    Permission.VIEW_RECORDINGS,
    Permission.REVIEW_APPEAL,
    // CANNOT: Create content, configure exams, or manage enrollments
  ],

  [Role.QUALITY_ASSURANCE]: [
    // Audit and quality review
    Permission.VIEW_QUESTION_BANK,
    Permission.APPROVE_QUESTION_BANK,
    Permission.APPROVE_QUESTION,
    Permission.VIEW_EXAM_CONFIG,
    Permission.VIEW_ALL_SESSIONS,
    Permission.VIEW_RECORDINGS,
    Permission.VIEW_REPORTS,
    Permission.VIEW_AUDIT_LOGS,
    Permission.QUALITY_REVIEW,
    // CANNOT: Create or edit content, manage enrollments
  ],

  [Role.REPORT_VIEWER]: [
    // Read-only analytics access
    Permission.VIEW_REPORTS,
    Permission.EXPORT_DATA,
    // CANNOT: Any write operations
  ],

  [Role.CANDIDATE]: [
    // Exam taker permissions
    Permission.TAKE_EXAM,
    Permission.VIEW_OWN_RESULTS,
    Permission.SUBMIT_APPEAL,
    // CANNOT: Access any administrative functions
  ],
};

// ============================================================================
// PERMISSION CHECK FUNCTIONS
// ============================================================================

export interface PermissionContext {
  userId: string;
  organizationId: string;
  departmentId?: string;
}

/**
 * Get all roles for a user in an organization
 */
export async function getUserRoles(
  userId: string,
  organizationId: string
): Promise<Role[]> {
  const userRoles = await prisma.userRole.findMany({
    where: {
      userId,
      organizationId,
    },
    select: {
      role: true,
    },
  });

  return userRoles.map(ur => ur.role);
}

/**
 * Get all permissions for a user in an organization
 */
export async function getUserPermissions(
  userId: string,
  organizationId: string
): Promise<Permission[]> {
  const roles = await getUserRoles(userId, organizationId);

  const permissions = new Set<Permission>();
  for (const role of roles) {
    const rolePermissions = ROLE_PERMISSIONS[role] || [];
    rolePermissions.forEach(p => permissions.add(p));
  }

  return Array.from(permissions);
}

/**
 * Check if a user has a specific permission
 */
export async function hasPermission(
  context: PermissionContext,
  permission: Permission
): Promise<boolean> {
  const permissions = await getUserPermissions(
    context.userId,
    context.organizationId
  );

  return permissions.includes(permission);
}

/**
 * Check if a user has ALL of the specified permissions
 */
export async function hasAllPermissions(
  context: PermissionContext,
  permissions: Permission[]
): Promise<boolean> {
  const userPermissions = await getUserPermissions(
    context.userId,
    context.organizationId
  );

  return permissions.every(p => userPermissions.includes(p));
}

/**
 * Check if a user has ANY of the specified permissions
 */
export async function hasAnyPermission(
  context: PermissionContext,
  permissions: Permission[]
): Promise<boolean> {
  const userPermissions = await getUserPermissions(
    context.userId,
    context.organizationId
  );

  return permissions.some(p => userPermissions.includes(p));
}

/**
 * Check if a user has a specific role
 */
export async function hasRole(
  userId: string,
  organizationId: string,
  role: Role
): Promise<boolean> {
  const roles = await getUserRoles(userId, organizationId);
  return roles.includes(role);
}

/**
 * Require permission or throw error
 */
export async function requirePermission(
  context: PermissionContext,
  permission: Permission
): Promise<void> {
  const allowed = await hasPermission(context, permission);

  if (!allowed) {
    throw new Error(
      `Permission denied: User ${context.userId} does not have permission ${permission}`
    );
  }
}

/**
 * Require role or throw error
 */
export async function requireRole(
  userId: string,
  organizationId: string,
  role: Role
): Promise<void> {
  const hasRoleAccess = await hasRole(userId, organizationId, role);

  if (!hasRoleAccess) {
    throw new Error(
      `Access denied: User ${userId} does not have role ${role}`
    );
  }
}

// ============================================================================
// RESOURCE-BASED ACCESS CONTROL HELPERS
// ============================================================================

/**
 * Check if user can access a specific question bank
 */
export async function canAccessQuestionBank(
  userId: string,
  questionBankId: string
): Promise<boolean> {
  const questionBank = await prisma.questionBank.findUnique({
    where: { id: questionBankId },
    select: { organizationId: true, authorId: true },
  });

  if (!questionBank) return false;

  // Authors can always access their own question banks
  if (questionBank.authorId === userId) return true;

  // Otherwise check organization-level permissions
  const permissions = await getUserPermissions(userId, questionBank.organizationId);
  return permissions.includes(Permission.VIEW_QUESTION_BANK);
}

/**
 * Check if user can access a specific exam
 */
export async function canAccessExam(
  userId: string,
  examId: string
): Promise<boolean> {
  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    select: { organizationId: true, coordinatorId: true },
  });

  if (!exam) return false;

  // Coordinators can always access their own exams
  if (exam.coordinatorId === userId) return true;

  // Check if user is enrolled as candidate
  const enrollment = await prisma.enrollment.findFirst({
    where: { examId, candidateId: userId },
  });
  if (enrollment) return true;

  // Otherwise check organization-level permissions
  const permissions = await getUserPermissions(userId, exam.organizationId);
  return permissions.includes(Permission.VIEW_EXAM_CONFIG);
}

/**
 * Check if user can access a specific session
 */
export async function canAccessSession(
  userId: string,
  sessionId: string
): Promise<boolean> {
  const session = await prisma.examSession.findUnique({
    where: { id: sessionId },
    select: {
      candidateId: true,
      exam: { select: { organizationId: true } },
    },
  });

  if (!session) return false;

  // Candidates can access their own sessions
  if (session.candidateId === userId) return true;

  // Otherwise check organization-level permissions
  const permissions = await getUserPermissions(userId, session.exam.organizationId);
  return permissions.includes(Permission.VIEW_ALL_SESSIONS);
}

// ============================================================================
// EXPORTS
// ============================================================================

export { Role } from '@proctorguard/database';
