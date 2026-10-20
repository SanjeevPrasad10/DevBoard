import { supabase } from "../supabaseClient";

/**
 * Validate or register a user by name.
 * Checks Supabase if reachable (with 1.5s timeout), otherwise immediately persists in localStorage.
 */
export const validateOrRegisterUser = async (name) => {
  const trimmedName = name.trim();
  if (!trimmedName) {
    throw new Error("Please enter a valid name.");
  }

  // Check Supabase safely with timeout
  try {
    const supabasePromise = supabase
      .from("users")
      .select("*")
      .ilike("name", trimmedName);

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Supabase timeout")), 1200)
    );

    const { data: existingUsers, error: selectError } = await Promise.race([
      supabasePromise,
      timeoutPromise,
    ]);

    if (!selectError && existingUsers) {
      if (existingUsers.length > 0) {
        return { user: existingUsers[0], isNew: false };
      }

      // User does not exist, insert into DB
      const { data: newUser, error: insertError } = await supabase
        .from("users")
        .insert([{ name: trimmedName }])
        .select();

      if (!insertError && newUser && newUser.length > 0) {
        return { user: newUser[0], isNew: true };
      }
    }
  } catch {
    // Supabase offline, fallback cleanly to localStorage
  }

  // Graceful LocalStorage user management
  const storageKey = `devboard_user_${trimmedName.toLowerCase()}`;
  const localData = localStorage.getItem(storageKey);

  if (localData) {
    try {
      const parsed = JSON.parse(localData);
      return { user: parsed, isNew: false };
    } catch {}
  }

  // Create new local user
  const newUser = {
    id: `user_${Date.now()}`,
    name: trimmedName,
    created_at: new Date().toISOString(),
  };
  localStorage.setItem(storageKey, JSON.stringify(newUser));
  return { user: newUser, isNew: true };
};
