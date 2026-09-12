import { supabase } from "../supabaseClient";

const serveTopic = async (sectionId) => {
  if (!sectionId) return [];

  // 1. Try Express backend with Redis caching
  try {
    const res = await fetch(`http://localhost:5000/api/topics/${sectionId}`);
    if (res.ok) {
      const result = await res.json();
      return result.data;
    }
  } catch {
    // Backend offline, fallback to Supabase
  }

  // 2. Direct Supabase fallback
  const { data, error } = await supabase
    .from("topics")
    .select("name,id")
    .eq("section_id", sectionId)
    .order("name");

  if (error) throw error;
  return data;
};

export default serveTopic;