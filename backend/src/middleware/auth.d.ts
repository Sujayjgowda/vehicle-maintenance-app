import { Request, Response, NextFunction } from "express";
export interface AuthRequest extends Request {
    user?: {
        userId: string;
        email: string;
        role: string;
    };
}
export declare function authenticate(req: AuthRequest, res: Response, next: NextFunction): void;
export declare function generateToken(payload: {
    userId: string;
    email: string;
    role: string;
}): string;
//# sourceMappingURL=auth.d.ts.map