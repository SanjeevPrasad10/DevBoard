import { supabase } from "../supabaseClient";

/**
 * Validate if a user exists by name in Supabase.
 * If exists: returns the existing user.
 * If not: inserts the new user into the database and returns it.
 * Falls back gracefully to localStorage if 'users' table is not yet created in Supabase.
 */
export const validateOrRegisterUser = async (name) => {
  const trimmedName = name.trim();
  if (!trimmedName) {
    throw new Error("Please enter a valid name.");
  }

  // Check if we can query Supabase
  try {
    const { data: existingUsers, error: selectError } = await supabase
      .from("users")
      .select("*")
      .ilike("name", trimmedName);

    if (!selectError && existingUsers) {
      if (existingUsers.length > 0) {
        // User already exists in DB
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
  } catch (dbErr) {
    console.warn("Supabase 'users' table not found, using localStorage:", dbErr);
  }

  // Graceful Fallback: LocalStorage user storage
  const storageKey = `devboard_user_${trimmedName.toLowerCase()}`;
  const localData = localStorage.getItem(storageKey);

  if (localData) {
    try {
      const parsed = JSON.parse(localData);
      return { user: parsed, isNew: false };
    } catch {
      // ignore parse error
    }
  }

  // Create new local user
  const newUser = {
    id: `local_${Date.now()}`,
    name: trimmedName,
    created_at: new Date().toISOString(),
  };
  localStorage.setItem(storageKey, JSON.stringify(newUser));
  return { user: newUser, isNew: true };
};

