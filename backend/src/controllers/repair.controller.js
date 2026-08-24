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
exports.getAll = getAll;
exports.getById = getById;
exports.create = create;
exports.update = update;
exports.remove = remove;
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const repairService = __importStar(require("../services/repair.service"));
async function getAll(req, res) {
    const logs = await repairService.getAllRepairLogs(req.params.vehicleId);
    res.json(logs);
}
async function getById(req, res) {
    const log = await repairService.getRepairLogById(req.params.id, req.params.vehicleId);
    res.json(log);
}
async function create(req, res) {
    const log = await repairService.createRepairLog(req.params.vehicleId, req.body);
    res.status(201).json(log);
}
async function update(req, res) {
    const log = await repairService.updateRepairLog(req.params.id, req.params.vehicleId, req.body);
    res.json(log);
}
async function remove(req, res) {
    await repairService.deleteRepairLog(req.params.id, req.params.vehicleId);
    res.status(204).send();
}
//# sourceMappingURL=repair.controller.js.map