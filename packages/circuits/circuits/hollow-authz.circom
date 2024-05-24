pragma circom 2.0.0;

include "circomlib/circuits/poseidon.circom";

/**
 * Hollow Authorization
 * 
 * This circuit creates a pre-image knowledge proof that is bound to two values. In the context of
 * a key-value database update operation, the first value is the hash of current value in the DB, and
 * the next value is the hash of new value to be written to DB. The digest is the key for this operation.
 * 
 * @param preimage a preimage for Poseidon hash
 * @param curValueHash a number from hash-to-group that will bind to this proof
 * @param nextValueHash a number from hash-to-group that will bind to this proof
 */
template HollowAuthz() {
  signal input preimage;
  signal input curValueHash;
  signal input nextValueHash;

  // will be provided during verification
  signal output curValueHashOut;
  signal output nextValueHashOut;

  // output key digest via poseidon
  signal output digest;

  // constraints on value hashes
  curValueHashOut <== curValueHash; 
  nextValueHashOut <== nextValueHash;

  // contraints on preimage
  component h = Poseidon(1);
  h.inputs[0] <== preimage;
  digest <== h.out;
}
