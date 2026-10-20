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

/**
 * Fetch all resources belonging to a specific topic
 */
const resources = async (topicId) => {
  if (!topicId) return [];

  // 1. Try Express backend with Redis caching
  try {
    const res = await fetchWithTimeout(`http://localhost:5000/api/resources/${topicId}`, {}, 1200);
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
      .from("resources")
      .select("*")
      .eq("topic_id", topicId);

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Supabase timeout")), 2000)
    );

    const { data, error } = await Promise.race([supabasePromise, timeoutPromise]);
    if (!error && Array.isArray(data) && data.length > 0) {
      return data;
    }
  } catch {
    // Supabase offline or paused
  }

  // 3. Local-First Fallback
  const { resources: allResources } = getLocalStore();
  const filtered = allResources.filter((r) => r.topic_id === topicId);
  return filtered;
};

/**
 * Update the status of a specific resource (e.g. 'Completed', 'Learning')
 */
export const updateResourceStatus = async (resourceId, newStatus) => {
  // 1. Update in LocalStorage first for instant persistence
  try {
    const { resources: allResources } = getLocalStore();
    const updated = allResources.map((r) =>
      r.id === resourceId ? { ...r, status: newStatus } : r
    );
    localStorage.setItem("devboard_resources", JSON.stringify(updated));
  } catch (err) {
    console.warn("Failed saving status to localStorage:", err);
  }

  // 2. Best-effort async update to Supabase
  try {
    const { data } = await supabase
      .from("resources")
      .update({ status: newStatus })
      .eq("id", resourceId)
      .select();

    return data;
  } catch {
    // Graceful offline fallback
    return [{ id: resourceId, status: newStatus }];
  }
};

/**
 * Insert a new resource into a topic
 */
export const createResource = async ({
  topic_id,
  title,
  url,
  difficulty = "Medium",
  status = "Learning",
  notes = "",
}) => {
  const newResource = {
    id: `res-user-${Date.now()}`,
    topic_id,
    title,
    url,
    difficulty,
    status,
    notes,
    image_url: null,
    created_at: new Date().toISOString(),
  };

  // 1. Persist locally first
  try {
    const { resources: allResources } = getLocalStore();
    const updated = [newResource, ...allResources];
    localStorage.setItem("devboard_resources", JSON.stringify(updated));
  } catch (err) {
    console.warn("Failed saving resource to localStorage:", err);
  }

  // 2. Best-effort async insert into Supabase
  try {
    const { data } = await supabase
      .from("resources")
      .insert([
        {
          topic_id,
          title,
          url,
          difficulty,
          status,
          notes,
        },
      ])
      .select();

    if (data && data[0]) {
      return data[0];
    }
  } catch {
    // Graceful offline fallback
  }

  return newResource;
};

/**
 * Update the image_url for a resource directly
 */
export const updateResourceImage = async (resourceId, imageUrl) => {
  // Update locally
  try {
    const { resources: allResources } = getLocalStore();
    const updated = allResources.map((r) =>
      r.id === resourceId ? { ...r, image_url: imageUrl } : r
    );
    localStorage.setItem("devboard_resources", JSON.stringify(updated));
  } catch {}

  // Best-effort remote
  try {
    const { data } = await supabase
      .from("resources")
      .update({ image_url: imageUrl })
      .eq("id", resourceId)
      .select();
    return data;
  } catch {
    return [{ id: resourceId, image_url: imageUrl }];
  }
};

/**
 * Upload an image file to Supabase Storage with base64 Data URL fallback
 */
export const uploadResourceImage = async (resourceId, file) => {
  // Data URL conversion fallback
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = async () => {
      const base64Url = reader.result;
      await updateResourceImage(resourceId, base64Url);
      resolve(base64Url);
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
};

export default resources;
