import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || 'https://bqpmdtzkrcprzkjlreak.supabase.co';
const supabaseKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxcG1kdHprcmNwcnpramxyZWFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyNzg5NjksImV4cCI6MjEwMzg1NDk2OX0.LhPN_hEFV00RIqtjajiz7h-t2agiIF2QDhKjf7hAJrs';

export const supabase = createClient(supabaseUrl, supabaseKey);
