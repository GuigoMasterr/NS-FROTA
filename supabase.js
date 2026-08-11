import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://ccacecyqksenigmrvnap.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_aRQgU6fTTModcqdb4hSgHQ_bPKp2R3m'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)