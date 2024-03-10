const protobuf = require('protobufjs');
let TransactionProtobufType;
const { isValidEvent } = require('../schemas_packages/registry');

// Database imports
const pgPool = require("./db/pgWrapper.js");
const analyticsDB = require("./db/analyticsDB.js")(pgPool);

// Express
const express = require("express");
const app = express();

// Kafka
const { Kafka } = require('kafkajs')

const kafka = new Kafka({
  clientId: 'popug-auth',
  brokers: ['localhost:9092'],
})

const consumerAccounting = kafka.consumer({ groupId: 'analytics-group-tasks-1' });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const port = 3003;

app.listen(port, async () => {
  console.log(`Analytics. Listening on port ${port}`);

  protobuf.load('src/schemas_packages/popug.proto').then((root) => {
    TransactionProtobufType = root.lookupType('popug_package.Transaction');
  });

  // Tasks
  await consumerAccounting.connect();
  await consumerAccounting.subscribe({ topic: 'accounting-stream', fromBeginning: true })
  
  await consumerAccounting.run({
    eachMessage: async ({ topic, partition, message }) => {
      console.log({
        topic,
        partition,
        value: message.value.toString(),
      });

      try {
        const decodedEvent = TransactionProtobufType.decode(message.value);

        if (decodedEvent.eventId === 'CLOSE_TRANSACTION_CREATED') {
          if (!isValidEvent(decodedEvent)) {
            console.error(`Event ${decodedEvent.eventId} is not Valid`);
            return;
          }

          const { publicId, amount } = decodedEvent.data;

          analyticsDB.addClosedTransaction(publicId, amount, decodedEvent.eventTime, (result) => {
            if (!result.error) {
              console.log('addClosedTransaction OK!');
              return;
            }

            console.log('addClosedTransaction Error.', result);
          });
        }
      } catch (error) {
        
        console.log('Error. Can not decode event', error);
        return;
      }
    },
  });
});