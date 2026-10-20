/**
 * DevBoard Autonomous Agent Engine
 * Implements ReAct (Reasoning + Action) Tool-Calling Loop with live application mutations.
 * Allows the DevBoard Copilot to act as a true agent that interacts with the real dashboard.
 */

import { getLocalStore } from "./initialData";
import { createResource, updateResourceStatus } from "./resources";
import { supabase } from "../supabaseClient";

// 1. Tool Definitions
export const AGENT_TOOLS = [
  {
    name: "getSections",
    description: "Get all learning domains (e.g. DSA, Frontend Architecture, Backend, System Design).",
    parameters: {},
  },
  {
    name: "getTopics",
    description: "Get all topics under a domain or across the dashboard.",
    parameters: { sectionName: "string (optional)" },
  },
  {
    name: "addTopic",
    description: "Create a new learning topic under a specific domain.",
    parameters: { domainName: "string", topicName: "string" },
  },
  {
    name: "getResources",
    description: "Fetch problems and learning resources under a topic.",
    parameters: { topicName: "string (optional)" },
  },
  {
    name: "addResource",
    description: "Add a new LeetCode problem, documentation link, or study resource to a topic.",
    parameters: {
      topicName: "string",
      title: "string",
      url: "string (optional)",
      difficulty: "'Easy' | 'Medium' | 'Hard'",
      notes: "string (optional)",
    },
  },
  {
    name: "updateResourceStatus",
    description: "Mark a problem or resource as 'Completed' / 'Solved' or 'Learning' / 'In Progress'.",
    parameters: {
      title: "string",
      status: "'Completed' | 'Learning'",
    },
  },
  {
    name: "analyzeProgress",
    description: "Inspect total solved vs pending problems across all topics and calculate readiness.",
    parameters: {},
  },
];

// Helper to notify the React UI when the agent modifies state
const notifyAgentAction = (toolName, payload) => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("devboard_agent_action", {
        detail: { tool: toolName, payload, timestamp: Date.now() },
      })
    );
  }
};

// 2. Real Tool Executors
export const executeAgentTool = async (name, args = {}) => {
  const { sections, topics, resources } = getLocalStore();

  switch (name) {
    case "getSections": {
      return {
        count: sections.length,
        sections: sections.map((s) => ({ id: s.id, name: s.name })),
      };
    }

    case "getTopics": {
      let filtered = topics;
      if (args.sectionName) {
        const sec = sections.find((s) =>
          s.name.toLowerCase().includes(args.sectionName.toLowerCase())
        );
        if (sec) {
          filtered = topics.filter((t) => t.section_id === sec.id);
        }
      }
      return {
        count: filtered.length,
        topics: filtered.map((t) => ({ id: t.id, name: t.name })),
      };
    }

    case "addTopic": {
      const domainName = args.domainName || "Data Structures & Algorithms";
      const targetSec =
        sections.find((s) =>
          s.name.toLowerCase().includes(domainName.toLowerCase())
        ) || sections[0];

      const newTopic = {
        id: `top-agent-${Date.now()}`,
        section_id: targetSec.id,
        name: args.topicName || "New Track",
      };

      const updatedTopics = [...topics, newTopic];
      localStorage.setItem("devboard_topics", JSON.stringify(updatedTopics));

      // Best effort Supabase insert
      try {
        await supabase.from("topics").insert([
          { section_id: targetSec.id, name: args.topicName },
        ]);
      } catch {}

      notifyAgentAction("addTopic", newTopic);

      return {
        success: true,
        message: `Created topic "${newTopic.name}" under domain "${targetSec.name}".`,
        topic: newTopic,
      };
    }

    case "getResources": {
      let filtered = resources;
      if (args.topicName) {
        const top = topics.find((t) =>
          t.name.toLowerCase().includes(args.topicName.toLowerCase())
        );
        if (top) {
          filtered = resources.filter((r) => r.topic_id === top.id);
        }
      }
      return {
        count: filtered.length,
        problems: filtered.map((r) => ({
          title: r.title,
          difficulty: r.difficulty,
          status: r.status,
          notes: r.notes,
        })),
      };
    }

    case "addResource": {
      // Find matching topic or fallback to active topic
      const topicQuery = args.topicName || "";
      const targetTopic =
        topics.find((t) =>
          t.name.toLowerCase().includes(topicQuery.toLowerCase())
        ) || topics[0];

      const created = await createResource({
        topic_id: targetTopic.id,
        title: args.title || "Untitled Problem",
        url: args.url || "https://leetcode.com",
        difficulty: args.difficulty || "Medium",
        status: "Learning",
        notes: args.notes || "Added by DevBoard AI Copilot Agent",
      });

      notifyAgentAction("addResource", created);

      return {
        success: true,
        message: `Added "${created.title}" (${created.difficulty}) to "${targetTopic.name}".`,
        resource: created,
      };
    }

    case "updateResourceStatus": {
      const q = (args.title || "").toLowerCase();
      const targetResource = resources.find(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          q.includes(r.title.toLowerCase())
      );

      if (!targetResource) {
        return {
          success: false,
          error: `Could not find any resource matching "${args.title}".`,
        };
      }

      const nextStatus = args.status || "Completed";
      await updateResourceStatus(targetResource.id, nextStatus);

      notifyAgentAction("updateResourceStatus", {
        id: targetResource.id,
        status: nextStatus,
        title: targetResource.title,
      });

      return {
        success: true,
        message: `Marked "${targetResource.title}" as ${nextStatus}!`,
        resource: { ...targetResource, status: nextStatus },
      };
    }

    case "analyzeProgress": {
      const total = resources.length;
      const solved = resources.filter(
        (r) =>
          r.status?.toLowerCase() === "completed" ||
          r.status?.toLowerCase() === "done" ||
          r.status?.toLowerCase() === "solved"
      ).length;
      const rate = total > 0 ? Math.round((solved / total) * 100) : 0;

      const difficultyCounts = {
        Easy: resources.filter((r) => r.difficulty === "Easy").length,
        Medium: resources.filter((r) => r.difficulty === "Medium").length,
        Hard: resources.filter((r) => r.difficulty === "Hard").length,
      };

      return {
        totalTracked: total,
        totalSolved: solved,
        pending: total - solved,
        completionRate: `${rate}%`,
        difficultyBreakdown: difficultyCounts,
      };
    }

    default:
      return { error: `Unknown tool: ${name}` };
  }
};

// 3. Autonomous Agent Reasoning & ReAct Execution Loop
export const runAgentPrompt = async (userPrompt) => {
  const p = userPrompt.trim();
  const lower = p.toLowerCase();
  const actionsTaken = [];

  // 1. Try Express backend if online (with 1.2s timeout)
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 1200);

    const res = await fetch("http://localhost:5000/api/agent/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: p }),
      signal: controller.signal,
    });
    clearTimeout(id);

    if (res.ok) {
      const data = await res.json();
      if (data.actionsTaken && data.actionsTaken.length > 0) {
        // Trigger live refresh
        notifyAgentAction("remoteAgentSync", data.actionsTaken);
      }
      return {
        reply: data.reply,
        actionsTaken: data.actionsTaken || [],
      };
    }
  } catch {
    // Backend offline -> run autonomous local agent planner
  }

  // 2. Autonomous Local ReAct Agent Planner
  // Intent: Adding a problem/resource
  if (
    lower.startsWith("add ") ||
    lower.includes("add problem") ||
    lower.includes("add resource") ||
    lower.includes("insert problem")
  ) {
    // Extract title
    let title = "New Problem";
    let difficulty = "Medium";
    let topicName = "";

    if (lower.includes("easy")) difficulty = "Easy";
    if (lower.includes("hard")) difficulty = "Hard";

    // Regex check for quotes or problem name
    const quoteMatch = p.match(/['"]([^'"]+)['"]/);
    if (quoteMatch) {
      title = quoteMatch[1];
    } else {
      // Extract after 'add problem' or 'add'
      const clean = p
        .replace(/add\s+(problem|resource)?/i, "")
        .replace(/to\s+.*$/i, "")
        .trim();
      if (clean) title = clean;
    }

    // Extract topic if specified
    if (lower.includes("to ") || lower.includes("under ")) {
      const parts = p.split(/to\s+|under\s+/i);
      if (parts[1]) topicName = parts[1].trim();
    }

    const toolCall = {
      tool: "addResource",
      args: {
        title,
        difficulty,
        topicName,
        url: title.toLowerCase().includes("leetcode")
          ? "https://leetcode.com"
          : "https://leetcode.com/problemset/",
        notes: `Analyzed and generated by DevBoard Autonomous Agent. Focus on ${difficulty} pattern.`,
      },
    };

    const result = await executeAgentTool(toolCall.tool, toolCall.args);
    actionsTaken.push({ ...toolCall, result });

    return {
      reply: `I have executed the **addResource** tool and added **"${title}"** (${difficulty}) to your dashboard.\n\nYour topic view and solved metrics have been updated in real time.`,
      actionsTaken,
    };
  }

  // Intent: Mark problem as completed/solved
  if (
    lower.includes("mark ") ||
    lower.includes("solve ") ||
    lower.includes("completed") ||
    lower.includes("done")
  ) {
    let title = "";
    const quoteMatch = p.match(/['"]([^'"]+)['"]/);
    if (quoteMatch) {
      title = quoteMatch[1];
    } else {
      const cleaned = p
        .replace(/mark\s+/i, "")
        .replace(/as\s+(completed|solved|done|in progress)/i, "")
        .trim();
      title = cleaned;
    }

    const isPending = lower.includes("in progress") || lower.includes("pending");
    const targetStatus = isPending ? "Learning" : "Completed";

    const toolCall = {
      tool: "updateResourceStatus",
      args: { title, status: targetStatus },
    };

    const result = await executeAgentTool(toolCall.tool, toolCall.args);
    actionsTaken.push({ ...toolCall, result });

    if (result.success) {
      return {
        reply: `Action confirmed! I executed **updateResourceStatus** and marked **"${result.resource.title}"** as **${targetStatus}**.\n\nYour progress bar and solved metrics have updated on the dashboard.`,
        actionsTaken,
      };
    } else {
      return {
        reply: `I searched your tracked problems for "${title}", but couldn't find a direct match. Check the exact problem title in your list and try again!`,
        actionsTaken,
      };
    }
  }

  // Intent: Create new topic
  if (lower.includes("create topic") || lower.includes("add topic")) {
    let topicName = "New Topic";
    let domainName = "";

    const quoteMatch = p.match(/['"]([^'"]+)['"]/);
    if (quoteMatch) {
      topicName = quoteMatch[1];
    } else {
      const parts = p.split(/topic\s+/i);
      if (parts[1]) topicName = parts[1].replace(/under\s+.*$/i, "").trim();
    }

    if (lower.includes("under ") || lower.includes("in ")) {
      const domainParts = p.split(/under\s+|in\s+/i);
      if (domainParts[1]) domainName = domainParts[1].trim();
    }

    const toolCall = {
      tool: "addTopic",
      args: { topicName, domainName },
    };

    const result = await executeAgentTool(toolCall.tool, toolCall.args);
    actionsTaken.push({ ...toolCall, result });

    return {
      reply: `I have invoked the **addTopic** tool and registered the new track **"${topicName}"** under ${result.topic.section_id}.\n\nIt is now accessible in your sidebar.`,
      actionsTaken,
    };
  }

  // Intent: Inspect / Analyze progress
  if (
    lower.includes("progress") ||
    lower.includes("how many") ||
    lower.includes("stats") ||
    lower.includes("readiness")
  ) {
    const toolCall = { tool: "analyzeProgress", args: {} };
    const result = await executeAgentTool(toolCall.tool, toolCall.args);
    actionsTaken.push({ ...toolCall, result });

    return {
      reply: `### 📊 Live Dashboard Analysis\n\n- **Total Tracked Problems**: ${result.totalTracked}\n- **Completed**: ${result.totalSolved} problems (${result.completionRate})\n- **Pending**: ${result.pending}\n- **Difficulty Mix**: ${result.difficultyBreakdown.Easy} Easy • ${result.difficultyBreakdown.Medium} Medium • ${result.difficultyBreakdown.Hard} Hard\n\nTo raise your readiness, prioritize uncompleted Medium and Hard problems under your active topic!`,
      actionsTaken,
    };
  }

  // Default: General knowledge / Interview coaching query
  const toolCall = { tool: "getSections", args: {} };
  const secResult = await executeAgentTool(toolCall.tool, toolCall.args);
  actionsTaken.push({ ...toolCall, result: secResult });

  return {
    reply: `I have inspected your dashboard environment (${secResult.count} active learning domains).\n\nAs an autonomous **DevBoard Agent**, I can take actions directly for you:\n- *"Add problem 'Trapping Rain Water' to Two Pointers"*\n- *"Mark Two Sum as solved"*\n- *"Create topic 'Microservices' under Backend"*\n- *"Analyze my progress"*\n\nTell me what you'd like me to execute!`,
    actionsTaken,
  };
};
