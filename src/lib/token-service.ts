import {
  Account,
  Address,
  Asset,
  Contract,
  Keypair,
  Networks,
  TransactionBuilder,
  xdr,
} from "@stellar/stellar-sdk";
import { getNetworkConfig, type NetworkType } from "@/lib/network-config";
import { getLatestLedger, simulateTransaction as rpcSimulate } from "@/lib/rpc";

/** Derive Stellar Asset Contract ID (SAC) from classic asset */
export function sacContractIdFromAsset(
  code: string,
  issuer: string,
  passphrase: string
) {
  return new Asset(code, issuer).contractId(passphrase);
}

/** Recursively search an object/array for a string `retval` field */
function findRetval(node: unknown): string | undefined {
  if (!node) return undefined;
  if (typeof node === "string") return undefined;

  if (Array.isArray(node)) {
    for (const el of node) {
      const r = findRetval(el);
      if (typeof r === "string") return r;
    }
    return undefined;
  }

  if (typeof node === "object") {
    const o = node as Record<string, unknown>;
    if (typeof o.retval === "string") return o.retval;

    if (o.result) {
      const r = findRetval(o.result);
      if (typeof r === "string") return r;
    }
    if (o.results) {
      const r = findRetval(o.results);
      if (typeof r === "string") return r;
    }
    for (const k of Object.keys(o)) {
      const r = findRetval(o[k]);
      if (typeof r === "string") return r;
    }
  }
  return undefined;
}

/** Simulate a built tx via JSON-RPC and return retval ScVal (or null if unavailable) */
async function simulateAndGetRetval(
  rpcUrl: string,
  txB64: string
): Promise<xdr.ScVal | null> {
  const sim = await rpcSimulate(rpcUrl, txB64);
  const retvalB64 = findRetval(sim);
  if (!retvalB64) return null;
  return xdr.ScVal.fromXDR(retvalB64, "base64");
}

/** Call a contract function with NO args (e.g., decimals) and return ScVal */
async function callContractNoArgs(
  network: NetworkType,
  contractId: string,
  func: string
): Promise<xdr.ScVal> {
  const cfg = getNetworkConfig(network);
  const passphrase =
    cfg.networkPassphrase ??
    (network === "mainnet" ? Networks.PUBLIC : Networks.TESTNET);

  const latest = await getLatestLedger(cfg.rpcUrl);
  const source = Keypair.random();
  const account = new Account(source.publicKey(), String(latest.sequence));

  const c = new Contract(contractId);
  const op = c.call(func);

  const tx = new TransactionBuilder(account, {
    fee: "10000",
    networkPassphrase: passphrase,
  })
    .addOperation(op)
    .setTimeout(30)
    .build();

  const scv = await simulateAndGetRetval(cfg.rpcUrl, tx.toXDR());
  if (!scv) {
    // If host blocks retval for simple views, we can’t discover decimals here.
    // Let callers decide on a default.
    throw new Error("no-decimals-retval");
  }
  return scv;
}

/** Read token decimals (prefers u32, tolerates u64/u128 as number) */
export async function fetchTokenDecimals(
  network: NetworkType,
  tokenContractId: string
): Promise<number> {
  try {
    const scv = await callContractNoArgs(network, tokenContractId, "decimals");

    if (scv.switch() === xdr.ScValType.scvU32()) return scv.u32();
    if (scv.switch() === xdr.ScValType.scvU64()) return Number(scv.u64());
    if (scv.switch() === xdr.ScValType.scvU128()) return Number(scv.u128());

    // Unexpected — fallback to common Stellar default
    return 7;
  } catch {
    // If retval was blocked, default to 7 (common on Stellar)
    return 7;
  }
}

/** Read token balance(owner) via simulate (read-only).
 * Returns bigint on success or null when retval is unavailable.
 */
export async function fetchTokenBalance(
  network: NetworkType,
  tokenContractId: string,
  ownerAddress: string
): Promise<bigint | null> {
  const cfg = getNetworkConfig(network);
  const passphrase =
    cfg.networkPassphrase ??
    (network === "mainnet" ? Networks.PUBLIC : Networks.TESTNET);

  const latest = await getLatestLedger(cfg.rpcUrl);
  const source = Keypair.random();
  const account = new Account(source.publicKey(), String(latest.sequence));

  const c = new Contract(tokenContractId);
  const scAddr = Address.fromString(ownerAddress).toScAddress();
  const scvOwner = xdr.ScVal.scvAddress(scAddr);
  const op = c.call("balance", scvOwner);

  const tx = new TransactionBuilder(account, {
    fee: "10000",
    networkPassphrase: passphrase,
  })
    .addOperation(op)
    .setTimeout(30)
    .build();

  const scv = await simulateAndGetRetval(cfg.rpcUrl, tx.toXDR());
  if (!scv) return null;

  if (scv.switch() !== xdr.ScValType.scvI128()) {
    return null;
  }

  const i128 = scv.i128();
  const hi = BigInt(i128.hi().toString());
  const lo = BigInt(i128.lo().toString());
  return (hi << BigInt(64)) + lo;
}
