"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = register;
exports.login = login;
exports.getProfile = getProfile;
const prisma_1 = __importDefault(require("../lib/prisma"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const auth_1 = require("../middleware/auth");
async function register(data) {
    const existing = await prisma_1.default.user.findUnique({ where: { email: data.email } });
    if (existing) {
        const err = new Error("Email already registered");
        err.statusCode = 409;
        throw err;
    }
    const passwordHash = await bcryptjs_1.default.hash(data.password, 12);
    const user = await prisma_1.default.user.create({
        data: {
            name: data.name,
            email: data.email,
            passwordHash,
            role: data.role || "OWNER",
        },
        select: { id: true, name: true, email: true, role: true, createdAt: true },
    });
    const token = (0, auth_1.generateToken)({ userId: user.id, email: user.email, role: user.role });
    return { user, token };
}
async function login(data) {
    const user = await prisma_1.default.user.findUnique({ where: { email: data.email } });
    if (!user) {
        const err = new Error("Invalid email or password");
        err.statusCode = 401;
        throw err;
    }
    const valid = await bcryptjs_1.default.compare(data.password, user.passwordHash);
    if (!valid) {
        const err = new Error("Invalid email or password");
        err.statusCode = 401;
        throw err;
    }
    const token = (0, auth_1.generateToken)({ userId: user.id, email: user.email, role: user.role });
    return {
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
        token,
    };
}
async function getProfile(userId) {
    const user = await prisma_1.default.user.findUnique({
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
        const err = new Error("User not found");
        err.statusCode = 404;
        throw err;
    }
    return user;
}
//# sourceMappingURL=auth.service.js.map