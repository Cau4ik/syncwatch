import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { registerSocketLayer } from "./plugins/socket.js";

const app = await createApp();

registerSocketLayer(app.server);

try {
  await app.listen({
    host: "0.0.0.0",
    port: env.PORT
  });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}

