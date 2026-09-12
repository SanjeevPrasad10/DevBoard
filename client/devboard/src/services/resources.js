import { supabase } from "../supabaseClient";

/**
 * Fetch all resources belonging to a specific topic
 */
const resources = async (topicId) => {
  if (!topicId) return [];

  // 1. Try Express backend with Redis caching
  try {
    const res = await fetch(`http://localhost:5000/api/resources/${topicId}`);
    if (res.ok) {
      const result = await res.json();
      return result.data;
    }
  } catch {
    // Backend offline, fallback to direct Supabase
  }

  // 2. Direct Supabase fallback
  const { data, error } = await supabase
    .from("resources")
    .select("*")
    .eq("topic_id", topicId);

  if (error) {
    console.error("Error fetching resources for topic", topicId, error);
    throw error;
  }
  return data || [];
};

/**
 * Update the status of a specific resource (e.g. 'Completed', 'Learning', 'Pending')
 */
export const updateResourceStatus = async (resourceId, newStatus) => {
  const { data, error } = await supabase
    .from("resources")
    .update({ status: newStatus })
    .eq("id", resourceId)
    .select();

  if (error) {
    throw error;
  }
  return data;
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
  const { data, error } = await supabase
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

  if (error) {
    throw error;
  }
  return data?.[0];
};

/**
 * Update the image_url for a resource directly
 */
export const updateResourceImage = async (resourceId, imageUrl) => {
  const { data, error } = await supabase
    .from("resources")
    .update({ image_url: imageUrl })
    .eq("id", resourceId)
    .select();

  if (error) {
    throw error;
  }
  return data;
};

/**
 * Upload an image file to Supabase Storage with base64 fallback
 */
export const uploadResourceImage = async (resourceId, file) => {
  try {
    const fileExt = file.name.split(".").pop();
    const fileName = `resource-${resourceId}-${Date.now()}.${fileExt}`;
    const filePath = `uploads/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("devboard-images")
      .upload(filePath, file, { upsert: true });

    if (!uploadError) {
      const { data: publicData } = supabase.storage
        .from("devboard-images")
        .getPublicUrl(filePath);

      if (publicData?.publicUrl) {
        try {
          await updateResourceImage(resourceId, publicData.publicUrl);
        } catch {
          // image_url column might not exist yet
        }
        return publicData.publicUrl;
      }
    }
  } catch (storageErr) {
    console.warn("Storage upload failed, falling back to data URL:", storageErr);
  }

  // Fallback to Data URL
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64Url = reader.result;
        try {
          await updateResourceImage(resourceId, base64Url);
        } catch {
          // ignore if column doesn't exist
        }
        resolve(base64Url);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
};

export default resources;