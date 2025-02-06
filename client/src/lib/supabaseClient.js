import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://efdofywlcuvfmdqugldj.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmZG9meXdsY3V2Zm1kcXVnbGRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg4MjMzODQsImV4cCI6MjA1NDM5OTM4NH0.-dYuMLi8IMckaiw_P7xmqsX8_8jI7OQR3rAM1JGGbPU";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
