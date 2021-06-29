import {
  contractPrincipalCV,
  FungibleConditionCode,
  makeContractCall,
  makeStandardSTXPostCondition,
  makeSTXTokenTransfer,
  noneCV,
  PostConditionMode,
  uintCV,
} from "@stacks/transactions";
import { configKeys } from "./config";
import {  network, handleTransaction, mocknet } from "./deploy";
import BN from "bn.js";
import { poolAdmin } from "./pool-admin-deploy";

const { user } = configKeys(mocknet);

async function payin(
  userData: { private: string },
  amount: number,
  cycleId: number
) {
  const tx = await makeContractCall({
    contractAddress: poolAdmin.address,
    contractName: poolAdmin.name,
    functionName: "payin",
    functionArgs: [uintCV(amount), uintCV(cycleId)],
    senderKey: userData.private,
    network,
  });
  const result = await handleTransaction(tx);
  return result;
}

async function submitUnauditedRewards(
  userData: { private: string; stacks: string },
  amount: number,
  cycleId: number
) {
  const tx = await makeContractCall({
    contractAddress: poolAdmin.address,
    contractName: poolAdmin.name,
    functionName: "submit-unaudited-rewards",
    functionArgs: [uintCV(amount), uintCV(cycleId)],
    senderKey: userData.private,
    postConditionMode: PostConditionMode.Deny,
    postConditions: [
      makeStandardSTXPostCondition(
        user.stacks,
        FungibleConditionCode.LessEqual,
        new BN(amount)
      ),
    ],
    network,
  });
  const result = await handleTransaction(tx);
  return result;
}

(async () => {
  await submitUnauditedRewards(user, 50000000, 433);
  //payin(user, 5000000, 375);
})();
