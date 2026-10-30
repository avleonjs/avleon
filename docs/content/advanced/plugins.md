---
title: Plugins
description: Add features to an Avleon app from a separate package.
---

# Plugins

A plugin is a package that adds features to an Avleon app: new `app.use*`
methods, services in the container, lifecycle hooks and Fastify hooks.
Installing a plugin is enough; Avleon finds it among the app's dependencies
when the app is created.

## Writing a plugin

Export a plugin from the package and point to it from `package.json`:

```ts [src/plugin.ts]
import { definePlugin, Token } from '@avleon/core';
import { createClient, type Client } from 'some-db';

export const DB = new Token<Client>('DB');

export default definePlugin({
  name: '@acme/db',
  register(ctx) {
    ctx.extend('useDb', function (url: string) {
      const client = createClient(url);
      ctx.container.set(DB, client);
      ctx.onInit(() => client.connect());
      ctx.onClose(() => client.disconnect());
      return ctx.app;
    });
  },
});

declare module '@avleon/core' {
  interface AvleonApplication {
    /** Connect to the database when the app starts. */
    useDb(url: string): AvleonApplication;
  }
}
```

```json [package.json]
{
  "name": "@acme/db",
  "main": "dist/index.js",
  "avleon": { "plugin": "./dist/plugin.js" },
  "peerDependencies": { "@avleon/core": "^0.4.0" }
}
```

List `@avleon/core` as a **peer dependency**, not a dependency, so the plugin
shares the app's container instead of getting its own copy.

`register(ctx)` runs once, when the app is created, and must be synchronous so
the methods it adds exist as soon as `createApplication()` returns. Do async
work in `ctx.onInit`. The context gives you:

| Member | Use |
|--------|-----|
| `ctx.extend(name, fn)` | Add `app[name]`. Throws if core or another plugin already defines it. |
| `ctx.container` | The app's container (`get`, `set`, `has`) |
| `ctx.onInit` / `ctx.onReady` / `ctx.onClose` | [Lifecycle hooks](/getting-started/usage#lifecycle-hooks) |
| `ctx.http` | The Fastify instance, for Fastify hooks and plugins |
| `ctx.logger` | A logger tagged with the plugin's name |
| `ctx.app` | The application |

If a plugin needs another one to register first, name it in `dependsOn`:

```ts
definePlugin({ name: '@acme/audit', dependsOn: ['@acme/db'], register(ctx) { /* ... */ } });
```

## Registering plugins explicitly

Discovery reads the app's `package.json`, which a bundled app doesn't have at
runtime. Pass plugins yourself in that case, or in tests:

```ts
import db from '@acme/db/plugin';

const app = Avleon.createApplication({
  plugins: [db],
  autoloadPlugins: false, // optional: skip discovery
});
```

An explicit plugin replaces a discovered one with the same name.
`app.getPlugins()` lists the registered plugins in registration order.
