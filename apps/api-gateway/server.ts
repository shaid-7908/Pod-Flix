import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import cors from "cors";
const app = express();
const PORT = 3000;
// 🔓 Enable CORS for all origins and methods


app.use(
  cors({
    origin: "http://localhost:5173", // your frontend URL (adjust as needed)
    credentials: true,              // allow cookies if needed
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);



// Proxy setup
app.use(
  "/user",
  createProxyMiddleware({
    target: "http://localhost:4001",
    changeOrigin: true,
    pathRewrite: { "^/user": "" },
  })
);


app.use(
  "/upload",
  createProxyMiddleware({
    target: "http://localhost:4002",
    changeOrigin: true,
    pathRewrite: { "^/upload": "" },
  })
);

app.use(
  "/video",
  createProxyMiddleware({
    target: "http://localhost:4003",
    changeOrigin: true,
    pathRewrite: { "^/video": "" },
  })
);

app.listen(PORT, () => {
  console.log(`API Gateway running at http://localhost:${PORT}`);
});
