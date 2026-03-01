import { Redis } from "@upstash/redis";
import type { SleepFullPlan } from "@/types/sleep";

const TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const TTL_SEC = Math.floor(TTL_MS / 1000);

export type PlanStatus = "processing" | "ready" | "failed" | "expired";

export type StoredPlan = {
  sessionId: string;
  token: string;
  status: PlanStatus;
  plan?: SleepFullPlan;
  expiresAt: number;
};

// --- In-memory fallback (no Redis env) ---
const bySessionId = new Map<string, StoredPlan>();
const byToken = new Map<string, StoredPlan>();

function memoryPruneExpired() {
  const now = Date.now();
  Array.from(bySessionId.entries()).forEach(([id, entry]) => {
    if (entry.expiresAt <= now) {
      bySessionId.delete(id);
      if (entry.token) byToken.delete(entry.token);
    }
  });
}

function memorySetProcessing(sessionId: string): void {
  memoryPruneExpired();
  const token = `cl_${sessionId.slice(-12)}_${Math.random().toString(36).slice(2, 12)}`;
  const expiresAt = Date.now() + TTL_MS;
  const entry: StoredPlan = { sessionId, token, status: "processing", expiresAt };
  bySessionId.set(sessionId, entry);
  byToken.set(token, entry);
}

function memorySetReady(sessionId: string, plan: SleepFullPlan): string | null {
  const entry = bySessionId.get(sessionId);
  if (!entry) return null;
  entry.status = "ready";
  entry.plan = plan;
  bySessionId.set(sessionId, entry);
  byToken.set(entry.token, entry);
  return entry.token;
}

function memorySetFailed(sessionId: string): void {
  const entry = bySessionId.get(sessionId);
  if (!entry) return;
  entry.status = "failed";
  if (entry.token) byToken.delete(entry.token);
  bySessionId.set(sessionId, entry);
}

function memoryGetBySessionId(sessionId: string): StoredPlan | null {
  memoryPruneExpired();
  const entry = bySessionId.get(sessionId);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    bySessionId.delete(sessionId);
    if (entry.token) byToken.delete(entry.token);
    return null;
  }
  return entry;
}

function memoryGetByToken(token: string): StoredPlan | null {
  memoryPruneExpired();
  const entry = byToken.get(token);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    byToken.delete(token);
    bySessionId.delete(entry.sessionId);
    return null;
  }
  return entry;
}

// --- Redis (when env set) ---
function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

const SESS_PREFIX = "sleep:sess:";
const TOKEN_PREFIX = "sleep:token:";

async function redisSetProcessing(sessionId: string): Promise<string> {
  const redis = getRedis();
  if (!redis) throw new Error("Redis not configured");
  const token = `cl_${sessionId.slice(-12)}_${Math.random().toString(36).slice(2, 12)}`;
  const expiresAt = Date.now() + TTL_MS;
  const entry: StoredPlan = { sessionId, token, status: "processing", expiresAt };
  await redis.setex(SESS_PREFIX + sessionId, TTL_SEC, JSON.stringify(entry));
  await redis.setex(TOKEN_PREFIX + token, TTL_SEC, sessionId);
  return token;
}

async function redisSetReady(sessionId: string, plan: SleepFullPlan): Promise<string | null> {
  const redis = getRedis();
  if (!redis) return null;
  const raw = await redis.get<string>(SESS_PREFIX + sessionId);
  if (!raw) return null;
  const entry = JSON.parse(raw) as StoredPlan;
  entry.status = "ready";
  entry.plan = plan;
  await redis.setex(SESS_PREFIX + sessionId, TTL_SEC, JSON.stringify(entry));
  return entry.token;
}

async function redisSetFailed(sessionId: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  const raw = await redis.get<string>(SESS_PREFIX + sessionId);
  if (!raw) return;
  const entry = JSON.parse(raw) as StoredPlan;
  entry.status = "failed";
  await redis.setex(SESS_PREFIX + sessionId, TTL_SEC, JSON.stringify(entry));
}

async function redisGetBySessionId(sessionId: string): Promise<StoredPlan | null> {
  const redis = getRedis();
  if (!redis) return null;
  const raw = await redis.get<string>(SESS_PREFIX + sessionId);
  if (!raw) return null;
  const entry = JSON.parse(raw) as StoredPlan;
  if (entry.expiresAt <= Date.now()) return null;
  return entry;
}

async function redisGetByToken(token: string): Promise<StoredPlan | null> {
  const redis = getRedis();
  if (!redis) return null;
  const sessionId = await redis.get<string>(TOKEN_PREFIX + token);
  if (!sessionId) return null;
  return redisGetBySessionId(sessionId);
}

// --- Public API (async; uses Redis if env set, else memory) ---
const useRedis = () => !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;

export async function setProcessing(sessionId: string): Promise<void> {
  if (useRedis()) {
    await redisSetProcessing(sessionId);
    return;
  }
  memorySetProcessing(sessionId);
}

export async function setReady(sessionId: string, plan: SleepFullPlan): Promise<string | null> {
  if (useRedis()) return redisSetReady(sessionId, plan);
  return memorySetReady(sessionId, plan);
}

export async function setFailed(sessionId: string): Promise<void> {
  if (useRedis()) {
    await redisSetFailed(sessionId);
    return;
  }
  memorySetFailed(sessionId);
}

export async function getBySessionId(sessionId: string): Promise<StoredPlan | null> {
  if (useRedis()) return redisGetBySessionId(sessionId);
  return memoryGetBySessionId(sessionId);
}

export async function getByToken(token: string): Promise<StoredPlan | null> {
  if (useRedis()) return redisGetByToken(token);
  return memoryGetByToken(token);
}
