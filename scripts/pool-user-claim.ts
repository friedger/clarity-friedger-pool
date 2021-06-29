import {
  BufferArray,
  bufferCV,
  callReadOnlyFunction,
  ClarityType,
  contractPrincipalCV,
  createSTXPostCondition,
  FungibleConditionCode,
  makeContractCall,
  noneCV,
  PostConditionMode,
  standardPrincipalCV,
  tupleCV,
  uintCV,
} from "@stacks/transactions";
import { keys } from "./config";
import { handleTransaction, mocknet, network, poolAdmin } from "./deploy";
import BN from "bn.js";
import fetch from "node-fetch";

const { user } = keys;

const mainnet = false;
export const poxContractAddress = mainnet
  ? "SP000000000000000000002Q6VF78"
  : "ST000000000000000000002AMW42H";

async function claimRewards(
  userData: { private: string; stacks: string },
  cycleId: number
) {
  const rewards = await callReadOnlyFunction({
    contractAddress: poolAdmin.address,
    contractName: poolAdmin.name,
    functionName: "get-rewards",
    functionArgs: [standardPrincipalCV(user.stacks), uintCV(cycleId)],
    senderAddress: poolAdmin.address,
    network,
  });

  console.log({ rewards });
  console.log(((rewards as any).value as any).value.toNumber());
  const tx = await makeContractCall({
    contractAddress: poolAdmin.address,
    contractName: poolAdmin.name,
    functionName: "claim-rewards",
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
  await claimRewards(user, 434);
})();
