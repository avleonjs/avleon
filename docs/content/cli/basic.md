---
title: Avleon Commands
description: Useful commands
---

# Avleon Commands

Install the CLI globally, or run it with `npx`:

```sh
npm i -g @avleon/cli
```

## Command Overview

| Command | Alias | Description |
|---------|-------|-------------|
| `new` | | Create a new application |
| `serve` | | Start the dev server with watch + rebuild |
| `build` | | Compile using `tsconfig.build.json` |
| `make:model` | `m:m` | Create a model or TypeORM entity |
| `make:controller` | `m:c` | Create a controller |
| `make:service` | `m:s` | Create a service |
| `make:config` | `m:cnf` | Create a config class |
| `make:middleware` | `m:mlwr` | Create a middleware |

Every `make:*` command takes `-f` / `--force` to overwrite an existing file.

## Application

```sh
npx @avleon/cli new myapi
```

You are prompted for a package manager and optional features — OpenAPI docs,
CORS, TypeORM, Knex and Scalar UI. Then:

```sh
cd myapi
npm run start:dev
```

## Development Server

```sh
npx avleon serve
```

Compiles `src/` with SWC into `dist/`, starts the app and restarts it on change.
The entry point comes from `avleon.entry` in `package.json`, falling back to `main`.

## Controller

```sh
npx avleon make:controller user
# shorthand
npx avleon m:c user
```

Pass `-r` for a full REST skeleton, and `-m <model>` to bind it to a model:

```sh
npx avleon m:c user -m user -r
```

With `-m`, the matching service is generated in `src/services` and the controller
delegates to it. Add `--orm` to back that service with a TypeORM repository.

Use `-rt <dir>` to place the file under a different directory, and `--base-path`
to emit `@ApiController` without a route prefix.

## Service

```sh
npx avleon make:service user
```

A resource service uses an in-memory `Collection` by default:

```sh
npx avleon make:service user -m user -r
```

Add `--orm` for one backed by a TypeORM repository:

```sh
npx avleon make:service user -m user -r --orm
```

## Model

```sh
# plain class
npx avleon make:model user

# TypeORM entity
npx avleon m:m user --orm
```

## Middleware

```sh
npx avleon make:middleware auth
```

Generates a class extending `AvleonMiddleware`:

```ts [src/middlewares/auth.middleware.ts]
import { AppMiddleware, AvleonMiddleware, IRequest, IResponse } from '@avleon/core';

@AppMiddleware
export class AuthMiddleware extends AvleonMiddleware {
  async invoke(req: IRequest, res?: IResponse) {
    // your logic goes here
    return req;
  }
}
```

## Config

```sh
npx avleon make:config jwt
```

Generates a class extending `AvleonConfig` and registered with `@AppConfig`:

```ts [src/config/jwt.config.ts]
import { AppConfig, AvleonConfig, Environment } from '@avleon/core';

@AppConfig
export class JwtConfig extends AvleonConfig {
  config(env: Environment) {
    return {};
  }
}
```

## Build

```sh
npx avleon build
```

Removes `dist/` and compiles the project with `tsconfig.build.json`.
