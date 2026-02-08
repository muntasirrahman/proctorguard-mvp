// Application configuration shared across all apps

export const APP_CONFIG = {
  name: 'ProctorGuard',
  version: '0.0.1',

  // Application URLs (can be overridden by environment variables)
  apps: {
    candidate: {
      name: 'Candidate Portal',
      port: 4000,
      url: process.env.CANDIDATE_URL || 'http://localhost:4000',
    },
    admin: {
      name: 'Admin Dashboard',
      port: 4001,
      url: process.env.ADMIN_URL || 'http://localhost:4001',
    },
    author: {
      name: 'Question Author',
      port: 4002,
      url: process.env.AUTHOR_URL || 'http://localhost:4002',
    },
    coordinator: {
      name: 'Exam Coordinator',
      port: 4003,
      url: process.env.COORDINATOR_URL || 'http://localhost:4003',
    },
    reviewer: {
      name: 'Session Reviewer',
      port: 4004,
      url: process.env.REVIEWER_URL || 'http://localhost:4004',
    },
  },

  // Session configuration
  session: {
    maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
    updateAge: 24 * 60 * 60, // 1 day in seconds
  },

  // File upload limits
  uploads: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],
    allowedVideoTypes: ['video/mp4', 'video/webm'],
  },

  // Exam configuration defaults
  exam: {
    defaultDuration: 60, // minutes
    defaultPassingScore: 70, // percentage
    defaultAllowedAttempts: 1,
  },

  // Pagination
  pagination: {
    defaultPageSize: 20,
    maxPageSize: 100,
  },
};

export type AppConfig = typeof APP_CONFIG;
