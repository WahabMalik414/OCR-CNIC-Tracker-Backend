import { PrismaClient } from "@prisma/client";
import express, { Express, Request, Response } from "express";
import crypto from "crypto";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import Tesseract, { createWorker } from "tesseract.js";
import { log } from "console";
import insert from "./insert";
import getText from "./getText";
interface WorkerInput {
  inputDir: string;
  outputDir: string;
  files: string[];
}

dotenv.config();

const processImages = async (workerInput: WorkerInput) => {
  let logs: any = [];

  let processedCount = 0;
  const worker = await createWorker({
    langPath: path.join(__dirname, "..", "tesseract-data"),
  });

  for (const file of workerInput.files) {
    const filePath = path.join(workerInput.inputDir, file);
    try {
      const matchedList = await getText(worker, file, logs);
      if (!matchedList || matchedList.length === 0) {
        logs.push(`${file} does not contain valid data`);
        throw new Error();
      }
      await insert(file, matchedList, filePath, logs);
    } catch (err) {
      logs.push(`Error processing file ${file}: ${err}`);
    }
    processedCount++;

    logs.push(
      `Processed ${processedCount} files of Total ${workerInput.files.length}`
    );
  }

  logs.push(` Processed ${workerInput.files.length} files`);

  await worker.terminate();
  return logs;
};

export default processImages;
