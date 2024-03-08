const { Kafka } = require('kafkajs')

const kafka = new Kafka({
  clientId: 'popug-auth',
  brokers: ['localhost:9092'],
})

const producer = kafka.producer()

async function call ({topic, event}) {
  await producer.connect()
  await producer.send({
    topic: topic,
    messages: [
      { value: JSON.stringify(event) },
    ],
  })
  await producer.disconnect()
}

module.exports = {
  call
};

