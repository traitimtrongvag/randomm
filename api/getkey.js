import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://rzaqgswkrjnshrxgqsnb.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9....' // secret key của bạn
);

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { uuid } = req.body;

  if (!uuid) {
    return res.status(400).json({ error: "UUID is required" });
  }

  // 1. Check nếu uuid đã có key rồi
  const { data: existing } = await supabase
    .from('key_logs')
    .select('key')
    .eq('uuid', uuid)
    .maybeSingle();

  if (existing) {
    return res.status(200).json({ key: existing.key });
  }

  // 2. Lấy key chưa dùng
  const { data: keyData } = await supabase
    .from('keys')
    .select('id, key')
    .eq('used', false)
    .limit(1)
    .maybeSingle();

  if (!keyData) {
    return res.status(404).json({ error: "No keys left" });
  }

  // 3. Đánh dấu key là đã dùng
  await supabase
    .from('keys')
    .update({ used: true })
    .eq('id', keyData.id);

  // 4. Lưu uuid vào key_logs
  await supabase
    .from('key_logs')
    .insert({ uuid, key: keyData.key });

  return res.status(200).json({ key: keyData.key });
}
