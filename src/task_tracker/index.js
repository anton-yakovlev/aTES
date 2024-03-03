// Database imports
const pgPool = require("./db/pgWrapper.js");
const userDB = require("./db/userDB.js")(pgPool);

// Express
const express = require("express");
const app = express();

// Auth and routes
const userUpdator = require("./userUpdator.js")(userDB);
const routes = require("./routes.js")(express.Router(), app, userUpdator);

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
app.use("/task-tracker", routes);

const port = 3001;

app.listen(port, async () => {
  console.log(`Task tracker. Listening on port ${port}`);

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

      const messageObj = JSON.parse(message.value);

      if (messageObj.eventName === 'AccountCreated') {
        const {public_id, position} = messageObj.data;

        userUpdator.registerUser(public_id, position);
      }

      if (messageObj.eventName === 'AccountDeleted') {
        userUpdator.deleteUser(messageObj.data.public_id);
      }

      if (messageObj.eventName === 'AccountUpdated') {
        const {public_id, position} = messageObj.data;

        userUpdator.updateUser(public_id, position);
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