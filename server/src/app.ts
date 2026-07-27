import express from "express";
import cors from "cors";
import authRoutes from './routes/auth.routes';
import folderRoutes from './routes/folder.routes';
import fileRoutes from './routes/file.routes';

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "DriveX Backend is Running 🚀",
  });
});
app.use('/api/files', fileRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/folders', folderRoutes);

export default app;