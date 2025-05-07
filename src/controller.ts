import { existsSync } from "fs";
import path from "path";
import { pathHelper } from "./helpers/path-helper";
import fs from 'node:fs/promises'
import { fh, getFilePathWithoutName, resolveNames } from "./helpers/file-helper";
import { camelCase, kebabCase, upperFirst } from 'lodash';

function capitalize(str: string) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}
function lower(str: string) {
  return str.toLowerCase();
}


function exportNamesAndPath(input: string): {
  className: string;
  fileName: string;
  filePath: string;
} {
  const parts = input.split('/');
  const lastPart = parts.pop()!;
  const filePath = parts.length ? parts.join('/') + '/' : '.';

  // Normalize base name by removing trailing "Controller" (case-insensitive)
  const rawName = lastPart.replace(/controller$/i, '');

  // Create className in PascalCase + Controller
  const className = upperFirst(camelCase(rawName));

  // Create fileName in kebab-case + .controller.ts
  const fileName = `${kebabCase(rawName)}.controller.ts`;

  return { className, fileName, filePath };
}


const controllersStubs = {
  basic: pathHelper.stubPath('controllers/basic-controller.stub'),
  rest: pathHelper.stubPath('controllers/basic-controller.stub'),
  ormRest: pathHelper.stubPath('controllers/orm-rest-controller.stub')
}

async function createController(
  name: string,
  options = { force: false, resource: false, prefix: true, rest: false, model: null, root: null },
  p?: string
) {
  if (!name) {
    throw new Error(
      "Controller name not found. use --name or npx avleon make:controller HomeController",
    );
  }

  // determine stub for generate
  let stubPath = controllersStubs.basic;
  if (options.rest) {
    stubPath = controllersStubs.rest;
    if (options.model) {
      stubPath = controllersStubs.ormRest;
    }
  }

  // determine root path for create controller file 
  const rootPath = options.root ? 'src/' + options.root + '/' : 'src/controllers/';

  // ensure file create directory exits 
  if (name.split("/").length > 1) {
    if (!existsSync(path.join(rootPath, name.split("/").splice(-1, 1).join("/")))) {
      await fs.mkdir(path.join(rootPath, name.replace('/' + fh.filenameFromPath(name), '')), { recursive: true })
    }
  }

  // read stub content from stub file
  const content = await fs.readFile(stubPath, 'utf8')


  const names = resolveNames(fh.filenameFromPath(name), 'Controller');
  const className = names.className.replace("Controller", '');

  if (options.model) {
    await createRestService(className, options.model);
  }

  let replacedContent = content
    .replaceAll('{Controller}', className)
    .replaceAll('{controller}', names.varName)
  if (options.model) {
    replacedContent = replacedContent
      .replaceAll('{Model}', capitalize(options.model))
      .replaceAll('{model}', lower(options.model));
  }

  if (!options.prefix) {
    replacedContent = replacedContent.replace(/@ApiController\s*\(([^)]*)\)/g, '@ApiController');
  }

  await fs.writeFile(path.join(rootPath, getFilePathWithoutName(name) + "/" + kebabCase(className) + '.controller.ts'), replacedContent, 'utf8');
  console.log("Controller created succssessfully!");
}

async function createRestService(
  name: string,
  model?: string
) {

  let stubPath = pathHelper.stubPath('services/rest-service.stub');
  const content = await fs.readFile(stubPath, 'utf8')
  const names = resolveNames(fh.filenameFromPath(name), 'Controller');
  let replacedContent = content
    .replaceAll('{Service}', name);

  if (model) {
    replacedContent = replacedContent
      .replaceAll('{Model}', capitalize(model))
      .replaceAll('{model}', lower(model));
  }


  await fs.writeFile(path.join('src/services/', kebabCase(name) + '.service.ts'), replacedContent, 'utf8');
  console.log("Service created succssessfully!");
}
export { createController };
