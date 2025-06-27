import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://rzaqgswkrjnshrxgqsnb.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6YXFnc3drcmpuc2hyeGdxc25iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEwMjMwODQsImV4cCI6MjA2NjU5OTA4NH0.Ji_C2JhMGzYzIp0FfeF-1IX-nMMYblAZo3yhh-fA_0w'
);

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  try {
    const { data, error } = await supabase
      .from('keys')
      .select('id, key')
      .eq('used', false)
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return res.status(404).json({ error: 'No keys left' });
    }

    await supabase
      .from('keys')
      .update({ used: true })
      .eq('id', data.id);

    return res.status(200).json({ key: data.key });
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}