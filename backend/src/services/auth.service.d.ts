import type { RegisterInput, LoginInput } from "../validators/auth.validator";
export declare function register(data: RegisterInput): Promise<{
    user: {
        createdAt: Date;
        email: string;
        id: string;
        name: string;
        role: import(".prisma/client").$Enums.Role;
    };
    token: string;
}>;
export declare function login(data: LoginInput): Promise<{
    user: {
        id: string;
        name: string;
        email: string;
        role: import(".prisma/client").$Enums.Role;
    };
    token: string;
}>;
export declare function getProfile(userId: string): Promise<{
    _count: {
        vehicles: number;
    };
    createdAt: Date;
    email: string;
    id: string;
    name: string;
    role: import(".prisma/client").$Enums.Role;
}>;
//# sourceMappingURL=auth.service.d.ts.map