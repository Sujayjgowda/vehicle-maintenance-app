import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";

/**
 * Factory that returns Express middleware to validate the request body
 * against the supplied Zod schema. On failure it responds with 400 and a
 * structured list of validation issues.
 */
export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const zodErr = err as any;
        res.status(400).json({
          error: "Validation failed",
          issues: err.issues.map((e: any) => ({
            path: e.path.join("."),
            message: e.message,
          })),
        });
        return;
      }
      next(err);
    }
  };
}
