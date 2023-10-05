import Tesseract, { createWorker } from "tesseract.js";
import path from "path";

const inputDir = "./input";
export default async function getText(
  worker: Tesseract.Worker,
  file: string,
  logs: string[]
) {
  await worker.loadLanguage("eng");
  await worker.initialize("eng");

  let processedCount = 0;

  const filePath = path.join(inputDir, file);

  const {
    data: { text },
  } = await worker.recognize(filePath);

  const matchedList = text
    .match(/\b(?:\d{5}-?\d{7}-?\d{1}|\d{13})\b/g)
    ?.map((data) => data.replace(/[- ]/g, ""));

  return matchedList;
}
