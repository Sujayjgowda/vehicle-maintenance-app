import prisma from "../lib/prisma";
import bcrypt from "bcryptjs";
import { generateToken } from "../middleware/auth";
import type { RegisterInput, LoginInput } from "../validators/auth.validator";

export async function register(data: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    const err = new Error("Email already registered") as any;
    err.statusCode = 409;
    throw err;
  }

  const passwordHash = await bcrypt.hash(data.password, 12);

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      passwordHash,
      role: data.role as any || "OWNER",
    },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  const token = generateToken({ userId: user.id, email: user.email, role: user.role });

  return { user, token };
}

export async function login(data: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: data.email } });
  if (!user) {
    const err = new Error("Invalid email or password") as any;
    err.statusCode = 401;
    throw err;
  }

  const valid = await bcrypt.compare(data.password, user.passwordHash);
  if (!valid) {
    const err = new Error("Invalid email or password") as any;
    err.statusCode = 401;
    throw err;
  }

  const token = generateToken({ userId: user.id, email: user.email, role: user.role });

  return {
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    token,
  };
}

export async function getProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      _count: { select: { vehicles: true } },
    },
  });

  if (!user) {
    const err = new Error("User not found") as any;
    err.statusCode = 404;
    throw err;
  }

  return user;
}
