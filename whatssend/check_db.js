require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
sb.from('ventas_toa').select('*').then(res => console.log('ventas:', res.data));
sb.from('contacts').select('*').limit(3).then(res => console.log('contacts count:', res.data.length));
