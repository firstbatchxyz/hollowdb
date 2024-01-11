// load env variables (put this at top)
import "dotenv/config";

import http from "http";
import { Redis } from "ioredis";
import { existsSync, readFileSync } from "fs";
import { SDK } from "hollowdb";
import { serve } from "micro";
import type { JWKInterface } from "warp-contracts";

import makeServer from "./server";
import config from "./config";
import { makeWarp } from "./util";
import { createCaches } from "./cache";

const contractTxId = process.env.CONTRACT;
if (!contractTxId) {
  throw new Error("Please provide CONTRACT_TXID environment variable.");
}
if (Buffer.from(contractTxId, "base64").toString("hex").length !== 64) {
  throw new Error("Invalid CONTRACT_TXID.");
}
const redisClient = new Redis(config.REDIS_URL, {
  lazyConnect: false, // explicitly connect
});
const caches = createCaches(contractTxId, redisClient);
if (!existsSync(config.WALLET_PATH)) {
  throw new Error("No wallet found at: " + config.WALLET_PATH);
}
const wallet = JSON.parse(readFileSync(config.WALLET_PATH, "utf-8")) as JWKInterface;
const warp = makeWarp(caches);

const hollowdb = new SDK(wallet, contractTxId, warp);

const server = new http.Server(serve(makeServer(hollowdb, contractTxId)));

server.listen(3000);
