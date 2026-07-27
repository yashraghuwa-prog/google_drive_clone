import app from "./app";
import { ensureUploadDir } from "./lib/storage";

const PORT = process.env.PORT || 5001;

ensureUploadDir().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 DriveX Backend running on http://localhost:${PORT}`);
  });
});