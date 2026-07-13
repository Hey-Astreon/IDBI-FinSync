import { beforeAll, afterAll } from 'vitest';
import { prisma } from '../src/config/prisma';

beforeAll(async () => {
  // Ensure database connection is initialized if reachable
  try {
    await prisma.$connect();
  } catch {
    console.warn(
      'Database is not running. Integration tests requiring DB will be skipped or mock-tested.',
    );
  }
});

afterAll(async () => {
  try {
    await prisma.$disconnect();
  } catch {
    // Ignore
  }
});
