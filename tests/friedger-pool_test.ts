import {
  Clarinet,
  Tx,
  Chain,
  Account,
  types,
} from "https://deno.land/x/clarinet@v0.5.2/index.ts";
import { assertEquals } from "https://deno.land/std@0.90.0/testing/asserts.ts";

Clarinet.test({
  name: "Ensure that ",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let wallet_1 = accounts.get("wallet_1")!;
    let block = chain.mineBlock([
      Tx.contractCall(
        "friedger-pool",
        "submit-reward-tx",
        [
          // block
          types.tuple({
            header: "0x1234",
            height: types.uint(100),
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
    assertEquals(block.height, 2);
    block.receipts[0].result.expectOk();
  },
});
