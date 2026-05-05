const SUPABASE_URL = 'https://lpqzdcdinynhsbmekfnl.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxwcXpkY2RpbnluaHNibWVrZm5sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1MTg1MzgsImV4cCI6MjA5MzA5NDUzOH0.OPeBGPkprKZ1fJDHJq8VcakGOuW-E2jHGFG8_Di8oCQ'

const { createClient } = supabase
const db = createClient(SUPABASE_URL, SUPABASE_KEY)