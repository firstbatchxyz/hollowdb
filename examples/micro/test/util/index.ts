import http from "http";

export * from "./deploy";
export * from "./fetch";

/**
 * Sleeps the system for a given number of milliseconds.
 * @param ms milliseconds
 * @returns a `NodeJS.Timeout`
 */
export function sleep(ms = 1500) {
  return new Promise((res) => {
    setTimeout(res, ms);
  });
}

/**
 * Shuts down an HTTP service.
 * @param service http service
 */
export function shutdown(service: http.Server) {
  return new Promise<void>((resolve, reject) => {
    service.close((err?: Error) => (err ? reject(err) : resolve()));
  });
}

/**
 * Returns the size of a given data in bytes.
 * - To convert to KBs: `size / (1 << 10)`
 * - To convert to MBs: `size / (1 << 20)`
 * @param data data, such as `JSON.stringify(body)` for a POST request.
 * @returns data size in bytes
 */
export function size(data: string) {
  return new Blob([data]).size;
}
