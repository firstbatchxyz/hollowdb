
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
    if (verificationKey === null) {
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
  var safeGet = async (key) => {
    const val = await SmartWeave.kv.get(key);
    if (val === null) {
      throw KeyNotExistsError;
    }
    return val;
  };
  function assertOwner(state, caller) {
    if (caller !== state.owner) {
      throw NotOwnerError;
    }
  }
  function assertWhitelist(state, caller, list) {
    if (state.isWhitelistRequired[list] && !state.whitelists[list][caller]) {
      throw NotWhitelistedError;
    }
  }
  async function verifyAuthProof(state, proof, oldValue, newValue, key) {
    if (!state.isProofRequired.auth)
      return;
    if (!proof) {
      throw ExpectedProofError;
    }
    const verificationSuccess = await verifyProof(
      proof,
      [hashToGroup(oldValue), hashToGroup(newValue), BigInt(key)],
      state.verificationKeys.auth
    );
    if (!verificationSuccess) {
      throw InvalidProofError;
    }
  }

  // src/contracts/functions/crud.ts
  async function get(_, { key }) {
    return {
      result: await SmartWeave.kv.get(key)
    };
  }
  async function put(state, { key, value }, caller) {
    assertWhitelist(state, caller, "put");
    if (value === null) {
      throw NullValueError;
    }
    if (await SmartWeave.kv.get(key) !== null) {
      throw KeyExistsError;
    }
    await SmartWeave.kv.put(key, value);
    return { state };
  }
  async function remove(state, { key, proof }, caller) {
    assertWhitelist(state, caller, "update");
    const dbValue = await safeGet(key);
    await verifyAuthProof(state, proof, dbValue, null, key);
    await SmartWeave.kv.del(key);
    return { state };
  }
  async function update(state, { key, value, proof }, caller) {
    assertWhitelist(state, caller, "update");
    if (value === null) {
      throw NullValueError;
    }
    const dbValue = await safeGet(key);
    await verifyAuthProof(state, proof, dbValue, value, key);
    await SmartWeave.kv.put(key, value);
    return { state };
  }

  // src/contracts/functions/state.ts
  async function evolve(state, srcTxId, caller) {
    assertOwner(state, caller);
    if (!state.canEvolve) {
      throw CantEvolveError;
    }
    state.evolve = srcTxId;
    return { state };
  }
  async function getKeys(_, { options }) {
    return {
      result: await SmartWeave.kv.keys(options)
    };
  }
  async function getKVMap(_, { options }) {
    return {
      result: await SmartWeave.kv.kvMap(options)
    };
  }
  async function updateOwner(state, { newOwner }, caller) {
    assertOwner(state, caller);
    state.owner = newOwner;
    return { state };
  }
  async function updateRequirement(state, { name, type, value }, caller) {
    assertOwner(state, caller);
    if (type === "proof") {
      state.isProofRequired[name] = value;
    } else if (type === "whitelist") {
      state.isWhitelistRequired[name] = value;
    }
    return { state };
  }
  async function updateVerificationKey(state, { name, verificationKey }, caller) {
    assertOwner(state, caller);
    state.verificationKeys[name] = verificationKey;
    return { state };
  }
  async function updateWhitelist(state, { add, remove: remove2, name }, caller) {
    assertOwner(state, caller);
    add.forEach((user) => {
      state.whitelists[name][user] = true;
    });
    remove2.forEach((user) => {
      delete state.whitelists[name][user];
    });
    return { state };
  }

  // src/contracts/hollowdb.ts
  var handle = (state, action) => {
    const { caller, input } = action;
    switch (input.function) {
      case "get":
        return get(state, input.value);
      case "getKeys":
        return getKeys(state, input.value);
      case "getKVMap":
        return getKVMap(state, input.value);
      case "put":
        return put(state, input.value, caller);
      case "update":
        return update(state, input.value, caller);
      case "remove":
        return remove(state, input.value, caller);
      case "updateOwner":
        return updateOwner(state, input.value, caller);
      case "updateRequirement":
        return updateRequirement(state, input.value, caller);
      case "updateVerificationKey":
        return updateVerificationKey(state, input.value, caller);
      case "updateWhitelist":
        return updateWhitelist(state, input.value, caller);
      case "evolve":
        return evolve(state, input.value, caller);
      default:
        throw InvalidFunctionError;
    }
  };

