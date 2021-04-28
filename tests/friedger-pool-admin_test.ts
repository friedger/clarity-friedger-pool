import {
  Clarinet,
  Tx,
  Chain,
  Account,
  types,
} from "https://deno.land/x/clarinet@v0.6.0/index.ts";
import { assertEquals } from "https://deno.land/std@0.95.0/testing/asserts.ts";

Clarinet.test({
  name: "Ensure that user can payin",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let wallet_1 = accounts.get("wallet_1")!;
    let block = chain.mineBlock([
      Tx.contractCall(
        "friedger-pool-admin",
        "payin",
        [
          types.uint(1000000),
          types.uint(1)
        ],
        wallet_1.address
      ),
    ]);
    assertEquals(block.height, 2);
    block.receipts[0].result.expectOk();
  },
});
