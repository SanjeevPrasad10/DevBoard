/**
 * Curated Seed Data & Local Fallback Store for DevBoard
 * Ensures 100% uptime and full interactivity even if external APIs or Supabase are unreachable.
 */

export const INITIAL_SECTIONS = [
  {
    id: "sec-dsa",
    name: "Data Structures & Algorithms",
    description: "Core algorithmic patterns, LeetCode curated problems, and interview questions.",
  },
  {
    id: "sec-frontend",
    name: "Frontend Architecture",
    description: "Modern React 19, state architecture, Core Web Vitals, and responsive UI engineering.",
  },
  {
    id: "sec-backend",
    name: "Backend & Systems",
    description: "Node.js runtime, Redis caching patterns, PostgreSQL indexing, and REST APIs.",
  },
  {
    id: "sec-sysdesign",
    name: "System Design & DevOps",
    description: "High-scale distributed systems, rate limiting, Docker, and CI/CD pipelines.",
  },
];

export const INITIAL_TOPICS = [
  // DSA Topics
  {
    id: "top-arrays-hashing",
    section_id: "sec-dsa",
    name: "Arrays & Hashing",
  },
  {
    id: "top-two-pointers",
    section_id: "sec-dsa",
    name: "Two Pointers & Sliding Window",
  },
  {
    id: "top-trees-graphs",
    section_id: "sec-dsa",
    name: "Trees, Graphs & BFS/DFS",
  },
  {
    id: "top-dp",
    section_id: "sec-dsa",
    name: "Dynamic Programming",
  },

  // Frontend Topics
  {
    id: "top-react19",
    section_id: "sec-frontend",
    name: "React 19 & State Patterns",
  },
  {
    id: "top-web-perf",
    section_id: "sec-frontend",
    name: "Web Performance & Core Web Vitals",
  },
  {
    id: "top-browser-apis",
    section_id: "sec-frontend",
    name: "DOM, Event Loop & Web APIs",
  },

  // Backend Topics
  {
    id: "top-nodejs-arch",
    section_id: "sec-backend",
    name: "Node.js & Event-Driven Architecture",
  },
  {
    id: "top-redis-caching",
    section_id: "sec-backend",
    name: "Redis Caching & Invalidation",
  },
  {
    id: "top-postgres-sql",
    section_id: "sec-backend",
    name: "PostgreSQL & Database Optimization",
  },

  // System Design Topics
  {
    id: "top-rate-limiting",
    section_id: "sec-sysdesign",
    name: "Rate Limiting & API Gateways",
  },
  {
    id: "top-message-queues",
    section_id: "sec-sysdesign",
    name: "Message Brokers (Kafka & BullMQ)",
  },
  {
    id: "top-docker-deploy",
    section_id: "sec-sysdesign",
    name: "Docker, Vercel & Production Deployments",
  },
];

export const INITIAL_RESOURCES = [
  // Arrays & Hashing
  {
    id: "res-dsa-1",
    topic_id: "top-arrays-hashing",
    title: "Two Sum (HashMap approach)",
    url: "https://leetcode.com/problems/two-sum/",
    difficulty: "Easy",
    status: "Completed",
    notes: "O(n) time, O(n) space. Use a hash map to store complement values (target - num). Check lookup in O(1).",
    image_url: null,
  },
  {
    id: "res-dsa-2",
    topic_id: "top-arrays-hashing",
    title: "Group Anagrams",
    url: "https://leetcode.com/problems/group-anagrams/",
    difficulty: "Medium",
    status: "Completed",
    notes: "Categorize by sorted string or character count tuple of size 26. Time complexity: O(N * K log K).",
    image_url: null,
  },
  {
    id: "res-dsa-3",
    topic_id: "top-arrays-hashing",
    title: "Top K Frequent Elements",
    url: "https://leetcode.com/problems/top-k-frequent-elements/",
    difficulty: "Medium",
    status: "Learning",
    notes: "Bucket Sort approach gives O(n) linear time instead of O(n log k) min-heap. Array indices represent frequencies.",
    image_url: null,
  },

  // Two Pointers & Sliding Window
  {
    id: "res-dsa-4",
    topic_id: "top-two-pointers",
    title: "Longest Substring Without Repeating Characters",
    url: "https://leetcode.com/problems/longest-substring-without-repeating-characters/",
    difficulty: "Medium",
    status: "Completed",
    notes: "Sliding window with two pointers (left, right) and a character index map. Slide left pointer past duplicate index.",
    image_url: null,
  },
  {
    id: "res-dsa-5",
    topic_id: "top-two-pointers",
    title: "Container With Most Water",
    url: "https://leetcode.com/problems/container-with-most-water/",
    difficulty: "Medium",
    status: "Learning",
    notes: "Two pointers from edges inwards. Always advance the pointer pointing to the shorter vertical bar.",
    image_url: null,
  },

  // Trees, Graphs
  {
    id: "res-dsa-6",
    topic_id: "top-trees-graphs",
    title: "Invert Binary Tree",
    url: "https://leetcode.com/problems/invert-binary-tree/",
    difficulty: "Easy",
    status: "Completed",
    notes: "Recursively swap left and right subtrees. Base case: if node is null return null. O(n) time, O(h) call stack space.",
    image_url: null,
  },
  {
    id: "res-dsa-7",
    topic_id: "top-trees-graphs",
    title: "Number of Connected Components in Graph",
    url: "https://leetcode.com/problems/number-of-connected-components-in-an-undirected-graph/",
    difficulty: "Medium",
    status: "Learning",
    notes: "Disjoint Set Union (Union-Find) with path compression or BFS traversal tracking visited set.",
    image_url: null,
  },

  // Dynamic Programming
  {
    id: "res-dsa-8",
    topic_id: "top-dp",
    title: "Climbing Stairs (Fibonacci DP)",
    url: "https://leetcode.com/problems/climbing-stairs/",
    difficulty: "Easy",
    status: "Completed",
    notes: "dp[i] = dp[i-1] + dp[i-2]. Optimize space from O(n) array to two variables: prev1 and prev2 for O(1) space.",
    image_url: null,
  },
  {
    id: "res-dsa-9",
    topic_id: "top-dp",
    title: "Coin Change (Unbounded Knapsack)",
    url: "https://leetcode.com/problems/coin-change/",
    difficulty: "Medium",
    status: "Learning",
    notes: "Bottom-up 1D DP array initialized to amount + 1. dp[i] = min(dp[i], 1 + dp[i - coin]). Time: O(amount * len(coins)).",
    image_url: null,
  },

  // React 19
  {
    id: "res-fe-1",
    topic_id: "top-react19",
    title: "React 19 Server Actions & useActionState",
    url: "https://react.dev/reference/react/useActionState",
    difficulty: "Medium",
    status: "Completed",
    notes: "Simplifies form mutations without manual loading states or try/catch boilerplate. Integrates with transitions.",
    image_url: null,
  },
  {
    id: "res-fe-2",
    topic_id: "top-react19",
    title: "Optimistic UI Updates with useOptimistic",
    url: "https://react.dev/reference/react/useOptimistic",
    difficulty: "Medium",
    status: "Learning",
    notes: "Renders immediate user feedback while asynchronous server requests are in flight, automatically rolling back on failure.",
    image_url: null,
  },

  // Web Performance
  {
    id: "res-fe-3",
    topic_id: "top-web-perf",
    title: "Largest Contentful Paint (LCP) Optimization",
    url: "https://web.dev/articles/lcp",
    difficulty: "Medium",
    status: "Completed",
    notes: "Prioritize critical hero assets using fetchpriority='high', inline critical CSS, and preconnect to image CDNs.",
    image_url: null,
  },
  {
    id: "res-fe-4",
    topic_id: "top-web-perf",
    title: "Interaction to Next Paint (INP) Debugging",
    url: "https://web.dev/articles/inp",
    difficulty: "Hard",
    status: "Learning",
    notes: "Break long tasks using scheduler.yield() or requestAnimationFrame. Minimize main thread JavaScript blocking.",
    image_url: null,
  },

  // Node.js Architecture
  {
    id: "res-be-1",
    topic_id: "top-nodejs-arch",
    title: "Understanding libuv & Node.js Event Loop Phases",
    url: "https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick",
    difficulty: "Hard",
    status: "Completed",
    notes: "Phases: Timers -> Pending Callbacks -> Idle/Prepare -> Poll -> Check (setImmediate) -> Close. process.nextTick runs between phases.",
    image_url: null,
  },

  // Redis Caching
  {
    id: "res-be-2",
    topic_id: "top-redis-caching",
    title: "Cache-Aside Pattern Implementation with TTL",
    url: "https://redis.io/docs/latest/develop/use/patterns/",
    difficulty: "Medium",
    status: "Completed",
    notes: "Read through cache first; on miss, query database, populate cache with TTL, and return. Invalidate keys on resource mutations.",
    image_url: null,
  },

  // PostgreSQL
  {
    id: "res-be-3",
    topic_id: "top-postgres-sql",
    title: "B-Tree vs Hash vs GIN Indexes in PostgreSQL",
    url: "https://www.postgresql.org/docs/current/indexes-types.html",
    difficulty: "Medium",
    status: "Learning",
    notes: "B-Tree is default for equality and range queries (<, <=, =, >=, >). GIN is essential for full-text search and JSONB containment.",
    image_url: null,
  },

  // Rate Limiting
  {
    id: "res-sys-1",
    topic_id: "top-rate-limiting",
    title: "Token Bucket vs Leaky Bucket Rate Limiting",
    url: "https://en.wikipedia.org/wiki/Token_bucket",
    difficulty: "Medium",
    status: "Completed",
    notes: "Token bucket allows controlled bursts up to bucket capacity while maintaining a steady refill rate. Ideal for API endpoints.",
    image_url: null,
  },
  {
    id: "res-sys-2",
    topic_id: "top-rate-limiting",
    title: "Distributed Rate Limiter with Redis & Sliding Window",
    url: "https://redis.io/glossary/rate-limiting/",
    difficulty: "Hard",
    status: "Learning",
    notes: "Implement using Redis Sorted Sets (ZSET). Add current timestamp as score, remove old entries outside window, check ZCARD.",
    image_url: null,
  },
];

// Helper to get or initialize stored data
export const getLocalStore = () => {
  try {
    const rawSections = localStorage.getItem("devboard_sections");
    const rawTopics = localStorage.getItem("devboard_topics");
    const rawResources = localStorage.getItem("devboard_resources");

    const sections = rawSections ? JSON.parse(rawSections) : INITIAL_SECTIONS;
    const topics = rawTopics ? JSON.parse(rawTopics) : INITIAL_TOPICS;
    const resources = rawResources ? JSON.parse(rawResources) : INITIAL_RESOURCES;

    // Ensure initial data is stored if not yet set
    if (!rawSections) localStorage.setItem("devboard_sections", JSON.stringify(INITIAL_SECTIONS));
    if (!rawTopics) localStorage.setItem("devboard_topics", JSON.stringify(INITIAL_TOPICS));
    if (!rawResources) localStorage.setItem("devboard_resources", JSON.stringify(INITIAL_RESOURCES));

    return { sections, topics, resources };
  } catch (err) {
    console.warn("LocalStorage access failed, using memory defaults:", err);
    return {
      sections: INITIAL_SECTIONS,
      topics: INITIAL_TOPICS,
      resources: INITIAL_RESOURCES,
    };
  }
};
