let userDB;

module.exports = (injectedUserDB) => {
  userDB = injectedUserDB;

  return {
    registerUser,
    deleteUser,
    updateUser
  };
};

function registerUser(public_id, position, cbFunc) {
  userDB.registerUser(public_id, position, cbFunc);
}

function deleteUser(public_id, cbFunc) {
  userDB.deleteUser(public_id, cbFunc);
};

function updateUser(public_id, position, cbFunc) {
  userDB.updateUser(public_id, position, cbFunc);
};