import { deployContract, contractAddress, mocknet } from "./deploy";
import { ADDR1, testnetKeyMap } from "./mocknet";

const clarityBitcoinSuffix = "-v5";
const oracleSuffix = "";
const poolAuditSuffix = "-v10";
const poolAdminSuffix = "-v5";

export const poolAdmin = mocknet
  ? {
      address: testnetKeyMap[ADDR1].stacks,
      name: "friedger-pool-admin",
    }
  : {
      address: "ST33GW755MQQP6FZ58S423JJ23GBKK5ZKH3MGR55N",
      name: `pool-admin${poolAdminSuffix}`,
    };

export async function deploy() {
  await deployContract("clarity-bitcoin", { suffix: clarityBitcoinSuffix });
  await deployContract("oracle");
  await deployContract("pool-audit", {
    suffix: poolAuditSuffix,
    path: "contracts/friedger-pool-audit.clar",
    replaceFn: (s) => {
      const result = s
        .replace(
          /\.clarity-bitcoin/g,
          `'${contractAddress}.clarity-bitcoin${clarityBitcoinSuffix}`
        )
        .replace(/\.oracle/g, `'${contractAddress}.oracle${oracleSuffix}`);
      console.log(result);
      return result;
    },
  });
  await deployContract("pool-admin", {
    suffix: poolAdminSuffix,
    path: "contracts/friedger-pool-admin.clar",
    replaceFn: (s) =>
      s.replace(
        /\.friedger-pool-audit/g,
        `'${contractAddress}.pool-audit${poolAuditSuffix}`
      ),
  });
}
