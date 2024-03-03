let pgPool;

module.exports = (injectedPgPool) => {
  pgPool = injectedPgPool;

  return {
    registerUser,
    updateUser,
    deleteUser,
  };
};

console.log(pgPool);

function registerUser(public_id, position, cbFunc) {
  const query = `INSERT INTO users (public_id, position) VALUES ('${public_id}', '${position}') RETURNING *`;
  pgPool.query(query, cbFunc);
}

function updateUser(public_id, position, cbFunc) {
  const query = `UPDATE users SET position = '${position}' WHERE public_id = ${public_id} RETURNING *`;
  pgPool.query(query, cbFunc);
}

function deleteUser(userId, cbFunc) {
  const query = `DELETE from users WHERE id = ${userId} RETURNING *`;
  pgPool.query(query, cbFunc);
}