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

/** gated logger (enable with NEXT_PUBLIC_DEBUG_ESCROW=1) */
function dbg(...args: unknown[]) {
  if (process.env.NEXT_PUBLIC_DEBUG_ESCROW === "1") {
    console.log("[token-service]", ...args);
  }
}

// XDR helper types to avoid "any"
type ContractEventV0Like = {
  topics?: () => xdr.ScVal[]; // some SDKs expose methods
  data?: () => xdr.ScVal;
} & {
  topics?: xdr.ScVal[]; // some expose fields
  data?: xdr.ScVal;
};

type ContractEventBodyV0Getter = {
  v0?: () => ContractEventV0Like;
};

type ContractEventBodyLike = {
  // some SDKs expose .body().v0()
  body?: () => ContractEventBodyV0Getter;
};

type DiagnosticEventFactory = {
  fromXDR?: (b64: string, fmt: "base64") => { event?: () => xdr.ContractEvent };
};

function getMaybeDiagnosticEventFactory(): DiagnosticEventFactory | undefined {
  const maybe = (xdr as unknown as { DiagnosticEvent?: DiagnosticEventFactory }).DiagnosticEvent;
  return maybe && typeof maybe.fromXDR === "function" ? maybe : undefined;
}

function tryGetContractEventFromDiagnostic(b64: string): xdr.ContractEvent | null {
  const fac = getMaybeDiagnosticEventFactory();
  if (!fac) return null;
  try {
    const dev = fac.fromXDR!(b64, "base64");
    if (dev && typeof dev.event === "function") {
      return dev.event() as xdr.ContractEvent;
    }
    return null;
  } catch {
    return null;
  }
}

function getEventV0Safely(ce: xdr.ContractEvent): ContractEventV0Like | null {
  try {
    const bodyLike = (ce as unknown as ContractEventBodyLike).body?.();
    const v0Like = bodyLike?.v0?.();
    return v0Like ?? null;
  } catch {
    return null;
  }
}


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

function parseFnReturnFromEventB64(
  evB64: string,
  expectFunc: string
): xdr.ScVal | null {
  try {
    // 1) Try DiagnosticEvent → ContractEvent
    let ce: xdr.ContractEvent | null = tryGetContractEventFromDiagnostic(evB64);

    // 2) Fallback: parse as raw ContractEvent
    if (!ce) {
      try {
        ce = xdr.ContractEvent.fromXDR(evB64, "base64");
      } catch {
        return null;
      }
    }
    if (!ce) return null;

    // 3) Access v0 safely (different SDKs expose differently)
    const v0 = getEventV0Safely(ce);
    if (!v0) return null;

    const topics =
      (typeof v0.topics === "function" ? v0.topics() : v0.topics) ?? [];
    const data =
      (typeof v0.data === "function" ? v0.data() : v0.data) as xdr.ScVal | undefined;
    if (!Array.isArray(topics) || topics.length < 2 || !data) return null;

type ScValSwitchable = { switch?: () => number; sym?: () => { toString(): string } };

// Narrow by capability instead of comparing enum values
type HasSym = { sym?: () => { toString(): string } };

const hasSym = (sv: xdr.ScVal): sv is xdr.ScVal & HasSym =>
  typeof (sv as HasSym).sym === "function";

const topic0 = topics[0];
const topic1 = topics[1];

if (!hasSym(topic0) || !hasSym(topic1)) return null;

const sym0 = topic0.sym()!.toString();
const sym1 = topic1.sym()!.toString();

if (sym0 !== "fn_return" || sym1 !== expectFunc) return null;

return data; // unchanged

  } catch {
    return null;
  }
}


function parseFnReturnFromEvents(
  events: unknown,
  expectFunc: string
): xdr.ScVal | null {
  if (!Array.isArray(events)) return null;
  for (const evB64 of events) {
    if (typeof evB64 !== "string") continue;
    const sv = parseFnReturnFromEventB64(evB64, expectFunc);
    if (sv) return sv;
  }
  return null;
}


/** Simulate a built tx via JSON-RPC and return retval ScVal (or null if unavailable)
 * - First look for a `retval` field in the JSON
 * - If missing, parse events for `fn_return(funcName)`
 */
async function simulateAndGetRetval(
  rpcUrl: string,
  txB64: string,
  funcNameForEvent?: string
): Promise<xdr.ScVal | null> {
  const sim = await rpcSimulate(rpcUrl, txB64);

  // Try direct retval
  const retvalB64 = findRetval(sim);
  if (retvalB64) {
    try {
      return xdr.ScVal.fromXDR(retvalB64, "base64");
    } catch (e) {
      dbg("simulate: retval present but failed to parse:", (e as Error)?.message);
    }
  }

  // Fallback: parse events (fn_return)
  if (funcNameForEvent) {
    try {
const evRet = parseFnReturnFromEvents(
  (sim as unknown as { events?: unknown }).events,
  funcNameForEvent
);      if (evRet) {
        dbg("simulate: used fn_return fallback for", funcNameForEvent);
        return evRet;
      }
    } catch (e) {
      dbg("simulate: event parse error:", (e as Error)?.message);
    }
  }

  // Final debug
  dbg("simulate response (preview):", JSON.stringify(sim)?.slice(0, 600));
  dbg("simulate: no retval found in response structure");
  return null;
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

  const scv = await simulateAndGetRetval(cfg.rpcUrl, tx.toXDR(), func);
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
 * Falls back to parsing `fn_return(balance)` from events.
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

  // Try retval, then event fallback
  const scv = await simulateAndGetRetval(cfg.rpcUrl, tx.toXDR(), "balance");
  if (!scv) {
    dbg("simulate balance: no retval (RPC host may be redacting)");
    return null;
  }

  if (scv.switch() !== xdr.ScValType.scvI128()) {
    dbg("simulate balance: unexpected ScVal type", scv.switch());
    return null;
  }

  const i128 = scv.i128();
  const hi = BigInt(i128.hi().toString());
  const lo = BigInt(i128.lo().toString());
  return (hi << BigInt(64)) + lo;
}
