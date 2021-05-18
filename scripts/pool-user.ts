import {
  contractPrincipalCV,
  createSTXPostCondition,
  FungibleConditionCode,
  makeContractCall,
  noneCV,
  PostConditionMode,
  uintCV,
} from "@stacks/transactions";
import { keys } from "./config";
import { handleTransaction, network, poolAdmin } from "./deploy";
import BN from "bn.js";

const { user } = keys;

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
      noneCV(),
      uintCV(4),
    ],
    senderKey: userData.private,
    network,
  });
  const result = await handleTransaction(tx);
  return result;
}

async function stackAggregateCommit(
  userData: { private: string },
  cycleId: number
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
(async () => {
  //await allowContractCaller(user);
  //await delegatedlyStackStx(user, 530000000);
  await stackAggregateCommit(user, 863);
})();
