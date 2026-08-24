"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
exports.asyncHandler = asyncHandler;
const express_1 = require("express");
function errorHandler(err, _req, res, _next) {
    console.error("Unhandled error:", err);
    const statusCode = err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(statusCode).json({
        error: true,
        message,
        ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
    });
}
/**
 * Wraps an async route handler so that rejected promises are forwarded to
 * the Express error handler instead of crashing the process.
 */
function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}
//# sourceMappingURL=errorHandler.js.map