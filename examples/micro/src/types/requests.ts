type GetRequest = {
  route: "GET";
  data: {
    key: string;
  };
};

type GetManyRequest = {
  route: "GET_MANY";
  data: {
    keys: string[];
  };
};

type PutRequest<V> = {
  route: "PUT";
  data: {
    key: string;
    value: V;
  };
};

type PutManyRequest<V> = {
  route: "PUT_MANY";
  data: {
    keys: string[];
    values: V[];
  };
};

type UpdateRequest<V> = {
  route: "UPDATE";
  data: {
    key: string;
    value: V;
    proof: object;
  };
};

type RemoveRequest = {
  route: "REMOVE";
  data: {
    key: string;
    proof: object;
  };
};

type StateRequest = {
  route: "STATE";
  data: {};
};

export type Request<V> =
  | GetRequest
  | GetManyRequest
  | PutRequest<V>
  | PutManyRequest<V>
  | UpdateRequest<V>
  | RemoveRequest
  | StateRequest;
