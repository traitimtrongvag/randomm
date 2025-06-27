import fs from "fs/promises";
import path from "path";

export default async function handler(req, res) {
  const filePath = path.join(process.cwd(), "keys.txt");

  try {
    const data = await fs.readFile(filePath, "utf8");
    const keys = data.split("\n").filter(Boolean);

    if (keys.length === 0) {
      return res.status(404).json({ error: "No keys left" });
    }

    const key = keys[0];
    const remaining = keys.slice(1);

    // ❗ Vercel sẽ không ghi được file này đâu, nhưng ta vẫn thử
    try {
      await fs.writeFile(filePath, remaining.join("\n"));
    } catch {
      // Không cần thiết: không ghi được cũng không sao
    }

    return res.json({ key });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
