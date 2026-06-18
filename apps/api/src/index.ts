import "dotenv/config";
import { createServer } from "node:http";
import { createApp } from "./app.js";
import { loadConfig } from "./config.js";
import { createContainer } from "./container.js";

const config = loadConfig(process.env);
createContainer();

const server = createServer(createApp());

server.listen(config.PORT, () => {
  console.log(`scholva-api listening on ${config.PORT}`);
});
