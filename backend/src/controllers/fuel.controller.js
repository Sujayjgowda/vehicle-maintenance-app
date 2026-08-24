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
exports.getSummary = getSummary;
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const fuelService = __importStar(require("../services/fuel.service"));
async function getAll(req, res) {
    const records = await fuelService.getAllFuelRecords(req.params.vehicleId);
    res.json(records);
}
async function getById(req, res) {
    const record = await fuelService.getFuelRecordById(req.params.id, req.params.vehicleId);
    res.json(record);
}
async function create(req, res) {
    const record = await fuelService.createFuelRecord(req.params.vehicleId, req.body);
    res.status(201).json(record);
}
async function update(req, res) {
    const record = await fuelService.updateFuelRecord(req.params.id, req.params.vehicleId, req.body);
    res.json(record);
}
async function remove(req, res) {
    await fuelService.deleteFuelRecord(req.params.id, req.params.vehicleId);
    res.status(204).send();
}
async function getSummary(req, res) {
    const summary = await fuelService.getFuelSummary(req.params.vehicleId);
    res.json(summary);
}
//# sourceMappingURL=fuel.controller.js.map