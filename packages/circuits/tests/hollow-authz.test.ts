import {ripemd160} from "@ethersproject/sha2";
import {randomBytes} from "crypto";
import {poseidon1} from "poseidon-lite";
import {ProofTester, WitnessTester} from "circomkit";
import {Circomkit} from "circomkit";

/**
 * Hash an arbitrary object using Ripemd160 of `ethers`.
 * @param preimage can be anything
 * @returns a BigInt representing the 160-bit hash result
 */
export function valueToBigInt<T>(preimage: T): bigint {
  return BigInt(ripemd160(Buffer.from(JSON.stringify(preimage))));
}

describe("hollowdb authorization", () => {
  const ID_COMMITMENT = valueToBigInt(randomBytes(20).toString("hex"));
  const CUR_VALUE_HASH = randomBytes(24).toString("ascii");
  const NEXT_VALUE_HASH = randomBytes(24).toString("ascii");

  const INPUT = {
    preimage: ID_COMMITMENT,
    curValueHash: valueToBigInt(CUR_VALUE_HASH),
    nextValueHash: valueToBigInt(NEXT_VALUE_HASH),
  };
  const OUTPUT = {
    digest: poseidon1([ID_COMMITMENT]),
    curValueHashOut: valueToBigInt(CUR_VALUE_HASH),
    nextValueHashOut: valueToBigInt(NEXT_VALUE_HASH),
  };

  const circomkit = new Circomkit({verbose: false, optimization: 0});

  describe("functionality", () => {
    let circuit: WitnessTester<
      ["preimage", "curValueHash", "nextValueHash"],
      ["digest", "curValueHashOut", "nextValueHashOut"]
    >;

    before(async () => {
      circuit = await circomkit.WitnessTester("hollow-authz", {
        file: "hollow-authz",
        template: "HollowAuthz",
      });
    });

    it("should pass for correct inputs", async () => {
      await circuit.expectPass(INPUT, OUTPUT);
    });

    it("should fail for wrong current value hash", async () => {
      let wtns = await circuit.calculateWitness(INPUT);
      wtns = await circuit.editWitness(wtns, {"main.curValueHashOut": 1234n});
      await circuit.expectConstraintFail(wtns);
    });

    it("should fail for wrong next value hash", async () => {
      const wtns = await circuit.calculateWitness(INPUT);
      const badWtns = await circuit.editWitness(wtns, {"main.nextValueHashOut": 1234n});
      await circuit.expectConstraintFail(badWtns);
    });
  });

  describe.skip("validation", () => {
    let fullProof: {proof: object; publicSignals: string[]};
    let circuit: ProofTester;
    before(async () => {
      circuit = await circomkit.ProofTester("hollow-authz");
      fullProof = await circuit.prove(INPUT);
    });

    it("should verify", async () => {
      await circuit.expectPass(fullProof.proof, fullProof.publicSignals);
    });

    it("should NOT verify on wrong current value hash", async () => {
      await circuit.expectFail(fullProof.proof, ["0", fullProof.publicSignals[1], fullProof.publicSignals[2]]);
    });

    it("should NOT verify on wrong next value hash", async () => {
      await circuit.expectFail(fullProof.proof, [fullProof.publicSignals[0], "0", fullProof.publicSignals[2]]);
    });

    it("should NOT verify on wrong digest", async () => {
      await circuit.expectFail(fullProof.proof, [fullProof.publicSignals[0], fullProof.publicSignals[1], "0"]);
    });
  });
});
