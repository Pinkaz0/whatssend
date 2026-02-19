
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import path from 'path'

// Load env from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase env vars')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkData() {
  console.log('Checking workspaces...')
  // We can't easily check "current user" without their token, but we can list all workspaces to see if any exist?
  // No, RLS prevents listing all.
  // We need to sign in logic? Or use service role?
  // I don't have service role key in .env.local usually (security).
  // I only have Anon key.
  
  // If I use Anon key, I can only see public data or data if I am logged in.
  // I can't log in as the user.
  
  // However, I can check if there are ANY workspaces visible to Anon? likely none.
  
  // Wait, I can try to use the "service_role" key if it is available in the environment?
  // The user provided `.env.local` content earlier:
  // NEXT_PUBLIC_SUPABASE_ANON_KEY=...
  // No service role key.
  
  // So I cannot check backend DB state for the user without their session.
  // But wait, the user is running the app via `npm run dev`.
  
  console.log('NOTE: Cannot check private data without user session.')
  console.log('Checking connection to Supabase...')
  const { data, error } = await supabase.from('workspaces').select('count').limit(1)
  
  if (error) {
    console.error('Supabase connection error:', error)
  } else {
    console.log('Supabase connection successful. workspace access result:', data) // Likely empty array due to RLS
  }
}

checkData()
