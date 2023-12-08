"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const inputDir = "./input";
function getText(worker, file, logs) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        yield worker.loadLanguage("eng");
        yield worker.initialize("eng");
        let processedCount = 0;
        const filePath = path_1.default.join(inputDir, file);
        const { data: { text }, } = yield worker.recognize(filePath);
        const matchedList = (_a = text
            .match(/\b(?:\d{5}-?\d{7}-?\d{1}|\d{13})\b/g)) === null || _a === void 0 ? void 0 : _a.map((data) => data.replace(/[- ]/g, ""));
        return matchedList;
    });
}
exports.default = getText;
