import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://rzaqgswkrjnshrxgqsnb.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6YXFnc3drcmpuc2hyeGdxc25iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEwMjMwODQsImV4cCI6MjA2NjU5OTA4NH0.Ji_C2JhMGzYzIp0FfeF-1IX-nMMYblAZo3yhh-fA_0w'
);

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // 👣 Lấy IP thật (hỗ trợ proxy/CDN)
  const ip =
    req.headers['x-forwarded-for']?.split(',')[0] ||
    req.connection?.remoteAddress ||
    'unknown';

  if (ip === 'unknown') {
    return res.status(400).json({ error: "Cannot detect IP" });
  }

  // 🧠 1. Kiểm tra xem IP đã nhận key chưa
  const { data: existing, error: checkErr } = await supabase
    .from('key_logs')
    .select('key')
    .eq('ip', ip)
    .maybeSingle();

  if (existing) {
    return res.status(200).json({ key: existing.key });
  }

  // 🗝️ 2. Lấy 1 key chưa dùng
  const { data: keyData, error: keyErr } = await supabase
    .from('keys')
    .select('id, key')
    .eq('used', false)
    .limit(1)
    .maybeSingle();

  if (!keyData) {
    return res.status(404).json({ error: "No keys left" });
  }

  // ✅ 3. Đánh dấu key đã dùng
  await supabase
    .from('keys')
    .update({ used: true })
    .eq('id', keyData.id);

  // 📝 4. Lưu log với IP
  await supabase
    .from('key_logs')
    .insert({ ip, key: keyData.key });

  return res.status(200).json({ key: keyData.key });
}
