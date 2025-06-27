export default function handler(req, res) {
  const random = Array.from({ length: 20 })
    .map(() => Math.floor(Math.random() * 16).toString(16))
    .join("");

  const key = `Phucan_${random}`;

  // ⚠️ Đặt header CORS TRƯỚC khi gửi JSON
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Content-Type", "application/json");

  res.status(200).json({ key });
}