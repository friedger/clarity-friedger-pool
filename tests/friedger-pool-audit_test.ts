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
    ]);
    assertEquals(block.height, 3);
    assertEquals(block.receipts[0].result, "(err u1)");
    assertEquals(
      block.receipts[1].result,
      "(ok (some {scriptPubKey: 0x76a914c70e1ca5a5ef633fe5464821ca421c173997f38888ac, value: u10000}))"
    );
  },
});

const parts = [
  "0x00200020",
  "0xb9d30838796e6ea7ff4b441ca1d705c229f3492cfdddcd186b21000000000000",
  "0xed853698ef70b79478b6c01e31efdfff6fac38606661e3aa7b30d1b6fe6bf65a",
  "0xbec89660",
  "0x0afd2219",
  "0x6e2d6012",
];

Clarinet.test({
  name: "Ensure that valid txs are accepted",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let wallet_1 = accounts.get("wallet_1")!;
    let block = chain.mineBlock([
      Tx.contractCall(
        "friedger-pool-audit",
        "submit-reward-tx",
        [
          // block
          types.tuple({
            version: parts[0],
            parent: parts[1],
            "merkle-root": parts[2],
            timestamp: parts[3],
            nbits: parts[4],
            nonce: parts[5],
            height: types.uint(11319),
          }),
          // tx
          types.tuple({
            version: "0x01000000",
            ins: types.list([
              types.tuple({
                outpoint: types.tuple({
                  hash: "0xc8bd3502a21f810da7692e323cc46e0e9ec1def7a93cc610f6d65b60193174e2",
                  index: "0x03000000",
                }),
                scriptSig:
                  "0x47304402204ffe267e6b5aab28350be80c1f4ea94424c483f3f44f175594bb6273000f80e8022042ebd5668420c8b29d2ec2791e2c8aa0d7784d8a6283f958fe581e0be129c61b0121037435c194e9b01b3d7f7a2802d6684a3af68d05bbf4ec8f17021980d777691f1d",
                sequence: "0xfdffffff",
              }),
            ]),
            outs: types.list([
              types.tuple({
                scriptPubKey:
                  "0x6a4c5058365b13588072c8b4eca88a505db5c453123c5c91db98d90ac1cd124402dba596531ebf945361dbdbcb0a43e8d6984ab8eee14982d0341eab198fc74d2d917c6d95dc001e21c20008001e1fc2001d02",
                value: "0x0000000000000000",
              }),
              types.tuple({
                scriptPubKey:
                  "0x76a914c70e1ca5a5ef633fe5464821ca421c173997f38888ac",
                value: "0x1027000000000000",
              }),
              types.tuple({
                scriptPubKey:
                  "0x76a9146c575e9f31715b180b22738136895876ade678cb88ac",
                value: "0x1027000000000000",
              }),
              types.tuple({
                scriptPubKey:
                  "0x76a914ba27f99e007c7f605a8305e318c1abde3cd220ac88ac",
                value: "0x752f7c5c00000000",
              }),
            ]),
            locktime: "0x00000000",
          }),

          // proof
          types.tuple({
            "tx-index": types.uint(6),
            hashes: types.list([
              "0x3ae3dfeedc6eb99fb5e2c5d0c90697a66de969c3f4d974ebe2ef104fcea7f13b",
              "0x52500d11cabf1049ebb139a82b439d08bd3a8e867a41fb3f368dfa125e043989",
              "0xa104c2725aabf28fcf3c304fd370610370330c546495acd5015ecc177c6494f6",
              "0x5e4442a235be2fc92aa15ba3b59c5af61c46dff8e7ed8198ebc48ec6d71a6a49",
              "0x904640bdf50c8edd12232efc41966a3a9af955208b205a90fc8a6dca5f69c458",
            ]),
            "tree-depth": types.uint(5),
          }),
        ],
        wallet_1.address
      ),
    ]);
    assertEquals(block.height, 2);
    assertEquals(block.receipts[0].result, "(ok true)");
    console.log("submit-tx", block.receipts[0]);
  },
});
