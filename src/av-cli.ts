#!/usr/bin/env node
import { AvCli, CreateModelOptions } from "./cli.interface";
import { commandList, CommandType } from "./commands";

type ProjectFileType =
  | "controller"
  | "service"
  | "model"
  | "util"
  | "helper"
  | "config";

interface FilePathExtractor {
  name: string;
  ext?: string;
  parent: string;
  givenPath: string;
  outputPath?: string;
  newFileName: string;
  className: string;
  exsits: boolean;
  force: boolean;
  fileType?: ProjectFileType;
}

interface MakeOptions {
  name?: string;
  force?: boolean;
  crud?: boolean;
  model?: boolean;
  tests?: boolean;
}

interface RestOptions {}

type FieldOptions = "";
interface MakeModel {
  name?: string;
  force?: boolean;
  fields?: FieldOptions;
  tiemstamps?: boolean;
  entity?: boolean;
}

interface MakeService extends MakeOptions {
  dtos?: boolean;
}

interface MakeController extends MakeOptions {}

function formatFileName(name: string) {
  return name
    .replace(/[_\s]+/g, "-")
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .replace(
      /((-|_|\.)+(Controller|Service|Model))|(Controller|Service|Model)/gi,
      "",
    )
    .toLowerCase();
}

function formatClassName(name: string) {
  return name
    .replace(/[_\s-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .replace(/\s+/g, "");
}

export function PathExtractor(givenPath: string, options: string[]) {
  let pathSplits = givenPath.split("/");
  let splitSize = pathSplits.length;
  let hasSubDirectory = splitSize > 0;
  let name = hasSubDirectory ? pathSplits[splitSize - 1] : pathSplits[0];
  let className = formatClassName(name);
  let fileType = "any";
  let isRest = false;
  let isForced = false;
  if (options.includes("make:controller") || options.includes("m:c")) {
    fileType = "controller";
    className = name.toLowerCase().replace(/controller|Controller/g, "");
  }
  if (options.includes("make:model") || options.includes("m:m")) {
    fileType = "model";
    className = name.toLowerCase().replace(/controller|Controller/g, "");
  }

  if (options.includes("make:service") || options.includes("m:s")) {
    fileType = "service";
    className = name.toLowerCase().replace(/controller|Controller/g, "");
  }

  if (options.includes("make:util") || options.includes("m:u")) {
    fileType = "util";
    className = name.toLowerCase().replace(/controller|Controller/g, "");
  }

  if (options.includes("make:config")) {
    fileType = "config";
    className = name.toLowerCase().replace(/controller|Controller/g, "");
  }

  if (options.includes("--rest") || options.includes("-r")) {
    isRest = true;
    className = name.toLowerCase().replace(/controller|Controller/g, "");
  }

  if (options.includes("--force") || options.includes("-f")) {
    isForced = true;
    className = name.toLowerCase().replace(/controller|Controller/g, "");
  }

  let outputFileName = formatFileName(name);

  let outputPath = givenPath + "." + fileType + ".ts";

  return {};
}
