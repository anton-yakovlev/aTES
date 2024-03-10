const protobuf = require('protobufjs');
let AccountProtobufType;
const { isValidEvent } = require('../schemas_packages/registry');

// Database imports
const pgPool = require("./db/pgWrapper.js");
const userDB = require("./db/userDB.js")(pgPool);
const taskDB = require("./db/taskDB.js")(pgPool);

// Express
const express = require("express");
const app = express();

// Auth and routes
const userService = require("./userService.js")(userDB);
const taskService = require("./taskService.js")(taskDB, userDB);
const routes = require("./routes.js")(express.Router(), taskService);

// Kafka
const { Kafka } = require('kafkajs')

const kafka = new Kafka({
  clientId: 'popug-auth',
  brokers: ['localhost:9092'],
})

const consumerAccountsStream = kafka.consumer({ groupId: 'tasks-stream-group' });
const consumerAccounts = kafka.consumer({ groupId: 'tasks-group' });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(routes);

const port = 3001;

app.listen(port, async () => {
  console.log(`Task tracker. Listening on port ${port}`);

  protobuf.load('src/schemas_packages/popug.proto').then((root) => {
    AccountProtobufType = root.lookupType('popug_package.Account');
  });

  await consumerAccountsStream.connect();
  await consumerAccounts.connect();

  await consumerAccountsStream.subscribe({ topic: 'accounts-stream', fromBeginning: true })
  await consumerAccounts.subscribe({ topic: 'accounts', fromBeginning: true })

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
      } catch {
        
        console.log('Error. Can not decode event');
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
});