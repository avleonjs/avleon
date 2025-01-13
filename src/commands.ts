import chalk from "chalk";
export type CommandType = {
  Command: string;
  Alias: string;
  Options: string;
  Description: string;
}

export const commandList: CommandType[] = [
  {
    Command: "new",
    Alias: "",
    Options: "--minimal -m, -d --database",
    Description: "Create a new application"
  },
  {
    Command: "make:model",
    Alias: "m:m, mm",
    Options: "-f --force",
    Description:
      "Create a new model. Use -f or --froce to overwrite if any model exists with name",
  },
  {
    Command: "make:controller",
    Alias: "m:c",
    Options: `-f, --force for force create\n -r or --resource for resource controller`,
    Description: `Create a new controller. Use -f or --force to overwrite existing controller. If you want to create a resource controller pass options -r or --resource. 
You may also pass model by -m or --model.\n
${chalk.blueBright("Note:")} when using a resource contorller iqra will automaticall check for dtos related to model name. If -m is user then
it will check for dtos like UserCreateDto and UserUpdateDto. If dtos not found it will create automatically using 
model properties.
    `,
  },
  {
    Command: "make:service",
    Alias: "m:s",
    Options: `-f, --force for force create\n -r or --resource for resource controller`,
    Description: `Create a new controller. Use -f or --force to overwrite existing controller. If you want to create a resource controller pass options -r or --resource. 
You may also pass model by -m or --model.\n
${chalk.blueBright("Note:")} when using a resource contorller iqra will automaticall check for dtos related to model name. If -m is user then
it will check for dtos like UserCreateDto and UserUpdateDto. If dtos not found it will create automatically using 
model properties.
    `,
  },
  {
    Command: "make:resource",
    Alias: "m:r",
    Options: `-f, --force for force create\n -r or --resource for resource`,
    Description: `Create a new resource. Use -f or --force to overwrite existing controller. If you want to create a resource controller pass options -r or --resource. 
You may also pass model by -m or --model.\n
${chalk.blueBright("Note:")} when using a resource contorller iqra will automaticall check for dtos related to model name. If -m is user then
it will check for dtos like UserCreateDto and UserUpdateDto. If dtos not found it will create automatically using 
model properties.
    `,
  },
];
