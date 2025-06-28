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

  // 👣 Lấy IP từ proxy hoặc trực tiếp
  const ip =
    req.headers['x-forwarded-for']?.split(',')[0] ||
    req.connection?.remoteAddress ||
    'unknown';

  if (ip === 'unknown') {
    return res.status(400).json({ error: "Không thể xác định IP" });
  }

  // 🛡️ Kiểm tra IP có phải VPN hay Proxy không
  try {
    const checkRes = await fetch(`https://ipqualityscore.com/api/json/ip/pGsAvqXDcgWmYAz4EWww5dCN4QbJ4gnC/${ip}`);
    const checkData = await checkRes.json();

    if (checkData.vpn || checkData.proxy || checkData.tor) {
      return res.status(403).json({ error: "IP của bạn bị chặn do dùng VPN hoặc Proxy." });
    }
  } catch (err) {
    console.error("Lỗi kiểm tra VPN:", err);
    // Có thể bỏ qua nếu IPQS lỗi, hoặc chặn luôn tùy bạn
    return res.status(500).json({ error: "Không thể kiểm tra IP." });
  }

  // 🧠 Kiểm tra nếu IP đã nhận key trong 24h
  const { data: existing } = await supabase
    .from('key_logs')
    .select('key, created_at')
    .eq('ip', ip)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) {
    const lastTime = new Date(existing.created_at);
    const now = new Date();
    const hoursDiff = (now - lastTime) / (1000 * 60 * 60);
    if (hoursDiff < 24) {
      return res.status(200).json({ key: existing.key });
    }
  }

  // 🗝️ Lấy key chưa dùng
  const { data: keyData } = await supabase
    .from('keys')
    .select('id, key')
    .eq('used', false)
    .limit(1)
    .maybeSingle();

  if (!keyData) {
    return res.status(404).json({ error: "Hết key" });
  }

  // ✅ Đánh dấu key đã dùng
  await supabase
    .from('keys')
    .update({ used: true })
    .eq('id', keyData.id);

  // 📝 Lưu log
  await supabase
    .from('key_logs')
    .insert({ ip, key: keyData.key });

  return res.status(200).json({ key: keyData.key });
}
