import {
  AvleonConfig,
  Environment,
  definePlugin,
  loadPackageFromClient,
  type AvleonConfigClass,
  type PluginContext,
} from "@avleon/core";
import type { Knex } from "knex";
import type { DataSourceOptions } from "typeorm";
import { registerDataSource } from "./datasource";
import { AVLEON_KNEX_DB } from "./knex-provider";

declare module "@avleon/core" {
  interface AvleonApplication {
    /**
     * Connect Knex from a config object or an `@AppConfig` class, and register
     * it for `KnexDB`. Resolves once a test query succeeds. The connection is
     * destroyed when the app shuts down.
     */
    useKnex(options: Knex.Config | AvleonConfigClass<Knex.Config>): Promise<this>;
    /**
     * Initialize a TypeORM DataSource from its options or an `@AppConfig`
     * class, and register it for repositories. Resolves once connected. The
     * DataSource is destroyed when the app shuts down.
     */
    useTypeORM(
      options: DataSourceOptions | AvleonConfigClass<DataSourceOptions>,
    ): Promise<this>;
  }
}

/** Options given directly, or built by an `@AppConfig` class from the environment. */
function resolveOptions<T>(ctx: PluginContext, options: T | AvleonConfigClass<T>): T {
  if (typeof options === "function" && options.prototype instanceof AvleonConfig) {
    const config = ctx.container.get<AvleonConfig<T>>(options as AvleonConfigClass<T>);
    return config.config(ctx.container.get(Environment));
  }
  return options as T;
}

export const dataPlugin = definePlugin({
  name: "@avleon/data",
  register(ctx) {
    ctx.extend("useKnex", async (options: Knex.Config | AvleonConfigClass<Knex.Config>) => {
      const knex = loadPackageFromClient<typeof import("knex")>("knex");
      const config = resolveOptions(ctx, options);
      // Fail early with an install hint if the driver is missing.
      if (typeof config?.client === "string") loadPackageFromClient(config.client);

      const db = knex(config);
      ctx.container.set(AVLEON_KNEX_DB, db);
      await db.raw("SELECT 1");
      ctx.onClose(() => db.destroy());
      return ctx.app;
    });

    ctx.extend(
      "useTypeORM",
      async (options: DataSourceOptions | AvleonConfigClass<DataSourceOptions>) => {
        const typeorm = loadPackageFromClient<typeof import("typeorm")>("typeorm");
        const dataSource = registerDataSource(
          new typeorm.DataSource(resolveOptions(ctx, options)),
        );
        try {
          await dataSource.initialize();
        } catch (error) {
          ctx.logger.error({ err: error }, "Database connection failed");
          throw error;
        }
        ctx.logger.info("Database connected");
        ctx.onClose(() => dataSource.destroy());
        return ctx.app;
      },
    );
  },
});

export default dataPlugin;
