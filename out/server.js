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
const express_1 = __importDefault(require("express"));
const bodyParser = require("body-parser");
const cors = require("cors");
const ocrModule_1 = __importDefault(require("./ocrModule"));
const dotenv_1 = __importDefault(require("dotenv"));
const client_1 = require("@prisma/client");
const path = require("path");
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use(bodyParser.json());
app.use(cors());
const port = 3005;
const INPUT_DIR = process.env.INPUT_DIR || "./input";
const OUTPUT_DIR = process.env.OUTPUT_DIR || "./output";
const multer = require("multer");
const db = new client_1.PrismaClient();
app.get("/", (req, res) => {
    res.send("Express server is working!");
});
const storage = multer.diskStorage({
    destination: "./input",
    filename: (req, file, callback) => {
        const originalName = file.originalname;
        callback(null, originalName);
    },
});
const upload = multer({ storage: storage });
app.post("/process", upload.array("files"), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield upload.single("files");
    const files = req.files; // Files are available here
    const filenames = files.map((file) => file.originalname);
    console.log(filenames);
    const workerInput = {
        inputDir: INPUT_DIR,
        outputDir: OUTPUT_DIR,
        files: filenames,
    };
    try {
        let logs = yield (0, ocrModule_1.default)(workerInput);
        res.status(200).json({ logs });
    }
    catch (error) {
        res.status(500).json({ error: "An error occurred" });
    }
}));
app.get("/view", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const allRecords = yield db.data.findMany();
        console.log(allRecords);
        res.status(200).json(allRecords);
    }
    catch (error) {
        res.status(404).json(error);
    }
}));
const inputFolderPath = path.resolve(__dirname, '../input');
// Serve a specific file based on the request
app.get('/api/files/:fileName', (req, res) => {
    const fileName = req.params.fileName;
    const filePath = path.join(inputFolderPath, fileName);
    console.log(filePath);
    // Use res.sendFile to send the file
    res.sendFile(filePath, (err) => {
        if (err) {
            // Handle errors (e.g., file not found)
            res.status(404).send('File not found');
        }
    });
});
app.listen(port, () => {
    console.log(`[Server]: I am running at https://localhost:${port}`);
});
