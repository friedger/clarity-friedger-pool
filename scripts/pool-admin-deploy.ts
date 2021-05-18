import { deployContract, contractAddress } from "./deploy";

const clarityBitcoinSuffix = "-v2";
const oracleSuffix = "";
const poolAuditSuffix = "-v3";
const poolAdminSuffix = "-v3";

(async () => {
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
})();
