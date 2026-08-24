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
const documentService = __importStar(require("../services/document.service"));
async function getAll(req, res) {
    const docs = await documentService.getAllDocuments(req.params.vehicleId);
    res.json(docs);
}
async function getById(req, res) {
    const doc = await documentService.getDocumentById(req.params.id, req.params.vehicleId);
    res.json(doc);
}
async function create(req, res) {
    const doc = await documentService.createDocument(req.params.vehicleId, req.body);
    res.status(201).json(doc);
}
async function update(req, res) {
    const doc = await documentService.updateDocument(req.params.id, req.params.vehicleId, req.body);
    res.json(doc);
}
async function remove(req, res) {
    await documentService.deleteDocument(req.params.id, req.params.vehicleId);
    res.status(204).send();
}
//# sourceMappingURL=document.controller.js.map