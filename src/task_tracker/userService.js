let userDB;

module.exports = (injectedUserDB) => {
  userDB = injectedUserDB;

  return {
    registerUser,
    deleteUser,
    updateUser
  };
};

function registerUser(public_id, position) {
  userDB.registerUser(public_id, position);
}

function deleteUser(public_id) {
  userDB.deleteUser(public_id);
};

function updateUser(public_id, position) {
  userDB.updateUser(public_id, position);
};