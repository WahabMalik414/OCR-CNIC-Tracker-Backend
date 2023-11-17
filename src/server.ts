import express, { Express, Request, Response } from "express";
const bodyParser = require("body-parser");
const cors = require("cors");
import processImages from "./ocrModule";
import expressAsyncHandler from "express-async-handler";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

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
  res.send("Hello, this is Express + TypeScript");
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

//const upload = multer({ storage: storage });
const multi_upload = multer({
  storage,
  //limits: { fileSize: 1 * 1024 * 1024 }, // 1MB
  fileFilter: (req: Request, file: any, cb: Function) => {
    if (
      file.mimetype == "image/png" ||
      file.mimetype == "image/jpg" ||
      file.mimetype == "image/jpeg"
    ) {
      cb(null, true);
    } else {
      cb(null, false);
      const err = new Error("Only .png, .jpg and .jpeg format allowed!");
      err.name = "ExtensionError";
      return cb(err);
    }
  },
}).array("files");

// app.post(
//   "/process",
//   //upload.array("files"),
//   expressAsyncHandler(async (req, res) => {
//     //await upload.single("files")(req, res);

//     const files = req.files as Express.Multer.File[]; // Files are available here

//     const filenames = files.map((file: any) => file.originalname);
//     console.log(filenames);

//     const workerInput: WorkerInput = {
//       inputDir: INPUT_DIR,
//       outputDir: OUTPUT_DIR,
//       files: filenames,
//     };

//     try {
//       let logs = await processImages(workerInput);
//       res.status(200).json({ logs });
//     } catch (error) {
//       res.status(500).json({ error: "An error occurred" });
//     }
//   })
// );

app.post(
  "/process",
  expressAsyncHandler(async (req, res) => {
    const uploadPromise = new Promise((resolve, reject) => {
      multi_upload(req, res, function (err: any) {
        if (err instanceof multer.MulterError) {
          reject({ message: `Multer uploading error: ${err.message}` });
        } else if (err) {
          if (err.name == "ExtensionError") {
            reject({ message: err.message });
          } else {
            reject({ message: `Unknown uploading error: ${err.message}` });
          }
        } else {
          resolve("Your files uploaded.");
        }
      });
    });

    try {
      const result = await uploadPromise;
      console.log(result);
      const files = req.files as Express.Multer.File[];
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
    } catch (error) {
      res.status(500).send({ error });
    }
  })
);

app.get("/view", async (req: Request, res: Response) => {
  console.log("request arrived!");
  try {
    const allRecords = await db.data.findMany();
    console.log(allRecords);
    res.status(200).json(allRecords);
  } catch (error) {
    res.status(404).json(error);
  }
});

app.listen(port, () => {
  console.log(`[Server]: I am running at https://localhost:${port}`);
});
