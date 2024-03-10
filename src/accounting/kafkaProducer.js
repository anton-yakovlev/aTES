const { Kafka } = require('kafkajs');
const protobuf = require('protobufjs');

const kafka = new Kafka({
  clientId: 'popug-tasks',
  brokers: ['localhost:9092'],
})

const producer = kafka.producer()

async function call ({topic, event}) {
  const rootProtobuf = await protobuf.load('src/schemas_packages/popug.proto');
  const TransactionProtobufType = rootProtobuf.lookupType('popug_package.Transaction');

  const bufferedEvent = TransactionProtobufType.create(event);
  const encodedEvent = TransactionProtobufType.encode(bufferedEvent).finish();

  await producer.connect()
  await producer.send({
    topic: topic,
    messages: [
      { value: encodedEvent },
    ],
  })
  await producer.disconnect()
}

module.exports = {
  call
};
