const dummyContractSource = `
// contracts/hollowDB/actions/read/get.ts
var get = async (state, action) => {
  const {key} = action.input.data;
  return {
    result: await SmartWeave.kv.get(key),
  };
};

// contracts/hollowDB/contract.ts
var handle = (state, action) => {
  switch (action.input.function) {
    case 'get':
      return get(state, action);
    default:
      throw new ContractError('Unknown function: ' + action.input.function);
  }
};
` as string;

export default dummyContractSource;
