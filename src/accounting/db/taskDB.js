let pgPool;

module.exports = (injectedPgPool) => {
  pgPool = injectedPgPool;

  return {
    createTask,
    getTaskByPublicId,
    createTaskV2,
  };
};

console.log(pgPool);

function createTask(publicId, description, assignedPublicAccountId, cost, cbFunc) {
  const query = `INSERT INTO tasks (public_id, description, assigned_public_account_id, cost) VALUES ('${publicId}', '${description}', '${assignedPublicAccountId}', '${cost}') RETURNING *`;
  pgPool.query(query, cbFunc);
}

function createTaskV2(publicId, title, jiraId, assignedPublicAccountId, cost, cbFunc) {
  const query = `INSERT INTO tasks (public_id, title, jira_id, assigned_public_account_id, cost) VALUES ('${publicId}', '${title}', '${jiraId}', '${assignedPublicAccountId}', '${cost}') RETURNING *`;
  pgPool.query(query, cbFunc);
}

function getTaskByPublicId(publicId, cbFunc) {
  const query = `SELECT * FROM tasks WHERE public_id = '${publicId}'`;
  pgPool.query(query, cbFunc);
}