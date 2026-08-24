import prisma from "../lib/prisma";
import type { CreateServiceCenterInput, UpdateServiceCenterInput } from "../validators/serviceCenter.validator";

export async function getAllServiceCenters(userId: string) {
  return prisma.serviceCenter.findMany({
    where: { userId },
    orderBy: [{ isFavorite: "desc" }, { name: "asc" }],
  });
}

export async function getServiceCenterById(id: string, userId: string) {
  const center = await prisma.serviceCenter.findFirst({ where: { id, userId } });
  if (!center) {
    const err = new Error("Service center not found") as any;
    err.statusCode = 404;
    throw err;
  }
  return center;
}

export async function createServiceCenter(userId: string, data: CreateServiceCenterInput) {
  return prisma.serviceCenter.create({
    data: {
      userId,
      name: data.name,
      address: data.address,
      latitude: data.latitude,
      longitude: data.longitude,
      phone: data.phone,
      isFavorite: data.isFavorite ?? false,
    },
  });
}

export async function updateServiceCenter(id: string, userId: string, data: UpdateServiceCenterInput) {
  const existing = await prisma.serviceCenter.findFirst({ where: { id, userId } });
  if (!existing) {
    const err = new Error("Service center not found") as any;
    err.statusCode = 404;
    throw err;
  }

  return prisma.serviceCenter.update({
    where: { id },
    data,
  });
}

export async function deleteServiceCenter(id: string, userId: string) {
  const existing = await prisma.serviceCenter.findFirst({ where: { id, userId } });
  if (!existing) {
    const err = new Error("Service center not found") as any;
    err.statusCode = 404;
    throw err;
  }
  return prisma.serviceCenter.delete({ where: { id } });
}
