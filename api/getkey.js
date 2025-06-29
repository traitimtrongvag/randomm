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

  // 👉 Lấy IP thật
  const realIP = req.headers["x-forwarded-for"]?.split(",")[0]?.trim();

  if (!realIP || realIP === "127.0.0.1" || realIP.startsWith("::1")) {
    return res.status(400).json({ error: "Không xác định được IP thật." });
  }

  // 🔒 Chặn VPN/proxy
  try {
    const vpnRes = await fetch(`https://ipqualityscore.com/api/json/ip/pGsAvqXDcgWmYAz4EWww5dCN4QbJ4gnC/${realIP}`);
    const vpnData = await vpnRes.json();

    if (vpnData.vpn || vpnData.proxy || vpnData.tor) {
      return res.status(403).json({ error: "VPN/Proxy bị chặn." });
    }
  } catch (e) {
    console.error("Lỗi kiểm tra VPN:", e);
    return res.status(500).json({ error: "Lỗi khi kiểm tra VPN." });
  }

  // 🎯 Tạo thông tin headers cần kiểm tra
  const headersCheck = {
    "user-agent": req.headers["user-agent"] || "",
    "accept-language": req.headers["accept-language"] || "",
  };

  // ❌ Kiểm tra headers trùng IP + headers
  const { data: duplicateHeader } = await supabase
    .from("headers_logs")
    .select("id")
    .eq("ip", realIP)
    .eq("user_agent", headersCheck["user-agent"])
    .eq("accept_language", headersCheck["accept-language"])
    .limit(1);

  if (duplicateHeader && duplicateHeader.length > 0) {
    return res.status(429).json({ error: "IP & headers trùng lặp – nghi ngờ fake request." });
  }

  // 🕒 Kiểm tra IP đã nhận key trong 24h chưa
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
      return res.status(200).json({ key: existing.key });
    }
  }

  // 🗝️ Lấy 1 key chưa dùng
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

  // 📥 Ghi log IP
  await supabase
    .from('key_logs')
    .insert({ ip: realIP, key: keyData.key });

  // 📥 Ghi log headers
  await supabase
    .from('headers_logs')
    .insert({
      ip: realIP,
      user_agent: headersCheck["user-agent"],
      accept_language: headersCheck["accept-language"]
    });

  return res.status(200).json({ key: keyData.key });
}
