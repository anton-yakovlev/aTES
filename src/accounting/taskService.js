let taskDB;

module.exports = (injectedUserDB) => {
  taskDB = injectedUserDB;

  return {
    createTask,
    createTaskV2,
  };
};

function createTask(publicId, description, assignedPublicAccountId, cbFunc) {
  const min = 10;
  const max = 20;
  const cost = Math.floor(Math.random() * (max - min + 1) + min);
  taskDB.createTask(publicId, description, assignedPublicAccountId, cost, cbFunc);
}

function createTaskV2(publicId, title, jiraId, assignedPublicAccountId, cbFunc) {
  const min = 10;
  const max = 20;
  const cost = Math.floor(Math.random() * (max - min + 1) + min);
  taskDB.createTaskV2(publicId, title, jiraId, assignedPublicAccountId, cost, cbFunc);
}