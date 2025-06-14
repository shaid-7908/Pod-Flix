// packages/rabbitmq/index.ts
import amqp, { ChannelModel, Channel ,ConsumeMessage} from 'amqplib';

let connection: ChannelModel;
let channel: Channel;

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost';
const exchange = "video_processing_exchange";
const queue = "video_processing_queue";
const routingKey = "video.process";


export const connectRabbitMQ = async () => {
  connection = await amqp.connect(RABBITMQ_URL);
  channel = await connection.createChannel();

  

  await channel.assertExchange(exchange, 'direct', { durable: true });
  await channel.assertQueue(queue, { durable: true });
  await channel.bindQueue(queue, exchange, routingKey);

  console.log(`[RabbitMQ] Connected and bound to queue '${queue}'`);
};

export const publishToVideoQueue = async (data: Record<string, any>) => {
  if (!channel) throw new Error('RabbitMQ channel not initialized');

  const exchange = 'video_processing_exchange';
  const routingKey = 'video.process';

  const sent = channel.publish(
    exchange,
    routingKey,
    Buffer.from(JSON.stringify(data)),
    { persistent: true }
  );

  if (sent) {
    console.log(`[RabbitMQ] Message sent to ${routingKey}`);
  } else {
    console.warn(`[RabbitMQ] Failed to send message`);
  }
};


export const consumeVideoQueue = async (
  onMessage: (msg: Record<string, any>) => Promise<void> | void
) => {
  if (!channel) throw new Error("RabbitMQ channel not initialized");

  await channel.consume(
    queue,
    async (msg: ConsumeMessage | null) => {
      if (msg) {
        try {
          const payload = JSON.parse(msg.content.toString());
          console.log(`[RabbitMQ] Received message:`, payload);

          await onMessage(payload);
          channel.ack(msg);
        } catch (err) {
          console.error(`[RabbitMQ] Error processing message`, err);
          channel.nack(msg, false, false); // discard message
        }
      }
    },
    { noAck: false }
  );

  console.log(`[RabbitMQ] Listening to queue '${queue}'`);
};

export const closeRabbitMQ = async () => {
  await channel?.close();
  await connection?.close();
};
