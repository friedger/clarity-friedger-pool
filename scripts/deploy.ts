//
// utils functions

import {
  broadcastTransaction,
  makeContractDeploy,
  StacksTransaction,
  TxBroadcastResultOk,
  TxBroadcastResultRejected,
} from "@stacks/transactions";
import { StacksTestnet } from "@stacks/network";

import * as fs from "fs";
const fetch = require("node-fetch");

import { ADDR1, ADDR2, testnetKeyMap } from "./mocknet";
import { configKeys } from "./config";

const BigNum = require("bn.js");

export const local = false;
export const mocknet = false;
export const noSidecar = false;

const STACKS_CORE_API_URL = mocknet
  ? "http://localhost:3999"
  : local
  ? noSidecar
    ? "http://localhost:21443"
    : "http://localhost:3999"
  : "https://stacks-node-api.testnet.stacks.co";
//"http://18.224.63.146:20443";
//"http://178.170.47.25:20443";
//"http://45.77.131.83:20443";
export const STACKS_API_URL = local
  ? "http://localhost:3999"
  : "https://stacks-node-api.testnet.stacks.co";
export const network = new StacksTestnet();
network.coreApiUrl = STACKS_CORE_API_URL;

/* Replace with your private key for testnet deployment */

export const secretKey = configKeys(mocknet).user.private;
export const contractAddress = configKeys(mocknet).user.stacks;

//
export async function handleTransaction(transaction: StacksTransaction) {
  const result = await broadcastTransaction(transaction, network);
  console.log(result);
  if ((result as TxBroadcastResultRejected).error) {
    if (
      (result as TxBroadcastResultRejected).reason === "ContractAlreadyExists"
    ) {
      console.log("already deployed");
      return "" as TxBroadcastResultOk;
    } else {
      throw new Error(
        `failed to handle transaction ${transaction.txid()}: ${JSON.stringify(
          result
        )}`
      );
    }
  }
  const processed = await processing(result as TxBroadcastResultOk);
  if (!processed) {
    throw new Error(
      `failed to process transaction ${transaction.txid}: transaction not found`
    );
  }
  console.log(processed, result);
  return result as TxBroadcastResultOk;
}

export async function deployContract(
  contractName: string,
  options?: {
    path?: string;
    suffix?: string;
    replaceFn?: (s: string) => string;
  }
) {
  const codeBody = fs
    .readFileSync(options?.path || `./contracts/${contractName}.clar`)
    .toString();
  var transaction = await makeContractDeploy({
    contractName: `${contractName}${options?.suffix || ""}`,
    codeBody: options?.replaceFn ? options.replaceFn(codeBody) : codeBody,
    senderKey: secretKey,
    network,
  });
  console.log(`deploy contract ${contractName}`);
  return handleTransaction(transaction);
}

function timeout(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function processing(tx: String, count: number = 0): Promise<boolean> {
  return noSidecar
    ? processingWithoutSidecar(tx, count)
    : processingWithSidecar(tx, count);
}

async function processingWithoutSidecar(
  tx: String,
  count: number = 0
): Promise<boolean> {
  await timeout(10000);
  return true;
}

async function processingWithSidecar(
  tx: String,
  count: number = 0
): Promise<boolean> {
  const url = `${STACKS_API_URL}/extended/v1/tx/${tx}`;
  var result = await fetch(url);
  var value = await result.json();
  console.log(count);
  if (value.tx_status === "success") {
    console.log(`transaction ${tx} processed`);
    console.log(value);
    return true;
  }
  if (value.tx_status === "pending") {
    console.log(value);
  } else if (count === 10) {
    console.log(value);
  }

  if (count > 30) {
    console.log("failed after 30 trials");
    console.log(value);
    return false;
  }

  if (mocknet) {
    await timeout(5000);
  } else {
    await timeout(50000);
  }
  return processing(tx, count + 1);
}
