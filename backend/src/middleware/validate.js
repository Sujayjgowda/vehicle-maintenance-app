"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = validate;
const express_1 = require("express");
const zod_1 = require("zod");
/**
 * Factory that returns Express middleware to validate the request body
 * against the supplied Zod schema. On failure it responds with 400 and a
 * structured list of validation issues.
 */
function validate(schema) {
    return (req, res, next) => {
        try {
            req.body = schema.parse(req.body);
            next();
        }
        catch (err) {
            if (err instanceof zod_1.ZodError) {
                res.status(400).json({
                    error: "Validation failed",
                    issues: err.errors.map((e) => ({
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
//# sourceMappingURL=validate.js.map