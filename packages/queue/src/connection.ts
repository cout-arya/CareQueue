import IORedis from "ioredis";

let connection: IORedis | null = null;

export function getRedisConnection(): IORedis {
  if (!connection) {
    const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
    connection = new IORedis(redisUrl, {
      maxRetriesPerRequest: null, // required by BullMQ
    });

    connection.on("error", (err) => {
      console.error("❌ Redis connection error:", err.message);
    });

    connection.on("connect", () => {
      console.log("✅ Redis connected");
    });
  }

  return connection;
}

export async function closeRedisConnection(): Promise<void> {
  if (connection) {
    await connection.quit();
    connection = null;
  }
}
