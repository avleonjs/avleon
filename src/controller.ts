import chalk from "chalk";
import { existsSync } from "fs";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import prettier from "prettier";

function capitalize(str:string) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}
async function createController(
  name: string,
  options = { force: false, resource: false, model: null },
  p?: string
) {
  if (!name) {
    throw new Error(
      "Controller name not found. use --name or node artisan make:controller HomeController",
    );
  }
  const controllerPath = path.join(process.cwd(), "./src/controllers");
  const controllerFolderExists = existsSync(controllerPath);
  if (!controllerFolderExists) {
    await mkdir(controllerPath, {
      recursive: true,
    });
  }

  const controllerName = name.at(0).toUpperCase() + name.slice(1);
const controllerNameLowerCase = name
    .replace(/Controller/ig, '')
    .match(/[A-Z]?[a-z]+|[0-9]+/g) // added ? to also capture single lowercase words
    ?.join('-')
    .toLowerCase() || name.toLowerCase();

  const controllerNameCap = controllerName.replace(/Controller/ig, '')
  const controllerExists = existsSync(`${controllerPath}/${name.toLowerCase()}.controller.ts`);

  if (controllerExists && !options.force) {
    console.log(
      chalk.bold(chalk.red("controller already exists!")),
      chalk.greenBright("Use -f or --force to overwrite.\r"),
    );
    return;
  }

  if(options.resource && !options.model)
  {
    console.log(
      chalk.bold(chalk.red("Model must be provide to generate rest controller!")),
      chalk.greenBright("Use -m Model or --model Model to .\r"),
    );
    return;
}
  // if (options.model) {
  //   const file = require(
  //     path.join(process.cwd(), "./src/models/" + options.model.toUpperCase() + ".ts")
  //   ).default;

  //   if (file) {
  //     Object.getOwnPropertyNames(file);
  //   }
  // }

  const restController = `
  import { ApiController, Collection, Get, Post, Put, Delete, Param, Body } from '@avleon/core';
  import { ${capitalize(options.model)} } from '../models/${capitalize(options.model)}'
  \t
    @ApiController("/${controllerNameLowerCase}s")
    export class ${controllerName}Controller {\n

    constructor(
      private readonly ${options.model.toLowerCase()}Repository = Collection.fromRepository(${capitalize(options.model)})
    ){}

  @Get()
  async findAll(){
    return "okay";
  }\n
  @Get('/:id')
  async findOne(@Param('id') id:number){
    return "okay";
  }\n
  @Post()
  async create(@Body() body:any){
  return true;
  }\n
  @Put('/:id')
  async update(@Param('id') id:number, @Body() body:any){
  return true;
  }\n
  @Delete('/:id')
  async delete(@Param('id') id:number){
  return true;
  }

  }
  `;

  const basicContorller = `import {ApiController, Get} from '@avleon/core'
  \n 
  @ApiController("/${controllerNameLowerCase}")
  export class ${controllerName}{
  \n
  @Get()
  index(){
  return []
  }
  }
  `;

  const formatcontroller = await prettier.format(
    options.resource ? restController : basicContorller,
    {
      singleQuote: true,
      singleAttributePerLine: true,
      parser: "typescript",
    },
  );

  await writeFile(
    path.join(process.cwd(), "./src/controllers/" + controllerName.toLowerCase().replace("controller", "") + ".controller" + ".ts"),
    formatcontroller,
  );

  console.log("Controller created succssessfully!");
}
export { createController };
