import {
  BufferArray,
  bufferCV,
  contractPrincipalCV,
  createSTXPostCondition,
  FungibleConditionCode,
  makeContractCall,
  noneCV,
  PostConditionMode,
  tupleCV,
  uintCV,
} from "@stacks/transactions";
import { configKeys } from "./config";
import { handleTransaction, mocknet, network, STACKS_API_URL } from "./deploy";
import BN from "bn.js";
import fetch from "node-fetch";
import { poolAdmin } from "./pool-admin-utils";

const { user } = configKeys(mocknet);

const mainnet = false;
export const poxContractAddress = mainnet
  ? "SP000000000000000000002Q6VF78"
  : "ST000000000000000000002AMW42H";

async function allowContractCaller(userData: { private: string }) {
  const tx = await makeContractCall({
    contractAddress: poxContractAddress,
    contractName: "pox",
    functionName: "allow-contract-caller",
    functionArgs: [
      contractPrincipalCV(poolAdmin.address, poolAdmin.name),
      noneCV(),
    ],
    senderKey: userData.private,
    network,
  });
  await handleTransaction(tx);
}

async function delegatedlyStackStx(
  userData: { private: string },
  amount: number
) {
  const tx = await makeContractCall({
    contractAddress: poolAdmin.address,
    contractName: poolAdmin.name,
    functionName: "delegate-stx",
    functionArgs: [
      uintCV(amount * 1000000),
      contractPrincipalCV(poolAdmin.address, poolAdmin.name),
      noneCV(),
      noneCV(),
      tupleCV({
        version: bufferCV(Buffer.from("")),
        hashbytes: bufferCV(Buffer.from("")),
      }),
      uintCV(12),
    ],
    senderKey: userData.private,
    network,
  });
  const result = await handleTransaction(tx);
  return result;
}

async function stackAggregateCommit(
  userData: { private: string },
  cycleId: number,
) {
  const tx = await makeContractCall({
    contractAddress: poolAdmin.address,
    contractName: poolAdmin.name,
    functionName: "stack-aggregation-commit",
    functionArgs: [uintCV(cycleId)],
    senderKey: userData.private,
    network,
    postConditionMode: PostConditionMode.Deny,
    postConditions: [
      createSTXPostCondition(
        `${poolAdmin.address}.${poolAdmin.name}`,
        FungibleConditionCode.GreaterEqual,
        new BN(0)
      ),
    ],
  });
  const result = await handleTransaction(tx);
  return result;
}

async function fetchCylceId() {
  const result = await fetch(`${STACKS_API_URL}/v2/pox`);
  const poxInfo = await result.json();
  return poxInfo.next_cycle.id;
}

(async () => {
  //await allowContractCaller(user);
  //await delegatedlyStackStx(user, mocknet ? 90_000_000 : 520_000_000); // in stx
  const cycleId = await fetchCylceId();
  console.log(cycleId);
  await stackAggregateCommit(user, cycleId);
})();
