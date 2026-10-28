// Prisma singleton (one connection pool per process)
const { PrismaClient } = require('@prisma/client');

const prisma = global.__pgPrisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') global.__pgPrisma = prisma;

module.exports = prisma;
