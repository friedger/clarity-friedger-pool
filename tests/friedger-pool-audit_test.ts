import {
  Clarinet,
  Tx,
  Chain,
  Account,
  types,
} from "https://deno.land/x/clarinet@v0.6.0/index.ts";
import { assertEquals } from "https://deno.land/std@0.95.0/testing/asserts.ts";

Clarinet.test({
  name: "Ensure that invalid txs are not accepted",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let wallet_1 = accounts.get("wallet_1")!;
    const block1 = chain.mineBlock([]);
    console.log(block1)
    let block = chain.mineBlock([
      Tx.contractCall(
        "friedger-pool-audit",
        "submit-reward-tx",
        [
          // block
          types.tuple({
            header: "0x0000000000000000000000000000000000000000000000000000000000000000",
            height: types.uint(block1.height),
          }),
          // tx
          "0x1234",
          // proof
          types.tuple({
            "tx-index": types.uint(1),
            hashes: types.list([]),
            "tree-depth": types.uint(1),
          }),
        ],
        wallet_1.address
      ),
    ]);
    assertEquals(block.height, 3);
    assertEquals(block.receipts[0].result, "(err u2)");
  },
});


Clarinet.test({
  name: "Ensure that valid txs are accepted",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let wallet_1 = accounts.get("wallet_1")!;
    const block1 = chain.mineBlock([]);
    console.log(block1)
    let block = chain.mineBlock([
      Tx.contractCall(
        "friedger-pool-audit",
        "submit-reward-tx",
        [
          // block
          types.tuple({
            header: "0x0000000000000000000000000000000000000000000000000000000000000000",
            height: types.uint(block1.height),
          }),
          // tx
          "0x1234",
          // proof
          types.tuple({
            "tx-index": types.uint(1),
            hashes: types.list([]),
            "tree-depth": types.uint(1),
          }),
        ],
        wallet_1.address
      ),
    ]);
    assertEquals(block.height, 3);
    assertEquals(block.receipts[0].result, "(err u2)");
  },
});