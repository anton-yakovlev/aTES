let pgPool;

module.exports = (injectedPgPool) => {
  pgPool = injectedPgPool;

  return {
    registerUser,
    updateUser,
    deleteUser,
    getUserByPublicId,
    getAllEmployees,
  };
};

console.log(pgPool);

function registerUser(public_id, position, cbFunc) {
  const query = `INSERT INTO users (public_id, position) VALUES ('${public_id}', '${position}') RETURNING *`;
  pgPool.query(query, cbFunc);
}

function updateUser(public_id, position, cbFunc) {
  const query = `UPDATE users SET position = '${position}' WHERE public_id = '${public_id}' RETURNING *`;
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

function getAllEmployees(cbFunc) {
  const getUserQuery = `SELECT * FROM users WHERE position = 'employee'`;
  pgPool.query(getUserQuery, (response) => {
    cbFunc(response);
  });
}