import express, { Express, Request, Response } from "express";
const bodyParser = require("body-parser");
const cors = require("cors");
import processImages from "./ocrModule";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import path = require("path");

dotenv.config();

const app: Express = express();
app.use(express.json());
app.use(bodyParser.json());

app.use(cors());
const port = 3005;
const INPUT_DIR = process.env.INPUT_DIR || "./input";
const OUTPUT_DIR = process.env.OUTPUT_DIR || "./output";
const multer = require("multer");

interface WorkerInput {
  inputDir: string;
  outputDir: string;
  files: string[];
}
const db = new PrismaClient();

app.get("/", (req: Request, res: Response) => {
  res.send("Express server is working!");
});

const storage = multer.diskStorage({
  destination: "./input",
  filename: (
    req: Express.Request,
    file: Express.Multer.File,
    callback: (error: Error | null, filename: string) => void
  ) => {
    const originalName = file.originalname;
    callback(null, originalName);
  },
});

const upload = multer({ storage: storage });

app.post(
  "/process",
  upload.array("files"),
  async (req, res) => {
    await upload.single("files");

    const files = req.files as Express.Multer.File[]; // Files are available here

    const filenames = files.map((file: any) => file.originalname);
    console.log(filenames);

    const workerInput: WorkerInput = {
      inputDir: INPUT_DIR,
      outputDir: OUTPUT_DIR,
      files: filenames,
    };

    try {
      let logs = await processImages(workerInput);
      res.status(200).json({ logs });
    } catch (error) {
      res.status(500).json({ error: "An error occurred" });
    }
  }
);




app.get("/view", async (req: Request, res: Response) => {
  try {
    const allRecords = await db.data.findMany();
    console.log(allRecords);
    res.status(200).json(allRecords);
  } catch (error) {
    res.status(404).json(error);
  }
});

const inputFolderPath = path.resolve(__dirname, '../input');

app.get('/api/files/:fileName', (req, res) => {
  const fileName = req.params.fileName;
  const filePath = path.join(inputFolderPath, fileName);
  console.log(filePath)

  res.sendFile(filePath, (err) => {
    if (err) {
      res.status(404).send('File not found');
    }
  });
});
app.listen(port, () => {
  console.log(`[Server]: I am running at https://localhost:${port}`);
});
