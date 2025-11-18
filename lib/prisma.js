import { PrismaClient } from "@prisma/client";

let prisma = globalThis.prisma || null;

function makeFallbackStub() {
  const handler = {
    get(_, prop) {
      const delegate = new Proxy(
        {},
        {
          get() {
            return async () => {
              if (prop === "count") return 0;
              return [];
            };
          },
        }
      );
      if (["$connect", "$disconnect"].includes(prop)) {
        return async () => {};
      }
      return delegate;
    },
  };
  console.warn(
    "[Prisma Fallback] Using in-memory stub – database features limited."
  );
  return new Proxy({}, handler);
}

function getClient() {
  if (prisma) return prisma;
  try {
    prisma = new PrismaClient();
    if (process.env.NODE_ENV !== "production") globalThis.prisma = prisma;
  } catch (e) {
    prisma = makeFallbackStub();
  }
  return prisma;
}

export const db = new Proxy(
  {},
  {
    get(_, prop) {
      const client = getClient();
      return client[prop];
    },
  }
);
