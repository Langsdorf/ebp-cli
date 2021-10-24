#! /usr/bin/env node
import { program } from "commander";
import pkg from "../package.json";
import inquirer from "inquirer";
import { execSync } from "child_process";
import * as path from "path";
import * as fs from "fs";
import chalk from "chalk";

const bars = ["\\", "|", "/", "-"];
program.version(pkg.version);

const logStep = (step: string) => {
  console.clear();
  console.log(chalk.green(`${step}`));
};

program
  .command("new")
  .argument("<name>", "name of the project")
  .description("Creates a new project")
  .action(async (name) => {
    const choices = await inquirer.prompt([
      {
        type: "list",
        choices: ["MongoDB", "MySQL", { name: "None", value: undefined }],
        default: "None",
        message: "Select database type",
        name: "database",
      },
    ]);

    const { database } = choices;

    const currentPath = process.cwd();
    const projectPath = path.join(currentPath, name);

    console.log(chalk.green(`Creating project "${name}" in ${projectPath}`));

    try {
      logStep("Creating folder...");
      fs.mkdirSync(projectPath);
      logStep(`Folder ${projectPath} created.`);

      logStep(`Copying files...`);
      execSync(
        `git clone --depth 1 https://github.com/Langsdorf/express-boilerplate/ ${projectPath}`
      );
      process.chdir(projectPath);

      logStep("Installing dependencies...");
      execSync("npm install");

      logStep("Configuring files...");

      execSync("npx rimraf ./.git");

      if (database) {
        if (database === "MongoDB") {
          execSync("npm uninstall mysql");
          fs.unlinkSync("./ormconfig.json");
          fs.renameSync("./ormconfig.mongodb.json", "./ormconfig.json");
        } else {
          execSync("npx rimraf ./ormconfig.mongodb.json");
          execSync("npm uninstall mongodb");
        }
      } else {
        execSync("npm uninstall mongodb");
        execSync("npm uninstall mysql");
        execSync("npm uninstall typeorm");
        execSync("npx rimraf ./src/modules/user");
        fs.unlinkSync("./ormconfig.json");
        fs.unlinkSync("./ormconfig.mongodb.json");
      }

      fs.renameSync("./.env.example", "./.env");

      logStep("Creating git repository");
      execSync("git init");

      logStep(`Project "${name}" created.`);
    } catch (err: any) {
      if (err.code === "EEXIST") {
        console.log(chalk.red(`Project "${name}" already exists`));
      } else {
        console.log(err);
      }

      process.exit(1);
    }
  });

program.parse(process.argv);
