import {
  contractPrincipalCV,
  makeContractCall,
  makeSTXTokenTransfer,
  noneCV,
  uintCV,
} from "@stacks/transactions";
import { network, handleTransaction, mocknet } from "./deploy";
import { configKeys } from "./config";
import BN from "bn.js";
import { poolAdmin } from "./pool-admin-utils";

const { user } = configKeys(mocknet);
async function allowContractCaller(userData: { private: string }) {
  const tx = await makeContractCall({
    contractAddress: poolAdmin.address,
    contractName: poolAdmin.name,
    functionName: "allow-contract-caller",
    functionArgs: [contractPrincipalCV(poolAdmin.address, poolAdmin.name)],
    senderKey: userData.private,
    network,
  });
  const result = await handleTransaction(tx);
  return result;
}

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

async function fillContract(userData: { private: string }, amount: number) {
  const tx = await makeSTXTokenTransfer({
    amount: new BN(amount),
    recipient: `${poolAdmin.address}.${poolAdmin.name}`,
    senderKey: userData.private,
    network,
  });
  const result = await handleTransaction(tx);
  return result;
}

(async () => {
  await allowContractCaller(user);
  await fillContract(user, 5000);
})();
