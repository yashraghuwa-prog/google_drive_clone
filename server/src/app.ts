import express from "express";

const app = express();

// Middleware
app.use(express.json());

// Health Check Route
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "DriveX Backend is Running 🚀",
  });
});

export default app;
