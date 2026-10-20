import { supabase } from "../supabaseClient";
import { getLocalStore } from "./initialData";

const fetchWithTimeout = async (url, options = {}, timeoutMs = 1500) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
};

const serveTopic = async (sectionId) => {
  if (!sectionId) return [];

  // 1. Try Express backend with Redis caching
  try {
    const res = await fetchWithTimeout(`http://localhost:5000/api/topics/${sectionId}`, {}, 1200);
    if (res.ok) {
      const result = await res.json();
      if (Array.isArray(result.data) && result.data.length > 0) {
        return result.data;
      }
    }
  } catch {
    // Backend offline or timeout
  }

  // 2. Direct Supabase fallback
  try {
    const supabasePromise = supabase
      .from("topics")
      .select("name,id,section_id")
      .eq("section_id", sectionId)
      .order("name");

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Supabase timeout")), 2000)
    );

    const { data, error } = await Promise.race([supabasePromise, timeoutPromise]);
    if (!error && Array.isArray(data) && data.length > 0) {
      return data;
    }
  } catch {
    // Supabase unreachable
  }

  // 3. Robust Local-First Fallback
  const { topics } = getLocalStore();
  const filtered = topics.filter((t) => t.section_id === sectionId);
  if (filtered.length > 0) return filtered;

  // If sectionId doesn't match directly (e.g., custom section), return all or match by name
  return topics.slice(0, 4);
};

export default serveTopic;
