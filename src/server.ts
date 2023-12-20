import express, { Express, Request, Response } from "express";
import bodyParser from "body-parser";
import cors from "cors";
import processImages from "./ocrModule";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import path from "path";
import bcrypt from "bcrypt";
import fs from "fs";
import createSecretToken from "./secretToken";
dotenv.config();
import cookieParser from "cookie-parser";
const app: Express = express();
app.use(express.json());
app.use(bodyParser.json());
app.use(cookieParser());
app.use(
  cors({
    origin: ["http://localhost:5173"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);
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
const hashedPassword = bcrypt.hashSync("admin@hrd", 12);

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

app.post("/login", async (req, res, next) => {
  try {
    const { user, password } = req.body;

    if (!user || !password) {
      return res.status(404).json({ message: "All fields are required" });
    }

    if (user !== "Admin") {
      console.log("Wrong")
      return res.status(404).json({ message: "Incorrect user name" });
    }
    const auth = await bcrypt.compare(password, hashedPassword);
    if (!auth) {
      return res.status(404).json({ message: "Incorrect password" });
    }

    const token = createSecretToken(user);

    res.cookie("token", token, {
      httpOnly: true,
    });
    res
      .status(201)
      .json({ message: "Successfully signed in!", sucess: "true", user });
  } catch (error) {
    console.log(error);
  }
});

app.post("/process", upload.array("files"), async (req, res) => {
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
    res.status(200).send("Success");
  } catch (error) {
    res.status(500).json({ error: "An error occurred" });
  }
});

app.get("/view", async (req: Request, res: Response) => {
  try {
    const allRecords = await db.data.findMany();
    console.log(allRecords);
    res.status(200).json(allRecords);
  } catch (error) {
    res.status(404).json(error);
  }
});

const inputFolderPath = path.resolve(__dirname, "../input");

app.get("/api/files/:fileName", (req, res) => {
  const fileName = req.params.fileName;
  const filePath = path.join(inputFolderPath, fileName);
  console.log(filePath);

  res.sendFile(filePath, (err) => {
    if (err) {
      res.status(404).send("File not found");
    }
  });
});
app.get("/api/delete/:fileHash", async (req, res) => {
  const fileHash = req.params.fileHash;
  try {
    await db.data.deleteMany({
      where: {
        fileHash: fileHash,
      },
    });

    res.status(200).send("Records deleted successfully!");
  } catch (dbError) {
    console.error("Error deleting records from the database:", dbError);
    res.status(500).send("Internal Server Error");
  }
});

app.listen(port, () => {
  console.log(`[Server]: I am running at https://localhost:${port}`);
});
