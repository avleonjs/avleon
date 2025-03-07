import chalk from "chalk";
import { existsSync } from "fs";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import prettier from "prettier";


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
  const controllerNameLowerCase = name.replace(/Controller/ig, '').match(/[A-Z][a-z]+|[0-9]+/g).join("-").toLowerCase();
  const controllerNameCap = controllerName.replace(/Controller/ig, '')
  const controllerExists = existsSync(`${controllerPath}/${name.toLowerCase()}.controller.ts`);

  if (controllerExists && !options.force) {
    console.log(
      chalk.bold(chalk.red("controller already exists!")),
      chalk.greenBright("Use -f or --force to overwrite.\r"),
    );
    return;
  }

  if (options.model) {
    const file = await import(
      path.join(process.cwd(), "./src/models/" + options.model.toUpperCase() + ".ts")
    );

    if (file) {
      Object.getOwnPropertyNames(file);
    }
  }

  const restController = `
  import { ApiController, Get, Post, Put, Delete, Param, Body } from '@avleon/core';
  \t
    @ApiController("/${controllerNameLowerCase}")
    export class ${controllerName}{\n
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
    path.join(process.cwd(), "./src/controllers/" + controllerName.toLowerCase().replace("controller", "") + ".controller." + ".ts"),
    formatcontroller,
  );

  console.log("Controller created succssessfully!");
}
export { createController };
