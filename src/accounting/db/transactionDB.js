let pgPool;

module.exports = (injectedPgPool) => {
  pgPool = injectedPgPool;

  return {
    createAssignTransaction,
    createCloseTransaction,
  };
};

console.log(pgPool);

function createAssignTransaction(publicId, assignedPublicAccountId, cost, cbFunc) {
  const query = `INSERT INTO transactions (public_id, assigned_public_account_id, amount, type) VALUES ('${publicId}', '${assignedPublicAccountId}', '${cost}', 'assign') RETURNING *`;
  pgPool.query(query, cbFunc);
}

function createCloseTransaction(publicId, closedPublicAccountId, cost, cbFunc) {
  const query = `INSERT INTO transactions (public_id, closed_public_account_id, amount, type) VALUES ('${publicId}', '${closedPublicAccountId}', '${cost}', 'close') RETURNING *`;
  pgPool.query(query, cbFunc);
}