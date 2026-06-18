import "dotenv/config";
import { createServer } from "node:http";
import { createApp } from "./app.js";
import { loadConfig } from "./config.js";
import { createContainer } from "./container.js";

const config = loadConfig(process.env);
const container = createContainer(config);

const server = createServer(createApp(container));

server.listen(config.PORT, () => {
  console.log(`scholva-api listening on ${config.PORT}`);
});
