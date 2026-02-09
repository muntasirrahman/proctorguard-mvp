import { PrismaClient, Role, QuestionBankStatus, QuestionStatus, Difficulty } from '@prisma/client';
import { auth } from '@proctorguard/auth';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create demo organization
  const org = await prisma.organization.upsert({
    where: { slug: 'acme-corp' },
    update: {},
    create: {
      name: 'ACME Corporation',
      slug: 'acme-corp',
      domain: 'acme.com',
      settings: {
        timezone: 'America/New_York',
        language: 'en',
      },
    },
  });
  console.log('✅ Created organization:', org.name);

  // Create departments
  const itDept = await prisma.department.create({
    data: {
      name: 'Information Technology',
      organizationId: org.id,
    },
  });

  const hrDept = await prisma.department.create({
    data: {
      name: 'Human Resources',
      organizationId: org.id,
    },
  });
  console.log('✅ Created departments');

  // Create demo users using Better Auth's signUp handler directly
  const demoUsers = [
    { email: 'admin@acme.com', name: 'Super Admin', password: 'password123' },
    { email: 'orgadmin@acme.com', name: 'Organization Admin', password: 'password123' },
    { email: 'author@acme.com', name: 'Exam Author', password: 'password123' },
    { email: 'coordinator@acme.com', name: 'Exam Coordinator', password: 'password123' },
    { email: 'enrollment@acme.com', name: 'Enrollment Manager', password: 'password123' },
    { email: 'reviewer@acme.com', name: 'Proctor Reviewer', password: 'password123' },
    { email: 'candidate@acme.com', name: 'John Candidate', password: 'password123' },
    // Multi-role test users
    { email: 'author-coordinator@acme.com', name: 'Author & Coordinator', password: 'password123' },
    { email: 'coordinator-reviewer@acme.com', name: 'Coordinator & Reviewer', password: 'password123' },
    { email: 'admin-author@acme.com', name: 'Admin & Author', password: 'password123' },
    { email: 'multirole@acme.com', name: 'Multi-Role User', password: 'password123' },
  ];

  // Create users through Better Auth's signUp handler
  const createdUsers: Record<string, any> = {};
  for (const userData of demoUsers) {
    // Use Better Auth's signUp handler to create user and account with proper password hashing
    const result = await auth.api.signUpEmail({
      body: {
        email: userData.email,
        password: userData.password,
        name: userData.name,
      },
    });

    if (result && result.user) {
      // Update emailVerified to true
      await prisma.user.update({
        where: { id: result.user.id },
        data: { emailVerified: true },
      });
      createdUsers[userData.email] = result.user;
    }
  }

  const superAdmin = createdUsers['admin@acme.com'];
  const orgAdmin = createdUsers['orgadmin@acme.com'];
  const examAuthor = createdUsers['author@acme.com'];
  const coordinator = createdUsers['coordinator@acme.com'];
  const enrollmentMgr = createdUsers['enrollment@acme.com'];
  const reviewer = createdUsers['reviewer@acme.com'];
  const candidate = createdUsers['candidate@acme.com'];
  const authorCoordinator = createdUsers['author-coordinator@acme.com'];
  const coordinatorReviewer = createdUsers['coordinator-reviewer@acme.com'];
  const adminAuthor = createdUsers['admin-author@acme.com'];
  const multiRole = createdUsers['multirole@acme.com'];

  console.log('✅ Created demo users with Better Auth');

  // Assign roles
  await prisma.userRole.createMany({
    data: [
      // Single-role users
      { userId: superAdmin.id, role: Role.SUPER_ADMIN, organizationId: org.id },
      { userId: orgAdmin.id, role: Role.ORG_ADMIN, organizationId: org.id },
      { userId: examAuthor.id, role: Role.EXAM_AUTHOR, organizationId: org.id, departmentId: itDept.id },
      { userId: coordinator.id, role: Role.EXAM_COORDINATOR, organizationId: org.id, departmentId: itDept.id },
      { userId: enrollmentMgr.id, role: Role.ENROLLMENT_MANAGER, organizationId: org.id, departmentId: hrDept.id },
      { userId: reviewer.id, role: Role.PROCTOR_REVIEWER, organizationId: org.id },
      { userId: candidate.id, role: Role.CANDIDATE, organizationId: org.id },
      // Multi-role users
      { userId: authorCoordinator.id, role: Role.EXAM_AUTHOR, organizationId: org.id, departmentId: itDept.id },
      { userId: authorCoordinator.id, role: Role.EXAM_COORDINATOR, organizationId: org.id, departmentId: itDept.id },
      { userId: coordinatorReviewer.id, role: Role.EXAM_COORDINATOR, organizationId: org.id, departmentId: itDept.id },
      { userId: coordinatorReviewer.id, role: Role.PROCTOR_REVIEWER, organizationId: org.id },
      { userId: adminAuthor.id, role: Role.ORG_ADMIN, organizationId: org.id },
      { userId: adminAuthor.id, role: Role.EXAM_AUTHOR, organizationId: org.id, departmentId: itDept.id },
      { userId: multiRole.id, role: Role.ORG_ADMIN, organizationId: org.id },
      { userId: multiRole.id, role: Role.EXAM_AUTHOR, organizationId: org.id, departmentId: itDept.id },
      { userId: multiRole.id, role: Role.EXAM_COORDINATOR, organizationId: org.id, departmentId: itDept.id },
      { userId: multiRole.id, role: Role.PROCTOR_REVIEWER, organizationId: org.id },
    ],
    skipDuplicates: true,
  });
  console.log('✅ Assigned roles (including multi-role users)');

  // Add organization members
  await prisma.organizationMember.createMany({
    data: [
      { userId: superAdmin.id, organizationId: org.id },
      { userId: orgAdmin.id, organizationId: org.id },
      { userId: examAuthor.id, organizationId: org.id },
      { userId: coordinator.id, organizationId: org.id },
      { userId: enrollmentMgr.id, organizationId: org.id },
      { userId: reviewer.id, organizationId: org.id },
      { userId: candidate.id, organizationId: org.id },
      { userId: authorCoordinator.id, organizationId: org.id },
      { userId: coordinatorReviewer.id, organizationId: org.id },
      { userId: adminAuthor.id, organizationId: org.id },
      { userId: multiRole.id, organizationId: org.id },
    ],
    skipDuplicates: true,
  });
  console.log('✅ Added organization members');

  // Create sample question bank
  const questionBank = await prisma.questionBank.create({
    data: {
      title: 'JavaScript Fundamentals',
      description: 'Basic JavaScript knowledge assessment',
      organizationId: org.id,
      authorId: examAuthor.id,
      status: QuestionBankStatus.APPROVED,
      tags: ['javascript', 'programming', 'fundamentals'],
    },
  });
  console.log('✅ Created question bank');

  // Create sample questions
  await prisma.question.createMany({
    data: [
      {
        questionBankId: questionBank.id,
        type: 'multiple_choice',
        text: 'What is the output of: console.log(typeof null)?',
        options: {
          a: 'null',
          b: 'object',
          c: 'undefined',
          d: 'number',
        },
        correctAnswer: { answer: 'b' },
        explanation: 'In JavaScript, typeof null returns "object" due to a historical bug in the language.',
        difficulty: Difficulty.EASY,
        points: 5,
        status: QuestionStatus.APPROVED,
        tags: ['javascript', 'types'],
      },
      {
        questionBankId: questionBank.id,
        type: 'multiple_choice',
        text: 'Which method is used to add elements to the end of an array?',
        options: {
          a: 'push()',
          b: 'pop()',
          c: 'shift()',
          d: 'unshift()',
        },
        correctAnswer: { answer: 'a' },
        explanation: 'The push() method adds one or more elements to the end of an array.',
        difficulty: Difficulty.EASY,
        points: 5,
        status: QuestionStatus.APPROVED,
        tags: ['javascript', 'arrays'],
      },
      {
        questionBankId: questionBank.id,
        type: 'multiple_choice',
        text: 'What is a closure in JavaScript?',
        options: {
          a: 'A function with no parameters',
          b: 'A function that has access to variables in its outer scope',
          c: 'A method to close browser windows',
          d: 'An error handling mechanism',
        },
        correctAnswer: { answer: 'b' },
        explanation: 'A closure is a function that has access to variables in its outer (enclosing) lexical scope.',
        difficulty: Difficulty.MEDIUM,
        points: 10,
        status: QuestionStatus.APPROVED,
        tags: ['javascript', 'closures', 'advanced'],
      },
    ],
  });
  console.log('✅ Created sample questions');

  console.log('🎉 Database seeded successfully!');
  console.log('\n📧 Demo login credentials (all passwords: password123):');
  console.log('\n--- Single-Role Users ---');
  console.log('Super Admin: admin@acme.com');
  console.log('Org Admin: orgadmin@acme.com');
  console.log('Exam Author: author@acme.com');
  console.log('Coordinator: coordinator@acme.com');
  console.log('Enrollment Manager: enrollment@acme.com');
  console.log('Reviewer: reviewer@acme.com');
  console.log('Candidate: candidate@acme.com');
  console.log('\n--- Multi-Role Test Users ---');
  console.log('Author + Coordinator: author-coordinator@acme.com');
  console.log('Coordinator + Reviewer: coordinator-reviewer@acme.com');
  console.log('Admin + Author: admin-author@acme.com');
  console.log('All Staff Roles: multirole@acme.com');
  console.log('\n(Use Better Auth for authentication in the apps)\n');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
