import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch'; // nếu bạn dùng Node, Next.js edge function thì không cần

const supabase = createClient(
  'https://rzaqgswkrjnshrxgqsnb.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6YXFnc3drcmpuc2hyeGdxc25iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEwMjMwODQsImV4cCI6MjA2NjU5OTA4NH0.Ji_C2JhMGzYzIp0FfeF-1IX-nMMYblAZo3yhh-fA_0w' // Thay bằng secret key thật
);

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Lấy IP người dùng
  const forwarded = req.headers["x-forwarded-for"];
  const ip = forwarded ? forwarded.split(",")[0] : req.socket.remoteAddress;

  // Kiểm tra VPN / Proxy qua ip-api
  try {
    const ipCheck = await fetch(`http://ip-api.com/json/${ip}?fields=proxy,mobile,hosting`);
    const ipInfo = await ipCheck.json();

    if (ipInfo.proxy || ipInfo.hosting || ipInfo.mobile) {
      return res.status(403).json({ error: "VPN/Proxy/Mobile network detected. Access denied." });
    }
  } catch (err) {
    console.error("IP Check Failed:", err);
    return res.status(500).json({ error: "Could not verify IP address." });
  }

  // 1. Lấy 1 key chưa dùng
  const { data: keyData } = await supabase
    .from('keys')
    .select('id, key')
    .eq('used', false)
    .limit(1)
    .maybeSingle();

  if (!keyData) {
    return res.status(404).json({ error: "No keys left" });
  }

  // 2. Đánh dấu key đã dùng
  await supabase
    .from('keys')
    .update({ used: true })
    .eq('id', keyData.id);

  return res.status(200).json({ key: keyData.key });
}
