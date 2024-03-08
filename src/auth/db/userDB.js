let pgPool;

module.exports = (injectedPgPool) => {
  pgPool = injectedPgPool;

  return {
    register,
    getUser,
    isValidUser,
    changeUser,
    deleteUser,
    getUserById
  };
};

console.log(pgPool);

var crypto = require("crypto");

function register(email, password, cbFunc) {
  var shaPass = crypto.createHash("sha256").update(password).digest("hex");
  const query = `INSERT INTO users (email, user_password) VALUES ('${email}', '${shaPass}') RETURNING *`;
  pgPool.query(query, cbFunc);
}

function changeUser(userId, email, fullname, position, active, cbFunc) {
  const query = `UPDATE users SET position = '${position}', email = '${email}', fullname = '${fullname}', active = '${active}' WHERE id = ${userId} RETURNING *`;
  pgPool.query(query, cbFunc);
}

function deleteUser(userId, cbFunc) {
  const query = `DELETE from users WHERE id = ${userId} RETURNING *`;
  pgPool.query(query, cbFunc);
}

function getUser(email, password, cbFunc) {
  var shaPass = crypto.createHash("sha256").update(password).digest("hex");
  const getUserQuery = `SELECT * FROM users WHERE email = '${email}' AND user_password = '${shaPass}'`;
  pgPool.query(getUserQuery, (response) => {
    cbFunc(
      false,
      response.results && response.results.rowCount === 1
        ? response.results.rows[0]
        : null
    );
  });
}

function getUserById(id, cbFunc) {
  const getUserQuery = `SELECT * FROM users WHERE id = '${id}'`;
  pgPool.query(getUserQuery, (response) => {
    cbFunc(response);
  });
}

function isValidUser(email, cbFunc) {
  const query = `SELECT * FROM users WHERE email = '${email}'`;
  console.log("hi");
  const checkUsrcbFunc = (response) => {
    const isValidUser = response.results
      ? !(response.results.rowCount > 0)
      : null;

    console.log(isValidUser);

    cbFunc(response.error, isValidUser);
  };

  pgPool.query(query, checkUsrcbFunc);
}