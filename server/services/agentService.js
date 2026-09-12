const ws = require('ws');
globalThis.WebSocket = ws;

const { GoogleGenAI } = require('@google/genai');
const { createClient } = require('@supabase/supabase-js');
const redis = require('../config/redis');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Safe Redis Helpers
const safeRedisGet = async (key) => {
  if (redis.status !== 'ready') return null;
  try {
    return await redis.get(key);
  } catch {
    return null;
  }
};

const safeRedisSet = async (key, val, ttl = 3600) => {
  if (redis.status !== 'ready') return;
  try {
    await redis.set(key, val, 'EX', ttl);
  } catch {}
};

const safeRedisDel = async (key) => {
  if (redis.status !== 'ready') return;
  try {
    await redis.del(key);
  } catch {}
};

// 1. Tool Declarations for Gemini
const tools = [
  {
    functionDeclarations: [
      {
        name: 'getSections',
        description: 'Get all learning sections in DevBoard (e.g. Frontend, Backend, AI/ML, DevOps).',
        parameters: { type: 'OBJECT', properties: {} }
      },
      {
        name: 'createSection',
        description: 'Create a brand new learning section in DevBoard and invalidate the Redis cache.',
        parameters: {
          type: 'OBJECT',
          properties: {
            name: { type: 'STRING', description: 'The title/name of the new section (e.g. "Cloud Computing")' }
          },
          required: ['name']
        }
      },
      {
        name: 'getTopics',
        description: 'Get all topics under a specific section ID.',
        parameters: {
          type: 'OBJECT',
          properties: {
            sectionId: { type: 'STRING', description: 'The UUID of the section' }
          },
          required: ['sectionId']
        }
      },
      {
        name: 'addTopic',
        description: 'Create a new topic under a specific section in DevBoard and invalidate the Redis cache.',
        parameters: {
          type: 'OBJECT',
          properties: {
            section_id: { type: 'STRING', description: 'The UUID of the section where this topic belongs' },
            name: { type: 'STRING', description: 'The title/name of the new topic (e.g. "LLMs" or "Transformers")' }
          },
          required: ['section_id', 'name']
        }
      },
      {
        name: 'getResources',
        description: 'Get all learning resources and links under a specific topic ID.',
        parameters: {
          type: 'OBJECT',
          properties: {
            topicId: { type: 'STRING', description: 'The UUID of the topic' }
          },
          required: ['topicId']
        }
      },
      {
        name: 'addResource',
        description: 'Add a new learning resource/link to a topic, and automatically invalidate the Redis cache.',
        parameters: {
          type: 'OBJECT',
          properties: {
            topic_id: { type: 'STRING', description: 'The UUID of the topic' },
            title: { type: 'STRING', description: 'Title of the resource' },
            url: { type: 'STRING', description: 'URL link to the article/video/docs' },
            difficulty: { type: 'STRING', description: 'Difficulty level: Beginner, Intermediate, or Advanced' },
            status: { type: 'STRING', description: 'Initial status: Not Started, In Progress, or Completed' },
            notes: { type: 'STRING', description: 'Brief helpful notes or summary' }
          },
          required: ['topic_id', 'title', 'url']
        }
      },
      {
        name: 'updateResourceStatus',
        description: 'Update the progress status of a resource (e.g. mark as Completed or In Progress) and invalidate Redis cache.',
        parameters: {
          type: 'OBJECT',
          properties: {
            id: { type: 'STRING', description: 'The UUID of the resource' },
            topic_id: { type: 'STRING', description: 'The UUID of the parent topic (for cache invalidation)' },
            status: { type: 'STRING', description: 'The new status: Not Started, In Progress, or Completed' }
          },
          required: ['id', 'status']
        }
      }
    ]
  }
];

// 2. Real Tool Executors (Connecting to Supabase & Redis)
async function executeTool(name, args) {
  console.log(`🤖 [Agent Executing Tool] ${name} with args:`, args);

  switch (name) {
    case 'getSections': {
      const cached = await safeRedisGet('devboard:sections');
      if (cached) return { source: 'redis-cache', sections: JSON.parse(cached) };

      const { data, error } = await supabase.from('sections').select('*').order('name');
      if (error) throw error;
      await safeRedisSet('devboard:sections', JSON.stringify(data));
      return { source: 'database', sections: data };
    }

    case 'createSection': {
      const { data, error } = await supabase.from('sections').insert([{ name: args.name }]).select();
      if (error) throw error;
      await safeRedisDel('devboard:sections');
      return { success: true, message: 'Section created successfully', section: data[0] };
    }

    case 'getTopics': {
      const cacheKey = `devboard:topics:${args.sectionId}`;
      const cached = await safeRedisGet(cacheKey);
      if (cached) return { source: 'redis-cache', topics: JSON.parse(cached) };

      const { data, error } = await supabase.from('topics').select('*').eq('section_id', args.sectionId).order('name');
      if (error) throw error;
      await safeRedisSet(cacheKey, JSON.stringify(data));
      return { source: 'database', topics: data };
    }

    case 'addTopic': {
      const { data, error } = await supabase.from('topics').insert([{ section_id: args.section_id, name: args.name }]).select();
      if (error) throw error;
      if (args.section_id) {
        await safeRedisDel(`devboard:topics:${args.section_id}`);
      }
      return { success: true, message: 'Topic created successfully', topic: data[0] };
    }

    case 'getResources': {
      const cacheKey = `devboard:resources:${args.topicId}`;
      const cached = await safeRedisGet(cacheKey);
      if (cached) return { source: 'redis-cache', resources: JSON.parse(cached) };

      const { data, error } = await supabase.from('resources').select('*').eq('topic_id', args.topicId);
      if (error) throw error;
      await safeRedisSet(cacheKey, JSON.stringify(data));
      return { source: 'database', resources: data };
    }

    case 'addResource': {
      const { data, error } = await supabase.from('resources').insert([args]).select();
      if (error) throw error;
      if (args.topic_id) {
        await safeRedisDel(`devboard:resources:${args.topic_id}`);
      }
      return { success: true, message: 'Resource added successfully', resource: data[0] };
    }

    case 'updateResourceStatus': {
      const { data, error } = await supabase.from('resources').update({ status: args.status }).eq('id', args.id).select();
      if (error) throw error;
      if (args.topic_id) {
        await safeRedisDel(`devboard:resources:${args.topic_id}`);
      }
      return { success: true, message: 'Resource status updated', resource: data[0] };
    }

    default:
      return { error: `Unknown tool: ${name}` };
  }
}

// 3. The Agent Multi-turn Reasoning Loop
async function askDevBoardAgent(userMessage) {
  const systemInstruction = `
You are the DevBoard AI Copilot—an intelligent assistant embedded in the DevBoard developer learning platform.
You have direct access to the user's DevBoard database (sections, topics, learning resources) and Redis cache.
When the user asks questions about their learning path, resources, or wants to add/update topics/resources:
1. Always call the relevant tools to check the real data first (e.g. getSections to find section_id before adding a topic).
2. Use addTopic to create topics, and createSection to create sections when requested.
3. Provide clear, encouraging, structured answers with markdown.
4. When you perform an action (like adding a topic or resource), explicitly confirm the name and details.
`;

  const chat = ai.chats.create({
    model: 'gemini-3.5-flash-lite',
    config: {
      systemInstruction,
      tools
    }
  });

  let response = await chat.sendMessage({ message: userMessage });
  const actionsTaken = [];

  // ReAct Loop: Keep executing function calls until Gemini finishes reasoning
  while (response.functionCalls && response.functionCalls.length > 0) {
    const functionResponses = [];

    for (const call of response.functionCalls) {
      actionsTaken.push({ tool: call.name, args: call.args });
      try {
        const result = await executeTool(call.name, call.args || {});
        functionResponses.push({
          functionResponse: {
            name: call.name,
            response: result
          }
        });
      } catch (err) {
        console.error(`Tool execution error for ${call.name}:`, err.message);
        functionResponses.push({
          functionResponse: {
            name: call.name,
            response: { error: err.message }
          }
        });
      }
    }

    // Send tool execution results back to the model
    response = await chat.sendMessage({ message: functionResponses });
  }

  return {
    reply: response.text,
    actionsTaken
  };
}

module.exports = {
  askDevBoardAgent,
  executeTool
};

