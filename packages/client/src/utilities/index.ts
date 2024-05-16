/**
 * Given a database name `db` and an api-key `apiKey`, fetches the
 * bearer token to be used in header as `authorization: "Bearer ${token}"`.
 *
 * If `db` or `apiKey` is invalid, throws an error.
 */
export async function getToken(db: string, apiKey: string): Promise<string> {
  const url = `https://auth.firstbatch.xyz/hollow/create_bearer?db=${db}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
    },
  });

  const authResponse = (await response.json()) as {
    message?: string;
    bearerToken?: string;
  };
  if (!response.ok) {
    throw new Error(
      `${url} got status ${response.status}: ${authResponse.message}`
    );
  }

  if (!authResponse.bearerToken) {
    throw new Error('Server did not provide a bearer token.');
  }

  return authResponse.bearerToken;
}
