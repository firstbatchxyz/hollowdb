
  // src/contracts/errors/index.ts
  var KeyExistsError = new ContractError("Key already exists.");
  var KeyNotExistsError = new ContractError("Key does not exist.");
  var CantEvolveError = new ContractError("Evolving is disabled.");
  var NoVerificationKeyError = new ContractError("No verification key.");
  var UnknownProtocolError = new ContractError("Unknown protocol.");
  var NotWhitelistedError = new ContractError("Not whitelisted.");
  var InvalidProofError = new ContractError("Invalid proof.");
  var ExpectedProofError = new ContractError("Expected a proof.");
  var NullValueError = new ContractError("Value cant be null, use remove instead.");
  var NotOwnerError = new ContractError("Not contract owner.");
  var InvalidFunctionError = new ContractError("Invalid function.");

  // src/contracts/utils/index.ts
  var verifyProof = async (proof, psignals, verificationKey) => {
    if (!verificationKey) {
      throw NoVerificationKeyError;
    }
    if (verificationKey.protocol !== "groth16" && verificationKey.protocol !== "plonk") {
      throw UnknownProtocolError;
    }
    return await SmartWeave.extensions[verificationKey.protocol].verify(verificationKey, psignals, proof);
  };
  var hashToGroup = (value) => {
    if (value) {
      return BigInt(SmartWeave.extensions.ethers.utils.ripemd160(Buffer.from(JSON.stringify(value))));
    } else {
      return BigInt(0);
    }
  };

  // src/contracts/modifiers/index.ts
  var onlyOwner = (caller, input, state) => {
    if (caller !== state.owner) {
      throw NotOwnerError;
    }
    return input;
  };
  var onlyNonNullValue = (_, input) => {
    if (input.value === null) {
      throw NullValueError;
    }
    return input;
  };
  var onlyWhitelisted = (list) => {
    return (caller, input, state) => {
      if (!state.isWhitelistRequired[list]) {
        return input;
      }
      if (!state.whitelists[list][caller]) {
        throw NotWhitelistedError;
      }
      return input;
    };
  };
  var onlyProofVerified = (proofName, prepareInputs) => {
    return async (caller, input, state) => {
      if (!state.isProofRequired[proofName]) {
        return input;
      }
      if (!input.proof) {
        throw ExpectedProofError;
      }
      const ok = await verifyProof(
        input.proof,
        await prepareInputs(caller, input, state),
        state.verificationKeys[proofName]
      );
      if (!ok) {
        throw InvalidProofError;
      }
      return input;
    };
  };
  async function apply(caller, input, state, ...modifiers) {
    for (const modifier of modifiers) {
      input = await modifier(caller, input, state);
    }
    return input;
  }

  // src/contracts/hollowdb.contract.ts
  var handle = async (state, action) => {
    const { caller, input } = action;
    switch (input.function) {
      case "get": {
        const { key } = await apply(caller, input.value, state);
        return { result: await SmartWeave.kv.get(key) };
      }
      case "getKeys": {
        const { options } = await apply(caller, input.value, state);
        return { result: await SmartWeave.kv.keys(options) };
      }
      case "getKVMap": {
        const { options } = await apply(caller, input.value, state);
        return { result: await SmartWeave.kv.kvMap(options) };
      }
      case "put": {
        const { key, value } = await apply(caller, input.value, state, onlyNonNullValue, onlyWhitelisted("put"));
        if (await SmartWeave.kv.get(key) !== null) {
          throw KeyExistsError;
        }
        await SmartWeave.kv.put(key, value);
        return { state };
      }
      case "update": {
        const { key, value } = await apply(
          caller,
          input.value,
          state,
          onlyNonNullValue,
          onlyWhitelisted("update"),
          onlyProofVerified("auth", async (_, input2) => {
            const oldValue = await SmartWeave.kv.get(input2.key);
            return [hashToGroup(oldValue), hashToGroup(input2.value), BigInt(input2.key)];
          })
        );
        await SmartWeave.kv.put(key, value);
        return { state };
      }
      case "remove": {
        const { key } = await apply(
          caller,
          input.value,
          state,
          onlyWhitelisted("update"),
          onlyProofVerified("auth", async (_, input2) => {
            const oldValue = await SmartWeave.kv.get(input2.key);
            return [hashToGroup(oldValue), BigInt(0), BigInt(input2.key)];
          })
        );
        await SmartWeave.kv.del(key);
        return { state };
      }
      case "updateOwner": {
        const { newOwner } = await apply(caller, input.value, state, onlyOwner);
        state.owner = newOwner;
        return { state };
      }
      case "updateProofRequirement": {
        const { name, value } = await apply(caller, input.value, state, onlyOwner);
        state.isProofRequired[name] = value;
        return { state };
      }
      case "updateVerificationKey": {
        const { name, verificationKey } = await apply(caller, input.value, state, onlyOwner);
        state.verificationKeys[name] = verificationKey;
        return { state };
      }
      case "updateWhitelistRequirement": {
        const { name, value } = await apply(caller, input.value, state, onlyOwner);
        state.isWhitelistRequired[name] = value;
        return { state };
      }
      case "updateWhitelist": {
        const { add, remove, name } = await apply(caller, input.value, state, onlyOwner);
        add.forEach((user) => {
          state.whitelists[name][user] = true;
        });
        remove.forEach((user) => {
          delete state.whitelists[name][user];
        });
        return { state };
      }
      case "evolve": {
        const srcTxId = await apply(caller, input.value, state, onlyOwner);
        if (!state.canEvolve) {
          throw CantEvolveError;
        }
        state.evolve = srcTxId;
        return { state };
      }
      default:
        input;
        throw InvalidFunctionError;
    }
  };

