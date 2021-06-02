import { deployContract, contractAddress } from "./deploy";

const clarityBitcoinSuffix = "-v4";
const oracleSuffix = "";
const poolAuditSuffix = "-v8";
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
        .replace(/\.oracle/g, `'STZ0RAC1EFTH949T4W2SYY6YBHJRMAF4ED5QB123.oracle-v1`);
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
