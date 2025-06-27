const express = require("express");
const fs = require("fs");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors()); // Cho phép frontend từ domain khác

app.get("/api/getkey", (req, res) => {
  const filePath = "key.txt";

  // Đọc toàn bộ key
  let keys = fs.readFileSync(filePath, "utf-8").split("\n").filter(Boolean);

  if (keys.length === 0) {
    return res.status(404).json({ error: "No keys left" });
  }

  const key = keys.shift(); // lấy dòng đầu tiên

  fs.writeFileSync(filePath, keys.join("\n")); // cập nhật file sau khi xoá dòng đầu

  return res.json({ key });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
