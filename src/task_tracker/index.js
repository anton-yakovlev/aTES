const protobuf = require('protobufjs');
let AccountProtobufType;

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

const consumerAccountsStream = kafka.consumer({ groupId: 'accounts-stream-group' });
const consumerAccounts = kafka.consumer({ groupId: 'accounts-group' });

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

      const decodedEvent = AccountProtobufType.decode(message.value);

      if (decodedEvent.eventName === 'AccountCreated') {
        const { publicId, position } = decodedEvent.data;
        userService.registerUser(publicId, position, () => {});
      }

      if (decodedEvent.eventName === 'AccountDeleted') {
        const { publicId } = decodedEvent.data;
        userService.deleteUser(publicId, () => {});
      }

      if (decodedEvent.eventName === 'AccountUpdated') {
        const {publicId, position} = decodedEvent.data;
        userService.updateUser(publicId, position, () => {});
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