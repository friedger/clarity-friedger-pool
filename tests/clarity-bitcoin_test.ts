import {
  Clarinet,
  Tx,
  Chain,
  Account,
  types,
} from "https://deno.land/x/clarinet@v0.6.0/index.ts";
import { assertEquals } from "https://deno.land/std@0.95.0/testing/asserts.ts";

const parts = [
  "0x00200020",
  "0xb9d30838796e6ea7ff4b441ca1d705c229f3492cfdddcd186b21000000000000",
  "0xed853698ef70b79478b6c01e31efdfff6fac38606661e3aa7b30d1b6fe6bf65a",
  "0xbec89660",
  "0x0afd2219",
  "0x6e2d6012",
];

Clarinet.test({
  name: "Ensure that valid merkle proofs are validated",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let wallet_1 = accounts.get("wallet_1")!;

    // get some reverse value of buffers
    let block0 = chain.mineBlock([
      Tx.contractCall(
        "clarity-bitcoin",
        "reverse-buff32",
        ["0x3bd3a1309a518c381248fdc26c3a6bd62c35db7705069f59206684308cc237b3"],
        wallet_1.address
      ),
      Tx.contractCall(
        "clarity-bitcoin",
        "reverse-buff32",
        ["0x7ad9187efd4fa01ce8690015a1a711d7958f18c248fb4c47a32d00732cfc4a61"],
        wallet_1.address
      ),
      Tx.contractCall(
        "clarity-bitcoin",
        "reverse-buff32",
        ["0x5af66bfeb6d1307baae361666038ac6fffdfef311ec0b67894b770ef983685ed"],
        wallet_1.address
      ),
    ]);
    console.log(block0);

    // values taken from
    // https://bitcoindev.network/calculating-the-merkle-root-for-a-block/
    let block = chain.mineBlock([
      Tx.contractCall(
        "clarity-bitcoin",
        "verify-merkle-proof",
        [
          // reversed tx of
          // 3bd3a1309a518c381248fdc26c3a6bd62c35db7705069f59206684308cc237b3
          "0xb337c28c30846620599f060577db352cd66b3a6cc2fd4812388c519a30a1d33b",
          // reversed merkel root of
          // 0x25c8487847de572c21bff029a95d9a9fecd9f4c2736984b979d37258cd47bd1f
          "0x1fbd47cd5872d379b9846973c2f4d9ec9f9a5da929f0bf212c57de477848c825",
          // proof
          types.tuple({
            "tx-index": types.uint(0),
            hashes: types.list([
              // reversed tx of 0xa99011a19e9894753d6c65c8fa412838ea8042886537588e7205734d5de8956d
              "0x6d95e85d4d7305728e583765884280ea382841fac8656c3d7594989ea11190a9",
            ]),
            "tree-depth": types.uint(1),
          }),
        ],
        wallet_1.address
      ),

      // verify pool tx
      Tx.contractCall(
        "clarity-bitcoin",
        "verify-merkle-proof",
        [
          // reversed tx of
          // 7ad9187efd4fa01ce8690015a1a711d7958f18c248fb4c47a32d00732cfc4a61
          "0x614afc2c73002da3474cfb48c2188f95d711a7a1150069e81ca04ffd7e18d97a",
          // reversed merkel root of
          // 0x5af66bfeb6d1307baae361666038ac6fffdfef311ec0b67894b770ef983685ed
          "0xed853698ef70b79478b6c01e31efdfff6fac38606661e3aa7b30d1b6fe6bf65a",
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
      // concat-header
      Tx.contractCall(
        "clarity-bitcoin",
        "concat-header",
        [
          types.tuple({
            version: "0x00200020",
            parent:
              "0xb9d30838796e6ea7ff4b441ca1d705c229f3492cfdddcd186b21000000000000",
            "merkle-root":
              "0xed853698ef70b79478b6c01e31efdfff6fac38606661e3aa7b30d1b6fe6bf65a",
            timestamp: "0xbec89660",
            nbits: "0x0afd2219",
            nonce: "0x6e2d6012",
            height: types.uint(11319),
          }),
        ],
        wallet_1.address
      ),

      // parse-tx
      Tx.contractCall(
        "clarity-bitcoin",
        "parse-tx",
        [
          "0x0100000001c8bd3502a21f810da7692e323cc46e0e9ec1def7a93cc610f6d65b60193174e2030000006a47304402204ffe267e6b5aab28350be80c1f4ea94424c483f3f44f175594bb6273000f80e8022042ebd5668420c8b29d2ec2791e2c8aa0d7784d8a6283f958fe581e0be129c61b0121037435c194e9b01b3d7f7a2802d6684a3af68d05bbf4ec8f17021980d777691f1dfdffffff040000000000000000536a4c5058365b13588072c8b4eca88a505db5c453123c5c91db98d90ac1cd124402dba596531ebf945361dbdbcb0a43e8d6984ab8eee14982d0341eab198fc74d2d917c6d95dc001e21c20008001e1fc2001d0210270000000000001976a914c70e1ca5a5ef633fe5464821ca421c173997f38888ac10270000000000001976a9146c575e9f31715b180b22738136895876ade678cb88ac752f7c5c000000001976a914ba27f99e007c7f605a8305e318c1abde3cd220ac88ac00000000",
        ],
        wallet_1.address
      ),

      // verify block header
      Tx.contractCall(
        "clarity-bitcoin",
        "verify-block-header",
        [
          "0x00200020b9d30838796e6ea7ff4b441ca1d705c229f3492cfdddcd186b21000000000000ed853698ef70b79478b6c01e31efdfff6fac38606661e3aa7b30d1b6fe6bf65abec896600afd22196e2d6012",
          types.uint(11319),
        ],
        wallet_1.address
      ),

      // was-tx-mined-2?

      Tx.contractCall(
        "clarity-bitcoin",
        "was-tx-mined-2?",
        [
          types.tuple({
            version: parts[0],
            parent: parts[1],
            "merkle-root": parts[2],
            timestamp: parts[3],
            nbits: parts[4],
            nonce: parts[5],
            height: types.uint(11319),
          }),
          "0x0100000001c8bd3502a21f810da7692e323cc46e0e9ec1def7a93cc610f6d65b60193174e2030000006a47304402204ffe267e6b5aab28350be80c1f4ea94424c483f3f44f175594bb6273000f80e8022042ebd5668420c8b29d2ec2791e2c8aa0d7784d8a6283f958fe581e0be129c61b0121037435c194e9b01b3d7f7a2802d6684a3af68d05bbf4ec8f17021980d777691f1dfdffffff040000000000000000536a4c5058365b13588072c8b4eca88a505db5c453123c5c91db98d90ac1cd124402dba596531ebf945361dbdbcb0a43e8d6984ab8eee14982d0341eab198fc74d2d917c6d95dc001e21c20008001e1fc2001d0210270000000000001976a914c70e1ca5a5ef633fe5464821ca421c173997f38888ac10270000000000001976a9146c575e9f31715b180b22738136895876ade678cb88ac752f7c5c000000001976a914ba27f99e007c7f605a8305e318c1abde3cd220ac88ac00000000",
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
    assertEquals(block.height, 3);
    assertEquals(block.receipts[0].result, "(ok true)");
    console.log(block.receipts[2].result);

    console.log(block.receipts);
  },
});

Clarinet.test({
  // values taken from
  // https://bitcoindev.network/calculating-the-merkle-root-for-a-block/
  name: "Ensure that valid merkle proofs are validated",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    let wallet_1 = accounts.get("wallet_1")!;
    let block0 = chain.mineBlock([
      Tx.contractCall(
        "clarity-bitcoin",
        "parse-tx",
        [
          "0x0100000001e0ab338925de317b85f66fb9577dc6691d45d4feb8431a7ebe9cf0079f64f6e1030000006a4730440220332f0e779e4e81eba10a3504dd7863ea8f34117fe5253002a476f524adfa20da022061d59f360e26079ee176c1c452d4efa393299322afa4beff6f3e4529899021090121024def55a43263dc230a618197c3d42124844f208d9504ce01b4d96e317cbd0794fdffffff040000000000000000536a4c5058325b643409e234af5c9d7b3a56d9561c2dd8d1c2452b304550280c33916a3a272f1cc2635b929837911bd8eefad4f5055b0654efebb8fce4dc09b9e8b8af68a0cb2a000a67a50298000a660e009b04a3c705000000000017a91413effebe0ea4bb45e35694f5a15bb5b96e851afb87a3c70500000000001976a914f4d9fbd8d79ee18aa14910440d1c7484587480f888acdaa80601000000001976a914e42d9f39b32df790d11828e4d4d3794223beb10f88ac00000000",
        ],
        wallet_1.address
      ),
    ]);
    const stackerOut = (
      block0.receipts[0].result.expectOk().expectTuple() as any
    ).outs
      .expectList()[1]
      .expectTuple();

    assertEquals(
      stackerOut.scriptPubKey,
      "0xa91413effebe0ea4bb45e35694f5a15bb5b96e851afb87"
    );
    stackerOut.value.expectUint(378787);
  },
});
