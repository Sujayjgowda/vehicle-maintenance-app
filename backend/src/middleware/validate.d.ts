import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";
/**
 * Factory that returns Express middleware to validate the request body
 * against the supplied Zod schema. On failure it responds with 400 and a
 * structured list of validation issues.
 */
export declare function validate(schema: ZodSchema): (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=validate.d.ts.map