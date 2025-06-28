import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://rzaqgswkrjnshrxgqsnb.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6YXFnc3drcmpuc2hyeGdxc25iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEwMjMwODQsImV4cCI6MjA2NjU5OTA4NH0.Ji_C2JhMGzYzIp0FfeF-1IX-nMMYblAZo3yhh-fA_0w'
);

export default async function handler(req, res) {
  // ✅ CORS
  res.setHeader("Access-Control-Allow-Origin", "*");

  // ❌ Chỉ cho phép GET
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // 🛡️ Chặn một số user-agent nguy hiểm
  const ua = req.headers['user-agent'] || '';
  if (/curl|wget|python|httpie|postman/i.test(ua)) {
    return res.status(403).json({ error: "User-Agent không hợp lệ." });
  }

  // 📡 Lấy IP thật
  const realIP =
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.headers["x-vercel-forwarded-for"]?.split(",")[0]?.trim() ||
    req.socket?.remoteAddress;

  if (!realIP || realIP === "127.0.0.1" || realIP.startsWith("::1")) {
    return res.status(400).json({ error: "Không xác định được IP thật." });
  }

  console.log("📡 IP:", realIP);

  // 🔒 Kiểm tra VPN/Proxy
  try {
    const vpnRes = await fetch(
      `https://ipqualityscore.com/api/json/ip/pGsAvqXDcgWmYAz4EWww5dCN4QbJ4gnC/${realIP}`
    );
    const vpnData = await vpnRes.json();

    console.log("🔍 VPN Check:", vpnData);

    if (vpnData.vpn || vpnData.proxy || vpnData.tor) {
      return res.status(403).json({ error: "VPN/Proxy bị chặn." });
    }
  } catch (e) {
    console.error("❌ Lỗi kiểm tra VPN:", e);
    return res.status(500).json({ error: "Lỗi khi kiểm tra VPN." });
  }

  // 🕒 Kiểm tra nếu IP đã lấy key trong 24h
  const { data: existing } = await supabase
    .from('key_logs')
    .select('key, created_at')
    .eq('ip', realIP)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) {
    const lastTime = new Date(existing.created_at);
    const now = new Date();
    const hoursDiff = (now - lastTime) / (1000 * 60 * 60);
    if (hoursDiff < 24) {
      console.log("🔁 Đã cấp key trong 24h:", existing.key);
      return res.status(200).json({ key: existing.key });
    }
  }

  // 🔑 Tìm key chưa dùng
  const { data: keyData } = await supabase
    .from('keys')
    .select('id, key')
    .eq('used', false)
    .limit(1)
    .maybeSingle();

  if (!keyData) {
    return res.status(404).json({ error: "Hết key." });
  }

  // ✅ Đánh dấu key đã dùng
  await supabase
    .from('keys')
    .update({ used: true })
    .eq('id', keyData.id);

  // 📝 Ghi log IP đã nhận key
  await supabase
    .from('key_logs')
    .insert({ ip: realIP, key: keyData.key });

  console.log("✅ Cấp key mới:", keyData.key);

  return res.status(200).json({ key: keyData.key });
}
