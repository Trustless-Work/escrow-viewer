// src/lib/token-service.ts
import {
  Address,
  Account,
  Asset,
  Contract,
  Keypair,
  Networks,
  TransactionBuilder,
  xdr,
} from "@stellar/stellar-sdk";
import { getNetworkConfig, type NetworkType } from "@/lib/network-config";
import { getLatestLedger, simulateTransaction } from "@/lib/rpc";

/** Derive Stellar Asset Contract (SAC) ID from classic asset. */
export function sacContractIdFromAsset(code: string, issuer: string, passphrase: string) {
  return new Asset(code, issuer).contractId(passphrase);
}

/** Internal: build+simulate a no-arg contract call; return ScVal retval. */
async function callNoArgs(
  network: NetworkType,
  contractId: string,
  func: string
): Promise<xdr.ScVal> {
  const cfg = getNetworkConfig(network);
  const passphrase =
    cfg.networkPassphrase ?? (network === "mainnet" ? Networks.PUBLIC : Networks.TESTNET);

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

  const sim = await simulateTransaction(cfg.rpcUrl, tx.toXDR());
  return xdr.ScVal.fromXDR(sim.result.retval, "base64");
}

/** Query token.decimals() via simulate; returns a number (u32 preferred). */
export async function fetchTokenDecimals(
  network: NetworkType,
  tokenContractId: string
): Promise<number> {
  const scv = await callNoArgs(network, tokenContractId, "decimals");

  switch (scv.switch()) {
    case xdr.ScValType.scvU32():
      return scv.u32();
    case xdr.ScValType.scvU64():
      return Number(scv.u64());
    case xdr.ScValType.scvU128():
      return Number(scv.u128());
    default:
      throw new Error("Unexpected decimals return type");
  }
}

/** Call token.balance(Address) via simulate; returns raw bigint (unscaled). */
export async function fetchTokenBalance(
  network: NetworkType,
  tokenContractId: string,
  ownerAddress: string
): Promise<bigint> {
  const cfg = getNetworkConfig(network);
  const passphrase =
    cfg.networkPassphrase ?? (network === "mainnet" ? Networks.PUBLIC : Networks.TESTNET);

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

  const sim = await simulateTransaction(cfg.rpcUrl, tx.toXDR());
  const rv = xdr.ScVal.fromXDR(sim.result.retval, "base64");
  if (rv.switch() !== xdr.ScValType.scvI128()) {
    throw new Error("token.balance returned non-i128");
  }
  const i128 = rv.i128();
  const hi = BigInt(i128.hi().toString());
  const lo = BigInt(i128.lo().toString());
  return (hi << BigInt(64)) + lo;
}
