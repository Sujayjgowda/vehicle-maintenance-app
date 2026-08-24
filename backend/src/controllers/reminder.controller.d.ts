import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
export declare function getAll(req: AuthRequest, res: Response): Promise<void>;
export declare function getById(req: AuthRequest, res: Response): Promise<void>;
export declare function create(req: AuthRequest, res: Response): Promise<void>;
export declare function update(req: AuthRequest, res: Response): Promise<void>;
export declare function remove(req: AuthRequest, res: Response): Promise<void>;
export declare function getUpcoming(req: AuthRequest, res: Response): Promise<void>;
//# sourceMappingURL=reminder.controller.d.ts.map