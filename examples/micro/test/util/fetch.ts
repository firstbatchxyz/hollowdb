import type { Request } from "../types";

/**
 * Generic POST utility for HollowDB micro. Depending on the
 * request, call `response.json()` or `response.text()` to parse
 * the returned body.
 * @param url url
 * @param data body
 * @returns response object
 */
export async function postData<V = unknown>(url: string, data: Request<V>) {
  const body = JSON.stringify(data);
  // console.log("SIZE (kb):", new Blob([body]).size / (1 << 10));
  // console.log("SIZE (mb):", new Blob([body]).size / (1 << 20));
  return fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
    body,
  });
}

/**
 * GET a key from database.
 * @param url url
 * @param key key
 * @returns response object
 */
export async function getKey(url: string, key: string) {
  return fetch(url + "/" + key);
}
