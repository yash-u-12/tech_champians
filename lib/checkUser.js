"use server";

import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";

function serializeUser(user) {
  if (!user) return null;

  return {
    ...user,
    sugar_fasting: user.sugar_fasting ? user.sugar_fasting.toNumber() : null,
    sugar_pp: user.sugar_pp ? user.sugar_pp.toNumber() : null,
  };
}

export const checkUser = async () => {
  try {
    const user = await currentUser();
    if (!user) return null;

    // Try to link Clerk user to DB record
    try {
      let loggedInUser = await db.user.findUnique({
        where: { clerkUserId: user.id },
        include: {
          transactions: { orderBy: { createdAt: "desc" } },
        },
      });

      if (!loggedInUser || Array.isArray(loggedInUser)) {
        const name = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();
        loggedInUser = await db.user.create({
          data: {
            clerkUserId: user.id,
            name,
            imageUrl: user.imageUrl,
            email: user.emailAddresses?.[0]?.emailAddress ?? "",
            role: "UNASSIGNED",
          },
        });
      }
      return serializeUser(loggedInUser);
    } catch (dbErr) {
      // Fallback: if Prisma client is not generated or DB unavailable, return a lightweight session-backed user
      console.warn("[Auth Fallback] Using session-only user (DB unavailable)");
      return {
        id: user.id,
        clerkUserId: user.id,
        email: user.emailAddresses?.[0]?.emailAddress ?? "",
        name: `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.username || "User",
        imageUrl: user.imageUrl,
        role: "UNASSIGNED",
        credits: 0,
        transactions: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }
  } catch (error) {
    console.error("Error in Authentication Flow:", error);
    return null;
  }
};
