"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function getPatientAppointments() {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  try {
    const user = await db.user.findUnique({
      where: {
        clerkUserId: userId,
      },
      select: {
        id: true,
        role: true,
      },
    });

    if (!user) {
      // User not in database yet - return empty appointments
      console.log('User not found in DB, returning empty appointments');
      return { appointments: [] };
    }

    if (user.role !== "PATIENT") {
      console.log('User is not a patient, returning empty appointments');
      return { appointments: [] };
    }

    const appointments = await db.appointment.findMany({
      where: {
        patientId: user.id,
      },
      include: {
        doctor: {
          select: {
            id: true,
            name: true,
            specialty: true,
            imageUrl: true,
          },
        },
      },
      orderBy: {
        startTime: "asc",
      },
    });

    return { appointments };
  } catch (error) {
    console.error("Failed to Get Patient Appointments:", error);
    return { appointments: [], error: "Failed to Fetch Appointments" };
  }
}
