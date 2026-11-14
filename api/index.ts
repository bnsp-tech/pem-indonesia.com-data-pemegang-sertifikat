import type { IncomingMessage, ServerResponse } from 'node:http';
import { createApp } from '../server.js';

type ExpressApp = Awaited<ReturnType<typeof createApp>>;

let cachedApp: ExpressApp | null = null;
let cachedAppPromise: Promise<ExpressApp> | null = null;

async function getApp(): Promise<ExpressApp> {
  if (cachedApp) {
    return cachedApp;
  }
  if (!cachedAppPromise) {
    cachedAppPromise = createApp()
      .then((app) => {
        cachedApp = app;
        return app;
      })
      .catch((err) => {
        cachedAppPromise = null;
        throw err;
      });
  }
  return cachedAppPromise;
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const app = await getApp();
  return app(req, res);
}
