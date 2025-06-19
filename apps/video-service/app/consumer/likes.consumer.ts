import { ConsumeMessage, GetMessage } from "amqplib";
import { connectToLikeExchange,getLikeChannel  } from "@shared/rabbitmq";
import {VideoReactionModel } from '@shared/database'

const QUEUE_NAME = "like_queue";
const INTERVAL_MS = 3000; // Every 3 seconds

export const startBatchLikeConsumer = async () => {
  await connectToLikeExchange(); // Ensure channel is created
  const channel = getLikeChannel();

  setInterval(async () => {
    const messages: GetMessage[] = [];

    // Keep pulling messages until queue is empty
    while (true) {
      const msg = await channel.get(QUEUE_NAME, { noAck: false });

      if (msg) {
        messages.push(msg);
      } else {
        break;
      }
    }

    if (messages.length > 0) {
      const parsedPayloads = messages.map((msg) =>
        JSON.parse(msg.content.toString())
      );

      try {
        // 🛠️ Perform your bulk DB update here
        console.log(
          `[Batch] Updating DB with ${messages.length} messages`,
          parsedPayloads
        );
        await VideoReactionModel.insertMany(parsedPayloads)
        // ✅ Acknowledge all
        messages.forEach((msg) => channel.ack(msg));
      } catch (err) {
        console.error(`[Batch] Error processing batch:`, err);
        // ❌ Optionally: requeue or nack messages
        messages.forEach((msg) => channel.nack(msg, false, true));
      }
    }
  }, INTERVAL_MS);

  console.log(`[Consumer] Batch puller running every ${INTERVAL_MS}ms`);
};
