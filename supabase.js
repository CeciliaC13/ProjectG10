const SUPABASE_URL = 'https://lpqzdcdinynhsbmekfnl.supabase.co/rest/v1/'
const SUPABASE_KEY = 'sb_publishable_giAT3blNY4sQL0HXWdgu-w_cE2fnSZ_'

const { createClient } = supabase
const db = createClient(SUPABASE_URL, SUPABASE_KEY)