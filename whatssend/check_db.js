import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: workspaces } = await supabase.from('workspaces').select('id, evolution_instance, owner_id');
  const { data: profiles } = await supabase.from('profiles').select('*');
  console.log("Profiles count:", profiles?.length);
  const map = {};
  for(const p of profiles || []) {
      map[p.id] = p.email;
  }
  for(const w of workspaces || []) {
      if(w.evolution_instance) {
          console.log(`Workspace: ${w.id} | Instance: ${w.evolution_instance} | OwnerID: ${w.owner_id} | Email: ${map[w.owner_id]}`);
      }
  }
}
check();
