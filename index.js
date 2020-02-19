#!/usr/bin/env node

console.log("Welcome to Migao-cli!");

const program = require("commander");
const download = require("download-git-repo");
const inquirer = require("inquirer");
const handlebars = require("handlebars");
const fs = require("fs");
const ora = require("ora");
const chalk = require("chalk");
const logSymbols = require("log-symbols");

const gitRepo = {
  url: "https://github.com/walkingp/migao-cms",
  downUrl: "http://github.com:walkingp/migao-cms#master",
  description:
    "A website content management system based on Vue.js + typescript + elemnet."
};

const step1Func = () => {
  inquirer
    .prompt([
      {
        type: "rawlist",
        message: "Please select framework：",
        name: "lang",
        default: "Vue",
        choices: ["Vue", "React"],
        filter: function(val) {
          return val; // .toUpperCase();
        }
      }
    ])
    .then(answer => {
      if (answer.lang === "React") {
        console.log(
          logSymbols.warning,
          chalk.yellow(
            "Sorry, React project is still in working, please check out more in https://migao.io."
          )
        );
        return;
      }
      step2Func(answer.lang);
    });
};

const step2Func = lang => {
  inquirer
    .prompt([
      {
        type: "input",
        message: "Please input your project name:",
        name: "projectName",
        default: "MigaoCMS"
      },
      {
        type: "input",
        message: "Please input your project description:",
        name: "description",
        default: `A ${lang} project`
      },
      {
        type: "input",
        message: "Please input author:",
        name: "author",
        default: `walkingp`
      },
      {
        type: "input",
        message: "Please version number:",
        name: "version",
        default: `1.0.0`
      }
    ])
    .then(answer => {
      const { projectName } = answer;
      step3Func(projectName, answer);
    });
};

const deleteAll = path => {
  if (fs.existsSync(path)) {
    const files = fs.readdirSync(path);
    files.forEach(function(file, index) {
      var curPath = path + "/" + file;
      if (fs.statSync(curPath).isDirectory()) {
        // recurse
        deleteall(curPath);
      } else {
        // delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(path);
  }
};

const step3Func = async (projectName, answer) => {
  // check if folder exists
  await fs.exists(projectName, exist => {
    if (exist) {
      console.log(
        logSymbols.error,
        chalk.red(
          `Folder ${projectName} already exists, please delete it before creating.`
        )
      );
    } else {
      const spinner = ora("Initaling project, please wait...");
      spinner.start();
      download(
        gitRepo.downUrl,
        projectName,
        {
          clone: true
        },
        err => {
          if (err) {
            spinner.fail();
            console.log(
              logSymbols.error,
              chalk.red("Initial project failed: " + err)
            );
            return;
          }
          spinner.succeed();
          step4Func(projectName, answer);
        }
      );
    }
  });
};

const step4Func = (projectName, answer) => {
  const files = [`${projectName}/package.json`, `${projectName}/.env`];

  const spinner = ora("Processing files, please wait...");
  spinner.start();
  files.forEach(path => {
    const content = fs.readFileSync(path, "utf8");
    const result = handlebars.compile(content)(answer);

    fs.writeFileSync(path, result);
  });
  spinner.succeed();
  console.log(logSymbols.success, chalk.green(`Created project succeed!`));
  console.log(
    chalk.blue(`
Get started with the following commands:

> cd ${projectName}
> npm run serve
  (or: yarn serve)
  `)
  );
};

program
  .version("0.9.0")
  .usage("init")
  .option("-p, --page", "Add new page")
  .option("-l, --list", "List all available templates");

program
  .command("list")
  .description("Show all available templates")
  .action(() => {
    console.log(
      chalk.blue(`
Vue: Vue2.6+ElmentUI+TypeScript+Axios
React: React+Ant.Deisgn+TypeScrip+Axios (not available yet)
  `)
    );
  });

program
  .command("init")
  .description("Initializing Project")
  .action(() => {
    step1Func();
  });

program.parse(process.argv);
