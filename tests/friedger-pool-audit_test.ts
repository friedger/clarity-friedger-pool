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
    let block = chain.mineBlock([
      Tx.contractCall(
        "friedger-pool-audit",
        "submit-reward-tx",
        [
          // block
          types.tuple({
            "merkle-root": "0x1234",
            nbits: "0x1234",
            nonce: "0x1234",
            parent: "0x123456",
            timestamp: "0x1234",
            version: "0x1234",
            height: types.uint(block1.height),
          }),
          // tx
          types.tuple({
            ins: types.list([]),
            outs: types.list([]),
            locktime: "0x1234",
            version: "0x1234",
          }),

          // proof
          types.tuple({
            "tx-index": types.uint(1),
            hashes: types.list([]),
            "tree-depth": types.uint(1),
          }),
        ],
        wallet_1.address
      ),
      Tx.contractCall(
        "friedger-pool-audit",
        "get-tx-value-for-pool",
        [
          "0x0100000001c8bd3502a21f810da7692e323cc46e0e9ec1def7a93cc610f6d65b60193174e2030000006a47304402204ffe267e6b5aab28350be80c1f4ea94424c483f3f44f175594bb6273000f80e8022042ebd5668420c8b29d2ec2791e2c8aa0d7784d8a6283f958fe581e0be129c61b0121037435c194e9b01b3d7f7a2802d6684a3af68d05bbf4ec8f17021980d777691f1dfdffffff040000000000000000536a4c5058365b13588072c8b4eca88a505db5c453123c5c91db98d90ac1cd124402dba596531ebf945361dbdbcb0a43e8d6984ab8eee14982d0341eab198fc74d2d917c6d95dc001e21c20008001e1fc2001d0210270000000000001976a914c70e1ca5a5ef633fe5464821ca421c173997f38888ac10270000000000001976a9146c575e9f31715b180b22738136895876ade678cb88ac752f7c5c000000001976a914ba27f99e007c7f605a8305e318c1abde3cd220ac88ac00000000",
        ],
        wallet_1.address
      ),
      Tx.contractCall(
        "clarity-bitcoin",
        "parse-tx",
        [
          "0x0100000001c8bd3502a21f810da7692e323cc46e0e9ec1def7a93cc610f6d65b60193174e2030000006a47304402204ffe267e6b5aab28350be80c1f4ea94424c483f3f44f175594bb6273000f80e8022042ebd5668420c8b29d2ec2791e2c8aa0d7784d8a6283f958fe581e0be129c61b0121037435c194e9b01b3d7f7a2802d6684a3af68d05bbf4ec8f17021980d777691f1dfdffffff040000000000000000536a4c5058365b13588072c8b4eca88a505db5c453123c5c91db98d90ac1cd124402dba596531ebf945361dbdbcb0a43e8d6984ab8eee14982d0341eab198fc74d2d917c6d95dc001e21c20008001e1fc2001d0210270000000000001976a914c70e1ca5a5ef633fe5464821ca421c173997f38888ac10270000000000001976a9146c575e9f31715b180b22738136895876ade678cb88ac752f7c5c000000001976a914ba27f99e007c7f605a8305e318c1abde3cd220ac88ac00000000",
        ],
        wallet_1.address
      ),
    ]);
    assertEquals(block.height, 3);
    assertEquals(block.receipts[0].result, "(err u2)");
    assertEquals(
      block.receipts[1].result,
      "(ok (some {scriptPubKey: 0x76a914c70e1ca5a5ef633fe5464821ca421c173997f38888ac, value: u10000}))"
    );
  },
});
