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
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const tesseract_js_1 = require("tesseract.js");
const insert_1 = __importDefault(require("./insert"));
const getText_1 = __importDefault(require("./getText"));
dotenv_1.default.config();
const processImages = (workerInput) => __awaiter(void 0, void 0, void 0, function* () {
    let logs = [];
    let processedCount = 0;
    const worker = yield (0, tesseract_js_1.createWorker)({
        langPath: path_1.default.join(__dirname, "..", "tesseract-data"),
    });
    for (const file of workerInput.files) {
        const filePath = path_1.default.join(workerInput.inputDir, file);
        try {
            const matchedList = yield (0, getText_1.default)(worker, file, logs);
            if (!matchedList || matchedList.length === 0) {
                logs.push(`${file} does not contain valid data`);
                throw new Error();
            }
            yield (0, insert_1.default)(file, matchedList, filePath, logs);
        }
        catch (err) {
            logs.push(`Error processing file ${file}: ${err}`);
        }
        processedCount++;
        logs.push(`Processed ${processedCount} files of Total ${workerInput.files.length}`);
    }
    logs.push(` Processed ${workerInput.files.length} files`);
    yield worker.terminate();
    return logs;
});
exports.default = processImages;
