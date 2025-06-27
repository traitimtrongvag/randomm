import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://rzaqgswkrjnshrxgqsnb.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6YXFnc3drcmpuc2hyeGdxc25iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEwMjMwODQsImV4cCI6MjA2NjU5OTA4NH0.Ji_C2JhMGzYzIp0FfeF-1IX-nMMYblAZo3yhh-fA_0w'
);

export default async function handler(req, res) {
  // Cho phép CORS để frontend gọi API được
  res.setHeader("Access-Control-Allow-Origin", "*");

  // Chỉ xử lý GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Lấy một key chưa dùng
    const { data, error } = await supabase
      .from('keys')
      .select('id, key')
      .eq('used', false)
      .limit(1);

    if (error || !data || data.length === 0) {
      return res.status(404).json({ error: 'No keys left' });
    }

    const { id, key } = data[0];

    // Đánh dấu là đã dùng
    await supabase.from('keys').update({ used: true }).eq('id', id);

    // Trả key cho client
    return res.status(200).json({ key });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}