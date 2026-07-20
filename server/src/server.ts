import app from "./app";

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`🚀 DriveX Backend running on http://localhost:${PORT}`);
});