import { join } from "path";
import { exec, ExecException } from "child_process";

import winston = require("winston");
import { Request, Response, NextFunction, Application } from "express";
import { getLogger } from "./logger";

const repository: string = "https://github.com/arendst/Tasmota.git";
const directory: string = join(__dirname, "../content/source");
const content: string = join(__dirname, "../content");

const express = require("express");
const app: Application = express();

const logger: winston.Logger = getLogger("[TASMOTA]");

app.use("/tasmota/release", express.static(content));

function run_command(command: string): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    exec(command, (err: ExecException, stdout: string, stderr: string) => {
      if(err !== null) {
        return reject(err);
      }
      if(typeof stderr !== "string") {
        return reject(stderr);
      }
      resolve(stdout);
    });
  });
}

app.get("/source/download", async (req: Request, res: Response, next: NextFunction) => {
  logger.info("Download Tasmota source code");
  const command: string = `git clone ${repository} ${directory}`;
  logger.info("Running command " + `${command}`);
  try {
    const result: string = await run_command(command);
    res.status(200).send(result || "Done!");
    logger.info("Download completed");
  } catch (reason) {
    res.status(400).send(reason);
    logger.error("Download fails");
  }
});

app.get("/source/update", async (req: Request, res: Response, next: NextFunction) => {
  logger.info("Update Tasmota source code");
  const command: string = `cd ${directory} && git pull`;
  try {
    const result: string = await run_command(command);
    res.status(200).send(result || "Done!");
    logger.info("Update completed");
  } catch (reason) {
    res.status(400).send(reason);
    logger.error("Update fails");
  }
});

app.get("/source/build/:env", async (req: Request, res: Response, next: NextFunction) => {
  const env: string = req.params.env;
  logger.info(`Compile Tasmota source code with environment ${env}`);
  const command: string = `pio run -d ${directory} --environment ${env} -v`;
  try {
    let result: string = await run_command(command);
    logger.info("Moving binary file");
    result += "\r\n";
    const mv_cmnd: string = `cp ${join(directory, ".pioenvs", env, "firmware.bin")} ${join(content, env + ".bin")}`;
    result += await run_command(mv_cmnd);
    res.status(200).send(result);
    logger.info("Build completed");
  } catch (reason) {
    res.status(400).send(reason);
    logger.error("Build fails");
  }
});

async function terminate(): Promise<void> {
try {
  logger.info("Turn off...");
  process.exit(0);
} catch(err) {
    process.exit(1);
  }
}
  
if(process.platform == "win32") {
  const input = process.stdin;
  const output = process.stdout;
  const rl = require("readline");
  rl.createInterface({ input, output })
    .on("SIGINT", terminate);
}
process.on("SIGINT", terminate);

app.listen(8266, () => {
  logger.info("Tasmota OTA Server is running on port 8266");
});