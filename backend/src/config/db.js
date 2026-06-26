import '../config/env.js';
import { PrismaClient } from '@prisma/client';

let prismaInstance = null;

function getPrismaInstance() {
  if (!prismaInstance) {
    prismaInstance = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
    });
  }
  return prismaInstance;
}

// Use a Proxy to lazily initialize PrismaClient only when database operations are invoked
const prisma = new Proxy({}, {
  get(target, prop) {
    const instance = getPrismaInstance();
    const value = Reflect.get(instance, prop);
    if (typeof value === 'function') {
      return value.bind(instance);
    }
    return value;
  },
});

export default prisma;
