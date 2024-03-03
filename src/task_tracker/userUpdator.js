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
  userDB.registerUser(public_id, position, (result) => {
    console.log('registerUser result', result);
  });
}

function deleteUser(public_id) {
  userDB.deleteUser(public_id, (result) => {
    console.log('deleteUser result', result);
  })
};

function updateUser(public_id, position) {
  userDB.updateUser(public_id, position, (result) => {
    console.log('updateUser result', result);
  });
};