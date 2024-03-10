const protobuf = require('protobufjs');
let AccountProtobufType;
let TaskProtobufType;
const { isValidEvent } = require('../schemas_packages/registry.js');

// Database imports
const pgPool = require("./db/pgWrapper.js");
const userDB = require("./db/userDB.js")(pgPool);
const taskDB = require("./db/taskDB.js")(pgPool);
const transactionDB = require("./db/transactionDB.js")(pgPool);

// Express
const express = require("express");
const app = express();

// Auth and routes
const userService = require("./userService.js")(userDB);
const taskService = require("./taskService.js")(taskDB, userDB);
const accountingService = require("./accountingService.js")(transactionDB, userDB, taskDB);

// Kafka
const { Kafka } = require('kafkajs')

const kafka = new Kafka({
  clientId: 'popug-auth',
  brokers: ['localhost:9092'],
})

const consumerAccountsStream = kafka.consumer({ groupId: 'accounting-stream-group-accounts-2' });
const consumerAccounts = kafka.consumer({ groupId: 'accounting-group-accounts-2' });
const consumerTasksStream = kafka.consumer({ groupId: 'accounting-stream-group-tasks-1' });
const consumerTasks = kafka.consumer({ groupId: 'accounting-group-tasks-1' });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const port = 3002;

app.listen(port, async () => {
  console.log(`Task tracker. Listening on port ${port}`);

  protobuf.load('src/schemas_packages/popug.proto').then((root) => {
    AccountProtobufType = root.lookupType('popug_package.Account');
    TaskProtobufType = root.lookupType('popug_package.Task');
  });

  // Accounts
  await consumerAccountsStream.connect();
  await consumerAccounts.connect();

  await consumerAccountsStream.subscribe({ topic: 'accounts-stream', fromBeginning: true })
  await consumerAccounts.subscribe({ topic: 'accounts', fromBeginning: true })

  // Tasks
  await consumerTasksStream.connect();
  await consumerTasks.connect();

  await consumerTasksStream.subscribe({ topic: 'tasks-stream', fromBeginning: true })
  await consumerTasks.subscribe({ topic: 'tasks', fromBeginning: true })

  await consumerAccountsStream.run({
    eachMessage: async ({ topic, partition, message }) => {
      console.log({
        topic,
        partition,
        value: message.value.toString(),
      });

      try {
        const decodedEvent = AccountProtobufType.decode(message.value);

        if (decodedEvent.eventId === 'ACCOUNT_CREATED') {
          if (!isValidEvent(decodedEvent)) {
            console.error(`Event ${decodedEvent.eventId} is not Valid`);
            return;
          }

          const { publicId, position } = decodedEvent.data;
          userService.registerUser(publicId, position, () => {});
        }

        if (decodedEvent.eventId === 'ACCOUNT_DELETED') {
          if (!isValidEvent(decodedEvent)) {
            console.error(`Event ${decodedEvent.eventId} is not Valid`);
            return;
          }

          const { publicId } = decodedEvent.data;
          userService.deleteUser(publicId, () => {});
        }

        if (decodedEvent.eventId === 'ACCOUNT_UPDATED') {
          if (!isValidEvent(decodedEvent)) {
            console.error(`Event ${decodedEvent.eventId} is not Valid`);
            return;
          }
          
          const {publicId, position} = decodedEvent.data;
          userService.updateUser(publicId, position, () => {});
        }
      } catch (error) {      
        console.log('Error. Unexpected error', error);
        // -------------------- Produce CUD event -------------------- //

        // In case of error sent CUD event to special topic with errors.
        
        // -------------------- End of CUD Produce event -------------------- //
        return;
      }
    },
  });
  
  await consumerAccounts.run({
    eachMessage: async ({ topic, partition, message }) => {
      console.log({
        topic,
        partition,
        value: message.value.toString(),
      })
    },
  });

  await consumerTasksStream.run({
    eachMessage: async ({ topic, partition, message }) => {
      console.log({
        topic,
        partition,
        value: message.value.toString(),
      });

      try {
        const decodedEvent = TaskProtobufType.decode(message.value);

        if (decodedEvent.eventId === 'TASK_CREATED') {
          if (!isValidEvent(decodedEvent)) {
            console.error(`Event ${decodedEvent.eventId} is not Valid`);
            return;
          }

          if (decodedEvent.eventVersion === 1) {
            const { publicId, description, assignedPublicAccountId } = decodedEvent.data;

            taskService.createTask(publicId, description, assignedPublicAccountId, () => {
              accountingService.createAssignTransaction(publicId, assignedPublicAccountId, () => {});
            });
          }

          if (decodedEvent.eventVersion === 2) {
            const { publicId, title, jiraId, assignedPublicAccountId } = decodedEvent.data;

            taskService.createTaskV2(publicId, title, jiraId, assignedPublicAccountId, () => {
              accountingService.createAssignTransaction(publicId, assignedPublicAccountId, () => {});
            });
          }
        }
      } catch (error) {      
        console.log('Error. Unexpected error', error);
        // -------------------- Produce CUD event -------------------- //

        // In case of error sent CUD event to special topic with errors.
        
        // -------------------- End of CUD Produce event -------------------- //
        return;
      }
    },
  });

  await consumerTasks.run({
    eachMessage: async ({ topic, partition, message }) => {
      console.log({
        topic,
        partition,
        value: message.value.toString(),
      });

      try {
        const decodedEvent = TaskProtobufType.decode(message.value);

        if (decodedEvent.eventId === 'TASK_ASSIGNED') {
          if (!isValidEvent(decodedEvent)) {
            console.error(`Event ${decodedEvent.eventId} is not Valid`);
            return;
          }

          const { publicId, assignedPublicAccountId } = decodedEvent.data;
          accountingService.createAssignTransaction(publicId, assignedPublicAccountId, () => {});
        }

        if (decodedEvent.eventId === 'TASK_CLOSED') {
          if (!isValidEvent(decodedEvent)) {
            console.error(`Event ${decodedEvent.eventId} is not Valid`);
            return;
          }

          const { publicId, closedPublicAccountId } = decodedEvent.data;
          accountingService.createCloseTransaction(publicId, closedPublicAccountId, () => {});
        }
      } catch (error) { 

        console.log('Error. Unexpected error', error);
        // -------------------- Produce CUD event -------------------- //

        // In case of error sent CUD event to special topic with errors.
        
        // -------------------- End of CUD Produce event -------------------- //
        return;
      }
    },
  });
  
});