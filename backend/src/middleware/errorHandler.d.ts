import { Request, Response, NextFunction } from "express";
export declare function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void;
/**
 * Wraps an async route handler so that rejected promises are forwarded to
 * the Express error handler instead of crashing the process.
 */
export declare function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<any>): (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=errorHandler.d.ts.map