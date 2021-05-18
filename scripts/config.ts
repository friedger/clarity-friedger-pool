import fs from "fs";
export const keys = {
  user: JSON.parse(fs.readFileSync("../testnet-keys.json").toString()),
};
