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
exports.getUserSummary = getUserSummary;
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const expenseService = __importStar(require("../services/expense.service"));
async function getAll(req, res) {
    const expenses = await expenseService.getAllExpenses(req.params.vehicleId);
    res.json(expenses);
}
async function getById(req, res) {
    const expense = await expenseService.getExpenseById(req.params.id, req.params.vehicleId);
    res.json(expense);
}
async function create(req, res) {
    const expense = await expenseService.createExpense(req.params.vehicleId, req.body);
    res.status(201).json(expense);
}
async function update(req, res) {
    const expense = await expenseService.updateExpense(req.params.id, req.params.vehicleId, req.body);
    res.json(expense);
}
async function remove(req, res) {
    await expenseService.deleteExpense(req.params.id, req.params.vehicleId);
    res.status(204).send();
}
async function getSummary(req, res) {
    const summary = await expenseService.getExpenseSummary(req.params.vehicleId);
    res.json(summary);
}
async function getUserSummary(req, res) {
    const summary = await expenseService.getUserExpenseSummary(req.user.userId);
    res.json(summary);
}
//# sourceMappingURL=expense.controller.js.map