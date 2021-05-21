import {
  Clarinet,
  Tx,
  Chain,
  Account,
  types,
} from "https://deno.land/x/clarinet@v0.6.0/index.ts";
import { assertEquals } from "https://deno.land/std@0.95.0/testing/asserts.ts";

Clarinet.test({
  name: "Ensure that user can pay in",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let wallet_1 = accounts.get("wallet_1")!;
    let block = chain.mineBlock([
      Tx.contractCall(
        "friedger-pool-admin",
        "payin",
        [types.uint(1000000), types.uint(1)],
        wallet_1.address
      ),
    ]);
    assertEquals(block.height, 2);
    block.receipts[0].result.expectOk();
  },
});

Clarinet.test({
  name: "Ensure that user can receive rewards",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let wallet_1 = accounts.get("wallet_1")!;
    let deployer = accounts.get("deployer")!;

    let block = chain.mineBlock([
      Tx.contractCall(
        "friedger-pool-admin",
        "allow-contract-caller",
        [types.principal(deployer.address + ".friedger-pool-admin")],
        wallet_1.address
      ),

      Tx.contractCall(
        "ST000000000000000000002AMW42H.pox",
        "allow-contract-caller",
        [
          types.principal(deployer.address + ".friedger-pool-admin"),
          types.none(),
        ],
        wallet_1.address
      ),

      Tx.contractCall(
        "friedger-pool-admin",
        "delegate-stx",
        [
          types.uint(1000000),
          types.principal(deployer.address + ".friedger-pool-admin"),
          types.some(types.uint(100)),
          types.none(),
          types.none(),
          types.uint(2),
        ],
        wallet_1.address
      ),
    ]);
    assertEquals(block.height, 2);
    block.receipts[0].result.expectOk();
    //block.receipts[1].result.expectOk(); // fails due to https://github.com/lgalabru/clarinet/issues/16
    //block.receipts[2].result.expectOk();
    //assertEquals(block.receipts[2].result, "ok")
    assertEquals(
      chain.callReadOnlyFn(
        "friedger-pool-admin",
        "get-next-cycle",
        [],
        wallet_1.address
      ).result,
      types.uint(1)
    );
    // mine through reward cycle
    chain.mineEmptyBlock(150);
    // check cycle id
    assertEquals(
      chain.callReadOnlyFn(
        "friedger-pool-admin",
        "get-next-cycle",
        [],
        wallet_1.address
      ).result,
      types.uint(2)
    );
    // payin and claim reward
    block = chain.mineBlock([
      Tx.contractCall(
        "friedger-pool-admin",
        "payin",
        [types.uint(100), types.uint(0)],
        deployer.address
      ),
      Tx.contractCall(
        "friedger-pool-admin",
        "claim-rewards",
        [types.uint(0)],
        wallet_1.address
      ),
    ]);

    assertEquals(block.height, 153);
    block.receipts[0].result.expectOk();
    assertEquals(block.receipts[1].result, "(err u606)");
  },
});
