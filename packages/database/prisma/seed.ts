import { PrismaClient, Role, QuestionBankStatus, QuestionStatus, Difficulty } from '@prisma/client';
import { hash } from 'bcryptjs';

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

  // Create demo users
  const hashedPassword = await hash('password123', 10);

  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@acme.com' },
    update: {},
    create: {
      email: 'admin@acme.com',
      name: 'Super Admin',
      emailVerified: new Date(),
    },
  });

  const orgAdmin = await prisma.user.upsert({
    where: { email: 'orgadmin@acme.com' },
    update: {},
    create: {
      email: 'orgadmin@acme.com',
      name: 'Organization Admin',
      emailVerified: new Date(),
    },
  });

  const examAuthor = await prisma.user.upsert({
    where: { email: 'author@acme.com' },
    update: {},
    create: {
      email: 'author@acme.com',
      name: 'Exam Author',
      emailVerified: new Date(),
    },
  });

  const coordinator = await prisma.user.upsert({
    where: { email: 'coordinator@acme.com' },
    update: {},
    create: {
      email: 'coordinator@acme.com',
      name: 'Exam Coordinator',
      emailVerified: new Date(),
    },
  });

  const enrollmentMgr = await prisma.user.upsert({
    where: { email: 'enrollment@acme.com' },
    update: {},
    create: {
      email: 'enrollment@acme.com',
      name: 'Enrollment Manager',
      emailVerified: new Date(),
    },
  });

  const reviewer = await prisma.user.upsert({
    where: { email: 'reviewer@acme.com' },
    update: {},
    create: {
      email: 'reviewer@acme.com',
      name: 'Proctor Reviewer',
      emailVerified: new Date(),
    },
  });

  const candidate = await prisma.user.upsert({
    where: { email: 'candidate@acme.com' },
    update: {},
    create: {
      email: 'candidate@acme.com',
      name: 'John Candidate',
      emailVerified: new Date(),
    },
  });

  console.log('✅ Created demo users');

  // Assign roles
  await prisma.userRole.createMany({
    data: [
      { userId: superAdmin.id, role: Role.SUPER_ADMIN, organizationId: org.id },
      { userId: orgAdmin.id, role: Role.ORG_ADMIN, organizationId: org.id },
      { userId: examAuthor.id, role: Role.EXAM_AUTHOR, organizationId: org.id, departmentId: itDept.id },
      { userId: coordinator.id, role: Role.EXAM_COORDINATOR, organizationId: org.id, departmentId: itDept.id },
      { userId: enrollmentMgr.id, role: Role.ENROLLMENT_MANAGER, organizationId: org.id, departmentId: hrDept.id },
      { userId: reviewer.id, role: Role.PROCTOR_REVIEWER, organizationId: org.id },
      { userId: candidate.id, role: Role.CANDIDATE, organizationId: org.id },
    ],
    skipDuplicates: true,
  });
  console.log('✅ Assigned roles');

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
  console.log('\n📧 Demo login credentials:');
  console.log('Super Admin: admin@acme.com');
  console.log('Org Admin: orgadmin@acme.com');
  console.log('Exam Author: author@acme.com');
  console.log('Coordinator: coordinator@acme.com');
  console.log('Enrollment Manager: enrollment@acme.com');
  console.log('Reviewer: reviewer@acme.com');
  console.log('Candidate: candidate@acme.com');
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
