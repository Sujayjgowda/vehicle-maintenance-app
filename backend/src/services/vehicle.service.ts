import prisma from "../lib/prisma";
import type { CreateVehicleInput, UpdateVehicleInput } from "../validators/vehicle.validator";

export async function getAllVehicles(userId: string) {
  return prisma.vehicle.findMany({
    where: { userId },
    include: {
      _count: {
        select: {
          fuelRecords: true,
          serviceRecords: true,
          reminders: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getVehicleById(id: string, userId: string) {
  const vehicle = await prisma.vehicle.findFirst({
    where: { id, userId },
    include: {
      reminders: {
        where: { status: "PENDING" },
        orderBy: { dueDate: "asc" },
        take: 5,
      },
      _count: {
        select: {
          fuelRecords: true,
          serviceRecords: true,
          expenses: true,
        },
      },
    },
  });

  if (!vehicle) {
    const err = new Error("Vehicle not found") as any;
    err.statusCode = 404;
    throw err;
  }

  return vehicle;
}

export async function createVehicle(userId: string, data: CreateVehicleInput) {
  return prisma.vehicle.create({
    data: {
      ...data,
      userId,
    },
  });
}

export async function updateVehicle(id: string, userId: string, data: UpdateVehicleInput) {
  // Verify ownership
  const vehicle = await prisma.vehicle.findFirst({ where: { id, userId } });
  if (!vehicle) {
    const err = new Error("Vehicle not found") as any;
    err.statusCode = 404;
    throw err;
  }

  return prisma.vehicle.update({
    where: { id },
    data,
  });
}

export async function deleteVehicle(id: string, userId: string) {
  const vehicle = await prisma.vehicle.findFirst({ where: { id, userId } });
  if (!vehicle) {
    const err = new Error("Vehicle not found") as any;
    err.statusCode = 404;
    throw err;
  }

  return prisma.vehicle.delete({ where: { id } });
}
