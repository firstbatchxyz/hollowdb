// load env variables (put this at top)
import "dotenv/config";

import { Redis } from "ioredis";
import { readFileSync } from "fs";
import { SDK } from "hollowdb";
import type { JWKInterface } from "warp-contracts";

import makeServer from "./server";
import config from "./config";
import { makeWarp } from "./util";
import { createCaches } from "./cache";

const contractTxId = process.env.CONTRACT_TXID;
if (!contractTxId) {
  throw new Error("Please provide CONTRACT_TXID environment variable.");
}
const redisClient = new Redis(config.REDIS_URL, {
  lazyConnect: false, // explicitly connect
});
const caches = createCaches(contractTxId, redisClient);
const wallet = JSON.parse(readFileSync(config.WALLET_PATH, "utf-8")) as JWKInterface;
const warp = makeWarp(caches);
const hollowdb = new SDK(wallet, contractTxId, warp);

// module.exports needed by Micro
module.exports = makeServer(hollowdb, contractTxId);
