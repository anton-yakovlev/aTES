const { Kafka } = require('kafkajs');
const protobuf = require('protobufjs');

const kafka = new Kafka({
  clientId: 'popug-auth',
  brokers: ['localhost:9092'],
})

const producer = kafka.producer()

async function call ({topic, event}) {
  const rootProtobuf = await protobuf.load('src/schemas_packages/popug.proto');
  const AccountProtobufType = rootProtobuf.lookupType('popug_package.Account');

  const bufferedEvent = AccountProtobufType.create(event);
  const encodedEvent = AccountProtobufType.encode(bufferedEvent).finish();

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

