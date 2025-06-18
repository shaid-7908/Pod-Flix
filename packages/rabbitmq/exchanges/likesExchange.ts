import amqp, { ChannelModel, Channel, ConsumeMessage } from "amqplib";

let connection: ChannelModel;
let channel: Channel;

const queue = "like_queue";
const exchange = "like_exchange";
const routingKey = "like.process";
const RABBITMQ_URL = process.env.RABBITMQ_URL || "amqp://localhost";


export const connectToLikeExchange = async () => {
  connection = await amqp.connect(RABBITMQ_URL);
  channel = await connection.createChannel();

  

  await channel.assertExchange(exchange, 'direct', { durable: true });
  await channel.assertQueue(queue, { durable: true });
  await channel.bindQueue(queue, exchange, routingKey);

  console.log(`[RabbitMQ] Connected and bound to queue '${queue}'`);
};


export const publishToLikeQueue = async (data: Record<string, any>) => {
  if (!channel) throw new Error('RabbitMQ channel not initialized');

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


export const getLikeChannel = () => {
  if (!channel) throw new Error("RabbitMQ channel not initialized");
  return channel;
};









