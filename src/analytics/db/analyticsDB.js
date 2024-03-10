let pgPool;

module.exports = (injectedPgPool) => {
  pgPool = injectedPgPool;

  return {
    addClosedTransaction,
    // closeTask,
    // assignTask,
    // getAllOpenedTasks,
  };
};

console.log(pgPool);

function addClosedTransaction(publicId, amount, date, cbFunc) {
  const query = `INSERT INTO closed_transactions (transaction_public_id, amount, date) VALUES ('${publicId}', '${amount}', ${date}) RETURNING *`;
  pgPool.query(query, cbFunc);
}

// function closeTask(task_id, closed_public_account_id, cbFunc) {  
//   const query = `UPDATE tasks SET closed_public_account_id = '${closed_public_account_id}', status = 'closed' WHERE id = ${task_id} RETURNING *`;
//   pgPool.query(query, cbFunc);
// }

// function assignTask(task_id, assigned_public_account_id, cbFunc) {  
//   const query = `UPDATE tasks SET assigned_public_account_id = '${assigned_public_account_id}' WHERE id = ${task_id} RETURNING *`;
//   pgPool.query(query, cbFunc);
// }

// function getAllOpenedTasks(cbFunc) {  
//   const query = `SELECT * FROM tasks WHERE status = 'opened'`;
//   pgPool.query(query, cbFunc);
// }