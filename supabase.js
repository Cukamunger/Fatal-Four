const SUPABASE_URL = 'https://kqpzrbaxxakoskpgipbt.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_7pFIDwx-Lvi4VNTAKJ7E6A_6ZliMXZT';

window.fatalFourSupabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);
