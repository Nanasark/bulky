import Queue from "bull";
import Redis from "ioredis";

const redisClient = new Redis(
  process.env.REDIS_URL || "redis://localhost:6379"
);
redisClient
  .ping()
  .then((response) => console.log("Redis connected successfully:", response))
  .catch((error) => console.error("Redis connection failed:", error))
  .finally(() => redisClient.disconnect());

export const emailQueue = new Queue("email-queue", {
  redis: redisClient,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 1000,
    },
  },
});
