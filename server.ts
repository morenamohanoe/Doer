import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { initializeApp, getApps, applicationDefault } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

if (getApps().length === 0) {
  initializeApp({
    credential: applicationDefault(),
  });
}

async function startServer() {
  const app = express();
  app.use(express.json());

  const PORT = 3000;

  // API routes
  app.post("/api/set-admin-role", async (req, res) => {
    const { uid } = req.body;
    if (!uid) {
      return res.status(400).send("UID is required");
    }
    try {
      await getAuth().setCustomUserClaims(uid, { role: "admin" });
      res.status(200).send("Admin role set successfully");
    } catch (error) {
      console.error("Error setting admin claim:", error);
      res.status(500).send("Error setting admin role");
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
