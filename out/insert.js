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
const client_1 = require("@prisma/client");
const fs_1 = __importDefault(require("fs"));
const crypto_1 = __importDefault(require("crypto"));
const db = new client_1.PrismaClient();
const inputDir = "./input";
function insert(file, matchedList, filePath, logs) {
    return __awaiter(this, void 0, void 0, function* () {
        const fileContents = fs_1.default.readFileSync(filePath);
        const fileHash = crypto_1.default
            .createHash("sha256")
            .update(fileContents)
            .digest("hex");
        const { birthtime, mtime } = fs_1.default.statSync(filePath);
        const createdDate = new Date(birthtime);
        const modifiedDate = new Date(mtime);
        const fileExists = yield db.data.findFirst({
            where: { fileHash },
        });
        if (fileExists) {
            logs.push(`${file} has already been scanned`);
            return;
        }
        /*
        for (const extractedData of matchedList) {
          await db.data.upsert({
            where: { fileHash,extractedData },
            update: { extractedData, createdDate, modifiedDate },
            create: {
              fileHash,
              fileName: file,
              filePath: inputDir,
              extractedData,
              createdDate,
              modifiedDate,
            },
          });
          logs.push(`Inserted data from ${file}: ${matchedList}`);
        }
        return;
      */
        console.log(matchedList);
        for (const extractedData of matchedList) {
            console.log(extractedData);
            console.log("done");
            const found = yield db.data.findFirst({
                where: { extractedData, fileHash },
            });
            if (found) {
                continue;
            }
            yield db.data.create({
                data: {
                    fileHash,
                    fileName: file,
                    filePath: inputDir,
                    extractedData,
                    createdDate,
                    modifiedDate,
                },
            });
            logs.push(`Inserted data from ${file}: ${matchedList}`);
        }
        return;
    });
}
exports.default = insert;
