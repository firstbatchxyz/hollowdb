const constants = {
  /** Default options for limiting cache usage per key */
  DEFAULT_LIMIT_OPTS: {
    lmdb: {
      minEntriesPerContract: 10,
      maxEntriesPerContract: 100,
    },
    redis: {
      minEntriesPerContract: 10,
      maxEntriesPerContract: 100,
    },
  },
};

export default constants as Readonly<typeof constants>;
