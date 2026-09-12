require('dotenv').config();
const ws = require('ws');
globalThis.WebSocket = ws;

const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const redis = require('./config/redis');

const app = express();
app.use(cors());
app.use(express.json());

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const PORT = process.env.PORT || 5000;
const DEFAULT_EXPIRATION = 3600; // 1 hour

// Helper: Safely get from Redis with fallback
const safeRedisGet = async (key) => {
  if (redis.status !== 'ready') return null;
  try {
    return await redis.get(key);
  } catch (err) {
    console.warn(`[Redis Read Warning] ${key}:`, err.message);
    return null;
  }
};

// Helper: Safely set in Redis
const safeRedisSet = async (key, value, ttl = DEFAULT_EXPIRATION) => {
  if (redis.status !== 'ready') return;
  try {
    await redis.set(key, value, 'EX', ttl);
  } catch (err) {
    console.warn(`[Redis Write Warning] ${key}:`, err.message);
  }
};

// Helper: Safely delete from Redis
const safeRedisDel = async (key) => {
  if (redis.status !== 'ready') return;
  try {
    await redis.del(key);
  } catch (err) {
    console.warn(`[Redis Del Warning] ${key}:`, err.message);
  }
};

// Root Health Check
app.get('/', async (req, res) => {
  let redisStatus = 'disconnected';
  try {
    const pong = await redis.ping();
    if (pong === 'PONG') redisStatus = 'connected';
  } catch {
    redisStatus = 'offline';
  }

  res.json({
    status: 'online',
    server: 'DevBoard API',
    redis: redisStatus,
    timestamp: new Date().toISOString(),
  });
});

/**
 * 1. GET /api/sections (Cached in Redis)
 */
app.get('/api/sections', async (req, res) => {
  const cacheKey = 'devboard:sections';

  try {
    // 1. Try Redis cache first
    const cached = await safeRedisGet(cacheKey);
    if (cached) {
      console.log('⚡ [Redis HIT] /api/sections');
      return res.json({ source: 'cache', data: JSON.parse(cached) });
    }

    // 2. Cache MISS -> Query Supabase
    console.log('🐢 [DB MISS] Querying Supabase for sections...');
    const { data, error } = await supabase
      .from('sections')
      .select('*')
      .order('name');

    if (error) throw error;

    // 3. Cache the result
    await safeRedisSet(cacheKey, JSON.stringify(data));

    return res.json({ source: 'database', data });
  } catch (err) {
    console.error('Error fetching sections:', err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * 2. GET /api/topics/:sectionId (Cached in Redis by sectionId)
 */
app.get('/api/topics/:sectionId', async (req, res) => {
  const { sectionId } = req.params;
  const cacheKey = `devboard:topics:${sectionId}`;

  try {
    const cached = await safeRedisGet(cacheKey);
    if (cached) {
      console.log(`⚡ [Redis HIT] /api/topics/${sectionId}`);
      return res.json({ source: 'cache', data: JSON.parse(cached) });
    }

    console.log(`🐢 [DB MISS] Querying Supabase for topics (${sectionId})...`);
    const { data, error } = await supabase
      .from('topics')
      .select('name,id')
      .eq('section_id', sectionId)
      .order('name');

    if (error) throw error;

    await safeRedisSet(cacheKey, JSON.stringify(data));
    return res.json({ source: 'database', data });
  } catch (err) {
    console.error(`Error fetching topics for ${sectionId}:`, err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * 3. GET /api/resources/:topicId (Cached in Redis by topicId)
 */
app.get('/api/resources/:topicId', async (req, res) => {
  const { topicId } = req.params;
  const cacheKey = `devboard:resources:${topicId}`;

  try {
    const cached = await safeRedisGet(cacheKey);
    if (cached) {
      console.log(`⚡ [Redis HIT] /api/resources/${topicId}`);
      return res.json({ source: 'cache', data: JSON.parse(cached) });
    }

    console.log(`🐢 [DB MISS] Querying Supabase for resources (${topicId})...`);
    const { data, error } = await supabase
      .from('resources')
      .select('*')
      .eq('topic_id', topicId);

    if (error) throw error;

    await safeRedisSet(cacheKey, JSON.stringify(data));
    return res.json({ source: 'database', data });
  } catch (err) {
    console.error(`Error fetching resources for ${topicId}:`, err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * 4. POST /api/resources (Cache Invalidation)
 */
app.post('/api/resources', async (req, res) => {
  const { topic_id, title, url, difficulty, status, notes } = req.body;
  try {
    const { data, error } = await supabase
      .from('resources')
      .insert([{ topic_id, title, url, difficulty, status, notes }])
      .select();

    if (error) throw error;

    // Invalidate the cache for this specific topic
    await safeRedisDel(`devboard:resources:${topic_id}`);
    console.log(`🗑️ [Cache Invalidated] devboard:resources:${topic_id}`);

    return res.status(201).json(data[0]);
  } catch (err) {
    console.error('Error adding resource:', err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * 5. PATCH /api/resources/:id/status (Update status + Invalidate Cache)
 */
app.patch('/api/resources/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status, topic_id } = req.body;

  try {
    const { data, error } = await supabase
      .from('resources')
      .update({ status })
      .eq('id', id)
      .select();

    if (error) throw error;

    if (topic_id) {
      await safeRedisDel(`devboard:resources:${topic_id}`);
    }

    return res.json(data[0]);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * 6. POST /api/agent/chat (DevBoard AI Copilot with Function Calling)
 */
const { askDevBoardAgent } = require('./services/agentService');
app.post('/api/agent/chat', async (req, res) => {
  const { message } = req.body;
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Valid message string is required' });
  }

  try {
    const result = await askDevBoardAgent(message);
    return res.json(result);
  } catch (err) {
    console.error('Agent endpoint error:', err);
    return res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Express server running on http://localhost:${PORT}`);
});