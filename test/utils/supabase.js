import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

let supabase = null
function getClient() {
    if (!supabase) {
        if (!supabaseUrl || !supabaseServiceKey) {
            throw new Error('SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables must be set')
        }
        supabase = createClient(supabaseUrl, supabaseServiceKey)
    }
    return supabase
}

export async function queryTable(table, filters = {}) {
    const client = getClient()
    let query = client.from(table).select('*')
    for (const [key, value] of Object.entries(filters)) {
        query = query.eq(key, value)
    }
    const { data, error } = await query
    if (error) throw error
    return data
}
