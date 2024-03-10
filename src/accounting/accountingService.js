let taskDB;
let userDB;
let transactionDB;
const producer = require('./kafkaProducer');

module.exports = (injectedTransactionDB, injectedUserDB, injectedTaskDB) => {
  transactionDB = injectedTransactionDB;
  userDB = injectedUserDB;
  taskDB = injectedTaskDB;

  return {
    createAssignTransaction,
    createCloseTransaction,
  };
};

function createAssignTransaction(publicId, assignedPublicAccountId, cbFunc) {
   taskDB.getTaskByPublicId(publicId, (result) => {

    console.log('getTaskByPublicId OK!');

    if (!result.results || !result.results.rows || !result.results.rows.length) {
      console.log(`getTaskByPublicId Error. No task ${publicId}`);
      return;
    }

    const taskCost =  result.results.rows[0].cost;

    console.log('taskCost', taskCost);
    
    // Create transaction in DB
    transactionDB.createAssignTransaction(publicId, assignedPublicAccountId, taskCost, (transactionResult) => {

      console.log('createAssignTransaction OK!');

      userDB.getUserByPublicId(assignedPublicAccountId, (userResult) => {

        console.log('getUserByPublicId OK!');

        if (!userResult.results || !userResult.results.rows || !userResult.results.rows.length) {
          console.log(`getUserByPublicId Error. No account ${assignedPublicAccountId}`);
          return;
        }

        const currentBalance = userResult.results.rows[0].balance;
        const newBalance = currentBalance - taskCost;

        console.log('currentBalance', currentBalance);
        console.log('newBalance', newBalance);
      
        // Charge user account
        userDB.updateUserBalance(assignedPublicAccountId, newBalance, () => {
          
          console.log('updateUserBalance OK!');

          // Pay to BOSS
          userDB.getBoss((bossResult) => {
            console.log('getBoss OK!');

            if (!bossResult.results || !bossResult.results.rows || !bossResult.results.rows.length) {
              console.log(`bossResult Error. No BOSS found`);
              return;
            }

            const currentBossBalance = bossResult.results.rows[0].balance;
            const newBossBalance = currentBossBalance + taskCost;

            console.log('currentBossBalance', currentBossBalance);
            console.log('newBossBalance', newBossBalance);

            userDB.updateBossBalance(newBossBalance, (bossBalanceResult) => {
              console.log('updateBossBalance OK!');

              // -------------------- Produce CUD event -------------------- //
              const cud_event = {
                eventName: 'assignTransactionCreated',
                eventId: 'ASSIGN_TRANSACTION_CREATED',
                eventVersion: 1,
                eventTime: Date.now().toString(),
                eventProducer: 'ACCOUNTING_SERVICE',
                data: {
                  publicId: transactionResult.results.rows[0].public_id,
                  amount: transactionResult.results.rows[0].amount,
                }
              }

              console.log({ event: JSON.stringify(cud_event), topic: 'accounting-stream' });

              producer.call({ event: cud_event, topic: 'accounting-stream'});
              // -------------------- End of CUD Produce event -------------------- //

              cbFunc();
            });
          });
        });
      });
    });
  });
};

function createCloseTransaction(publicId, closedPublicAccountId, cbFunc) {
  taskDB.getTaskByPublicId(publicId, (result) => {

    console.log('getTaskByPublicId OK!');

    if (!result.results.rows || !result.results.rows.length) {
      console.log(`getTaskByPublicId Error. No task ${publicId}`);
      return;
    }

    const taskCost =  result.results.rows[0].cost;

    console.log('taskCost', taskCost);

    userDB.getUserByPublicId(closedPublicAccountId, (userResult) => {

      console.log('getUserByPublicId OK!');

      if (!userResult.results.rows || !userResult.results.rows.length ) {
        console.log(`getUserByPublicId Error. No account ${closedPublicAccountId}`);
        return;
      }

      const currentBalance = userResult.results.rows[0].balance;

      const min = 20;
      const max = 40;
      const taskClosePrice = Math.floor(Math.random() * (max - min + 1) + min);

      const newBalance = currentBalance + taskClosePrice;

      console.log('currentBalance', currentBalance);
      console.log('newBalance', newBalance);

      // Create transaction in DB
      transactionDB.createCloseTransaction(publicId, closedPublicAccountId, taskClosePrice, (transactionResult) => {

        console.log('createCloseTransaction OK!');
      
        // Charge user account
        userDB.updateUserBalance(closedPublicAccountId, newBalance, () => {
          
          console.log('updateUserBalance OK!');

          // Charge BOSS
          userDB.getBoss((bossResult) => {
            console.log('getBoss OK!');

            const currentBossBalance = bossResult.results.rows[0].balance;
            const newBossBalance = currentBossBalance - taskClosePrice;

            console.log('currentBossBalance', currentBossBalance);
            console.log('newBossBalance', newBossBalance);

            userDB.updateBossBalance(newBossBalance, (bossBalanceResult) => {
              console.log('updateBossBalance OK!');

              // -------------------- Produce CUD event -------------------- //
              const cud_event = {
                eventName: 'closeTransactionCreated',
                eventId: 'CLOSE_TRANSACTION_CREATED',
                eventVersion: 1,
                eventTime: Date.now().toString(),
                eventProducer: 'ACCOUNTING_SERVICE',
                data: {
                  publicId: transactionResult.results.rows[0].public_id,
                  amount: transactionResult.results.rows[0].amount,
                }
              }

              console.log({ event: JSON.stringify(cud_event), topic: 'accounting-stream' });

              producer.call({ event: cud_event, topic: 'accounting-stream'});
              // -------------------- End of CUD Produce event -------------------- //

              cbFunc();
            });
          });
        });
      });

    });
  });
};