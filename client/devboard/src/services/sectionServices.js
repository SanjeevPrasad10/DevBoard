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

const sectionCall = async () => {
  // 1. Try Express backend with Redis caching
  try {
    const res = await fetchWithTimeout("http://localhost:5000/api/sections", {}, 1200);
    if (res.ok) {
      const result = await res.json();
      if (Array.isArray(result.data) && result.data.length > 0) {
        localStorage.setItem("devboard_sections", JSON.stringify(result.data));
        return result.data;
      }
    }
  } catch {
    // Backend offline or timeout
  }

  // 2. Direct Supabase query (wrapped safely with timeout)
  try {
    const supabasePromise = supabase
      .from("sections")
      .select("*")
      .order("name");

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Supabase timeout")), 2000)
    );

    const { data, error } = await Promise.race([supabasePromise, timeoutPromise]);
    if (!error && Array.isArray(data) && data.length > 0) {
      localStorage.setItem("devboard_sections", JSON.stringify(data));
      return data;
    }
  } catch {
    // Supabase unreachable or paused
  }

  // 3. Robust Local-First Fallback
  const { sections } = getLocalStore();
  return sections;
};

export default sectionCall;
