"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const errorHandler_1 = require("../middleware/errorHandler");
const validate_1 = require("../middleware/validate");
const expense_validator_1 = require("../validators/expense.validator");
const expenseController = __importStar(require("../controllers/expense.controller"));
const router = (0, express_1.Router)({ mergeParams: true });
router.get("/", (0, errorHandler_1.asyncHandler)(expenseController.getAll));
router.get("/summary", (0, errorHandler_1.asyncHandler)(expenseController.getSummary));
router.get("/:id", (0, errorHandler_1.asyncHandler)(expenseController.getById));
router.post("/", (0, validate_1.validate)(expense_validator_1.createExpenseSchema), (0, errorHandler_1.asyncHandler)(expenseController.create));
router.put("/:id", (0, validate_1.validate)(expense_validator_1.updateExpenseSchema), (0, errorHandler_1.asyncHandler)(expenseController.update));
router.delete("/:id", (0, errorHandler_1.asyncHandler)(expenseController.remove));
exports.default = router;
//# sourceMappingURL=expense.routes.js.map