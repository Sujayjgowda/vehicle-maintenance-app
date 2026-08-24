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
const part_validator_1 = require("../validators/part.validator");
const partController = __importStar(require("../controllers/part.controller"));
const router = (0, express_1.Router)({ mergeParams: true });
router.get("/", (0, errorHandler_1.asyncHandler)(partController.getAll));
router.get("/:id", (0, errorHandler_1.asyncHandler)(partController.getById));
router.post("/", (0, validate_1.validate)(part_validator_1.createPartRecordSchema), (0, errorHandler_1.asyncHandler)(partController.create));
router.put("/:id", (0, validate_1.validate)(part_validator_1.updatePartRecordSchema), (0, errorHandler_1.asyncHandler)(partController.update));
router.delete("/:id", (0, errorHandler_1.asyncHandler)(partController.remove));
exports.default = router;
//# sourceMappingURL=part.routes.js.map