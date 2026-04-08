declare module "better-sqlite3-session-store" {
  import type { Store } from "express-session";
  import type Database from "better-sqlite3";

  interface Options {
    client: Database.Database;
    expired?: { clear?: boolean; intervalMs?: number };
  }

  function factory(session: typeof import("express-session")): {
    new (options: Options): Store;
  };

  export default factory;
}
