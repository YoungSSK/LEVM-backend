import express from "express";
import https from "https";
import http from "http";

const router = express.Router();

/**
 * GET /api/image-proxy?url=<encoded_url>
 *
 * Proxy external images through our backend to bypass CORS restrictions
 * when Flutter Web (CanvasKit) tries to load external images.
 */
router.get("/", (req, res) => {
  const { url } = req.query;

  if (!url || typeof url !== "string") {
    return res.status(400).json({ success: false, message: "Missing ?url= parameter" });
  }

  try {
    const parsedUrl = new URL(url);
    const client = parsedUrl.protocol === "https:" ? https : http;

    const proxyReq = client.get(
      url,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        },
        timeout: 15000,
      },
      (proxyRes) => {
        // Handle redirects
        if ([301, 302, 303, 307, 308].includes(proxyRes.statusCode)) {
          const redirectUrl = proxyRes.headers.location;
          if (redirectUrl) {
            return res.redirect(redirectUrl);
          }
        }

        if (proxyRes.statusCode !== 200) {
          return res.status(502).json({ success: false, message: `Upstream returned ${proxyRes.statusCode}` });
        }

        const contentType = proxyRes.headers["content-type"] || "image/jpeg";
        res.set({
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=86400",
          "Access-Control-Allow-Origin": "*",
        });

        proxyRes.pipe(res);
      },
    );

    proxyReq.on("error", (err) => {
      console.error("[image-proxy] Request error:", url, err.message);
      if (!res.headersSent) {
        res.status(502).json({ success: false, message: "Failed to fetch image" });
      }
    });

    proxyReq.on("timeout", () => {
      proxyReq.destroy();
      if (!res.headersSent) {
        res.status(504).json({ success: false, message: "Image fetch timed out" });
      }
    });
  } catch (err) {
    console.error("[image-proxy] Error:", err.message);
    return res.status(400).json({ success: false, message: "Invalid URL" });
  }
});

export default router;
