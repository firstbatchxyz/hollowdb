/** `hash` and `txid` joined with a separator dot. */
export type HTXValueType = `${string}.${string}`;

export type PutHTXInput = {
  function: 'put';
  value: {
    key: string;
    value: HTXValueType;
  };
};

export type RemoveHTXInput = {
  function: 'remove';
  value: {
    key: string;
    proof: object;
  };
};

export type UpdateHTXInput = {
  function: 'update';
  value: {
    key: string;
    value: HTXValueType;
    proof: object;
  };
};
