// === File: /api/getkey.js (Vercel backend) ===

import { createClient } from '@supabase/supabase-js';

const supabase = createClient( 'https://rzaqgswkrjnshrxgqsnb.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6YXFnc3drcmpuc2hyeGdxc25iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEwMjMwODQsImV4cCI6MjA2NjU5OTA4NH0.Ji_C2JhMGzYzIp0FfeF-1IX-nMMYblAZo3yhh-fA_0w' );

export default async function handler(req, res) { const { data, error } = await supabase .from('keys') .select('*') .eq('used', false) .limit(1);

if (error || !data || data.length === 0) { return res.status(404).json({ error: 'No keys left' }); }

const keyRow = data[0];

await supabase .from('keys') .update({ used: true }) .eq('id', keyRow.id);

res.setHeader('Access-Control-Allow-Origin', '*'); return res.status(200).json({ key: keyRow.key }); }

// === File: /public/index.html (Frontend) ===

<!DOCTYPE html><html>
<head>
  <meta charset="UTF-8">
  <title>Nhận Key Duy Nhất</title>
</head>
<body>
  <h1>Key của bạn:</h1>
  <div id="keyBox">Đang tải key...</div>  <script>
    const keyBox = document.getElementById("keyBox");
    const savedKey = localStorage.getItem("userKey");

    if (savedKey) {
      keyBox.innerText = savedKey;
    } else {
      fetch("https://randomm-91ig.vercel.app/api/getkey")
        .then(r => r.json())
        .then(d => {
          if (d.key) {
            localStorage.setItem("userKey", d.key);
            keyBox.innerText = d.key;
          } else {
            keyBox.innerText = d.error || "Hết key.";
          }
        })
        .catch(() => {
          keyBox.innerText = "Không thể kết nối tới server.";
        });
    }
  </script></body>
</html>
