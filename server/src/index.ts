import "dotenv/config";
import { createApp } from "./app.js";
import { PORT } from "./config.js";

const app = createApp();
app.listen(PORT, () => {
  console.log(`API listening on http://127.0.0.1:${PORT}`);
});
