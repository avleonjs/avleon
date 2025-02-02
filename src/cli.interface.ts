import { CommandType } from "./commands";

export interface AvCli{
    commands: CommandType[];

    createModel(): void;
    createService(): void;
    createController(): void;
    createProject(): void;
    createResource(): void;
    createRestService(): void;
    createRestController(): void;
    displayHelp(): void;
}


export interface IBuilder{
    content: string;
    parse(content: string): IBuilder;
    process(content: string): IBuilder;
    format(content:string, parseOptions:any): IBuilder;
    build(): string;
}


export interface ModelBuilder extends IBuilder{ }
export interface ProjectBuilder extends IBuilder{ }
export interface ControllerBuilder extends IBuilder{ }
export interface ServiceBuilder extends IBuilder{ }
export interface ResourceBuilder extends IBuilder{ }
