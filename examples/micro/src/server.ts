import { json, createError, send } from "micro";
import { IncomingMessage, ServerResponse } from "http";
import { SDK } from "hollowdb";
import { StatusCodes } from "http-status-codes";
import { LoggerFactory } from "warp-contracts";

import type { Request } from "./types";
import config from "./config";

/**
 * A higher-order function to create a micro server that uses the given HollowDB instance
 * @param hollowdb instance of hollowdb
 * @param contractTxId connected contract tx id
 * @template V type of the value stored in hollowdb
 * @returns a `micro` server, should be exported via `module.exports`
 */
export default function makeServer<V = unknown>(hollowdb: SDK<V>, contractTxId: string) {
  let isReady = false;

  // sync to the latest on-chain state
  hollowdb.getState().then(() => {
    isReady = true;
    console.log("Server synced & ready.");
    console.log("> Config:\n", config);
    console.log(`> Redis: ${config.REDIS_URL}`);
    console.log(`> Wallet: ${config.WALLET_PATH}`);
    console.log(`> Contract: https://sonar.warp.cc/#/app/contract/${contractTxId}`);
  });

  // update log-level
  LoggerFactory.INST.logLevel(config.WARP_LOG_LEVEL);

  return async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
    if (!isReady) {
      return send(res, StatusCodes.SERVICE_UNAVAILABLE, "Cache is still loading, try again shortly.");
    }

    // parse the request, it is either a (GET) "/key" or (POST)
    const url = req.url || "/";
    const reqBody: Request<V> =
      url === "/"
        ? // this is a POST request with JSON body
          ((await json(req)) as Request<V>)
        : // this is a GET request
          // in our case, the url itself should be the key
          {
            route: "GET",
            data: { key: url.slice(url.lastIndexOf("/") + 1) },
          };

    const { route, data } = reqBody;
    try {
      switch (route) {
        case "GET": {
          const value = await hollowdb.get(data.key);
          return send(res, StatusCodes.OK, { value });
        }
        case "GET_MANY": {
          const values = await hollowdb.getMany(data.keys);
          return send(res, StatusCodes.OK, { values });
        }
        case "PUT": {
          await hollowdb.put(data.key, data.value);
          return send(res, StatusCodes.OK);
        }
        case "PUT_MANY": {
          if (data.keys.length !== data.values.length) {
            return send(res, StatusCodes.BAD_REQUEST, "Keys and values count do not match.");
          }
          await hollowdb.putMany(data.keys, data.values);
          return send(res, StatusCodes.OK);
        }
        case "UPDATE": {
          await hollowdb.update(data.key, data.value, data.proof);
          return send(res, StatusCodes.OK);
        }
        case "REMOVE": {
          await hollowdb.remove(data.key, data.proof);
          return send(res, StatusCodes.OK);
        }
        case "STATE": {
          const state = await hollowdb.getState();
          return send(res, StatusCodes.OK, state);
        }
        default:
          route satisfies never;
          return send(res, StatusCodes.NOT_FOUND, "Unknown route.");
      }
    } catch (err) {
      const error = err as Error;
      console.error(error);
      if (error.message.startsWith("Contract Error")) {
        return send(res, StatusCodes.BAD_REQUEST, error.message);
      }
      throw createError(StatusCodes.INTERNAL_SERVER_ERROR, error.message, error);
    }
  };
}
