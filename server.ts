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

  // SEO robots.txt endpoint
  app.get("/robots.txt", (req, res) => {
    res.type("text/plain");
    res.send(
      `User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /admin\nSitemap: https://doer.co.za/sitemap.xml`
    );
  });

  // SEO sitemap.xml endpoint
  app.get("/sitemap.xml", (req, res) => {
    res.type("application/xml");
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://doer.co.za/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://doer.co.za/?tab=home</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://doer.co.za/?tab=dashboard</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://doer.co.za/?tab=wallet</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://doer.co.za/?tab=profile</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>`;
    res.send(sitemap);
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
