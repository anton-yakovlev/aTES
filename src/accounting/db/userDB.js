let pgPool;
const BOSS_BD_ID = '24';

module.exports = (injectedPgPool) => {
  pgPool = injectedPgPool;

  return {
    registerUser,
    deleteUser,
    getUserByPublicId,
    updateUserBalance,
    updateUser,
    updateBossBalance,
    getBoss,
  };
};

console.log(pgPool);

function registerUser(public_id, position, cbFunc) {
  const query = `INSERT INTO users (public_id, position) VALUES ('${public_id}', '${position}') RETURNING *`;
  pgPool.query(query, cbFunc);
}

function deleteUser(public_id, cbFunc) {
  const query = `DELETE from users WHERE public_id = '${public_id}' RETURNING *`;
  pgPool.query(query, cbFunc);
}

function getUserByPublicId(public_id, cbFunc) {
  const getUserQuery = `SELECT * FROM users WHERE public_id = '${public_id}'`;
  pgPool.query(getUserQuery, (response) => {
    cbFunc(response);
  });
}

function updateUserBalance(public_id, balance, cbFunc) {
  const query = `UPDATE users SET balance = '${balance}' WHERE public_id = '${public_id}' RETURNING *`;
  pgPool.query(query, cbFunc);
}

function updateBossBalance(balance, cbFunc) {
  const query = `UPDATE users SET balance = '${balance}' WHERE id = '${BOSS_BD_ID}' RETURNING *`;
  pgPool.query(query, cbFunc);
}

function getBoss(cbFunc) {
  const getUserQuery = `SELECT * FROM users WHERE id = '${BOSS_BD_ID}'`;
  pgPool.query(getUserQuery, (response) => {
    cbFunc(response);
  });
}

function updateUser(public_id, position, cbFunc) {
  const query = `UPDATE users SET position = '${position}' WHERE public_id = '${public_id}' RETURNING *`;
  pgPool.query(query, cbFunc);
}
