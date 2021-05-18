import {
  contractPrincipalCV,
  makeContractCall,
  makeSTXTokenTransfer,
  noneCV,
  uintCV,
} from "@stacks/transactions";
import { keys } from "./config";
import { poolAdmin, network, handleTransaction } from "./deploy";
import BN from "bn.js";

const { user } = keys;

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

(async () => {
  payin(user, 5000000, 861);
})();
