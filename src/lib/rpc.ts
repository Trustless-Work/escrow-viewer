// src/lib/rpc.ts

export type JsonRpcResponse<T> = {
  jsonrpc: "2.0";
  id: number | string | null;
  result?: T;
  error?: { code: number; message: string; data?: unknown };
};

type RpcRequest = {
  jsonrpc: "2.0";
  id: number | string | null;
  method: string;
  params?: unknown; // optional by design
};

/** Minimal JSON-RPC caller. Only attaches "params" when provided. */
export async function jsonRpcCall<T>(
  rpcUrl: string,
  method: string,
  params?: unknown,
): Promise<T> {
  const body: RpcRequest = { jsonrpc: "2.0", id: 1, method };
  if (params !== undefined) body.params = params;

  const res = await fetch(rpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`RPC ${method} HTTP ${res.status}`);

  const json = (await res.json()) as JsonRpcResponse<T>;
  if (json.error) throw new Error(`${method} error: ${json.error.message}`);
  if (!json.result) throw new Error(`${method} returned no result`);
  return json.result;
}

/** Soroban RPC: getLatestLedger (no params) */
export async function getLatestLedger(rpcUrl: string) {
  return jsonRpcCall<{ sequence: number }>(rpcUrl, "getLatestLedger");
}

/** Soroban RPC: simulateTransaction (with params) */
export async function simulateTransaction(rpcUrl: string, txB64: string) {
  return jsonRpcCall<{ result: { retval: string } }>(
    rpcUrl,
    "simulateTransaction",
    {
      transaction: txB64,
    },
  );
}
