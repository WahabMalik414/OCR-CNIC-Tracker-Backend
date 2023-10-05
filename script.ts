import { PrismaClient } from "@prisma/client";
import crypto from "crypto";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import Tesseract, { createWorker } from "tesseract.js";

interface WorkerInput {
  inputDir: string;
  outputDir: string;
  files: string[];
}

dotenv.config();

const db = new PrismaClient();
const INPUT_DIR = process.env.INPUT_DIR || "./input";
const OUTPUT_DIR = process.env.OUTPUT_DIR || "./output";

const workerInput: WorkerInput = {
  inputDir: INPUT_DIR,
  outputDir: OUTPUT_DIR,
  files: fs
    .readdirSync(INPUT_DIR)
    .filter((file) => [".jpg", ".jpeg", ".png"].includes(path.extname(file))),
};

const processFile = async (file: string, worker:Tesseract.Worker) => {
  const filePath = path.join(workerInput.inputDir, file);

  try {
    const fileContents = fs.readFileSync(filePath);
    const fileHash = crypto.createHash("sha256").update(fileContents).digest("hex");

    const fileExists = await db.data.findUnique({
      where: { fileHash },
    });

    if (fileExists) {
      console.log(`${file} has already been scanned`);
      return;
    }

    const {
      data: { text },
    } = await worker.recognize(filePath);

    const matchedList = text.match(/\d{5}-?\d{7}-?\d{1}/g)?.map((data) => data.replace(/[- ]/g, ""));

    if (!matchedList || matchedList.length === 0) {
      console.log(`${file} does not contain valid data`);
      return;
    }

    const { birthtime, mtime } = fs.statSync(filePath);
    const createdDate = new Date(birthtime);
    const modifiedDate = new Date(mtime);

    for (const extractedData of matchedList) {
      await db.data.upsert({
        where: { fileHash },
        update: { extractedData, createdDate, modifiedDate },
        create: {
          fileHash,
          fileName: file,
          filePath: workerInput.inputDir,
          extractedData,
          createdDate,
          modifiedDate,
        },
      });

      console.log(`Inserted data from ${file}: ${matchedList}`);
    }
  } catch (err) {
    console.error(`Error processing file ${file}: ${err}`);
  }
};

createWorker({
    langPath: path.join(__dirname, "..", "tesseract-data"),
  }).then(async (worker) => {
    await worker.loadLanguage("eng");
    await worker.initialize("eng");

    let processedCount = 0;

    for (const file of workerInput.files) {
      await processFile(file, worker);
      processedCount++;

      console.log(
        `Processed ${processedCount} files of Total ${workerInput.files.length}`
      );
    }

    console.log(
      ` Processed ${workerInput.files.length} files`
    );

    await worker.terminate();
    await db.$disconnect();
  });
