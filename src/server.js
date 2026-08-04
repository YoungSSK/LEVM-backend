import express, { json } from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import connectDB from "./libs/db.js";
import authRoute from "./routes/authRouter.js";
import userRoute from "./routes/userRouter.js";
import occupationRouter from "./routes/occupationRouter.js";
import occupationCategoryRoute from "./routes/occupationCategoryRoute.js";
import vocabularyTopicRoutes from "./routes/vocabularyTopicRoute.js";
import vocabularyLessonRoutes from "./routes/vocabularyLessonRoute.js";
import grammarDocumentRoutes from "./routes/grammarDocumentRoutes.js";
import wordRoute from "./routes/wordRoute.js";
import wordMeaningRoute from "./routes/wordMeaningRoute.js";
import grammarTopicRoute from "./routes/grammarTopicRoute.js";
import grammarLessonRoute from "./routes/grammarLessonRoute.js";
import grammarQuizRoute from "./routes/grammarQuizRoute.js";
import cors from "cors";
import uploadRouter from "./routes/uploadRouter.js";
import xpRoutes from "./routes/xpRoutes.js";
import streakRoutes from "./routes/streakRoutes.js";
import attemptRoutes from "./routes/attemptRoutes.js";
import spellingRoutes from "./routes/spellingRoutes.js";
import readingCategoryRoute from "./routes/readingCategoryRoute.js";
import readingPassageRoute from "./routes/readingPassageRoute.js";
import readingQuestionRoute from "./routes/readingQuestionRoute.js";
import readingAttemptRoute from "./routes/readingAttemptRoute.js";
import listeningRoute from "./routes/listeningRoute.js";
import { authMiddleware } from "./middlewares/authMiddleware.js";
import swaggerUi from "swagger-ui-express";
import fs from "fs";
import packageRoute from "./routes/packageRoute.js";
import subscriptionRoute, { webhookRouter } from "./routes/subscriptionRoute.js";
import { expireSubscriptions } from "./services/subscriptionService.js";
import imageProxyRoute from "./routes/imageProxyRoute.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5001;
app.set("trust proxy", 1);

const isProd = process.env.NODE_ENV === "production";

// Static files for uploads
app.use("/uploads", express.static("uploads"));
//middleware
app.use(express.json());
app.use(cookieParser());

// CORS: in dev we whitelist anything so the Flutter app (running on the
// Android emulator at 10.0.2.2, or on a real device on the LAN) can hit us
// without CORS preflight failures. In production we fall back to CLIENT_URL.
const allowedOrigins = (process.env.CLIENT_URL || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      if (!isProd) return cb(null, true); // dev: allow all
      if (!origin) return cb(null, true); // same-origin / curl
      if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        return cb(null, true);
      }
      return cb(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
  }),
);

// swagger
const swaggerDocument = JSON.parse(
  fs.readFileSync("./src/swagger.json", "utf8"),
);
//Swager
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
//public router
app.use("/api/auth", authRoute);

// Webhook VNPay — public, PHẢI mount TRƯỚC authMiddleware
// VNPay callback không có JWT token
app.use("/api/webhooks/payment", webhookRouter);

// Image proxy — public, bypass CORS for Flutter Web
app.use("/api/image-proxy", imageProxyRoute);

//pivate router
app.use(authMiddleware);
app.use("/api/users", userRoute);
app.use("/api/occupation-categories", occupationCategoryRoute);
app.use("/api/occupations", occupationRouter);
app.use("/api/vocabulary-topics", vocabularyTopicRoutes);
app.use("/api/vocabulary-lessons", vocabularyLessonRoutes);
app.use("/api/words", wordRoute);
app.use("/api/word-meanings", wordMeaningRoute);
app.use("/api/grammar-topics", grammarTopicRoute);
app.use("/api/grammar-lessons", grammarLessonRoute);
app.use("/api/grammar", grammarQuizRoute);
app.use("/api/grammar-documents", grammarDocumentRoutes);
app.use("/api/upload", uploadRouter);
app.use("/api/xp", xpRoutes);
app.use("/api/streak", streakRoutes);
app.use("/api/attempts", attemptRoutes);
app.use("/api/spelling", spellingRoutes);
app.use("/api/reading-categories", readingCategoryRoute);
app.use("/api/reading-passages", readingPassageRoute);
app.use("/api/reading-questions", readingQuestionRoute);
app.use("/api/reading-attempts", readingAttemptRoute);
app.use("/api/listening", listeningRoute);

// Membership routes
app.use("/api/packages", packageRoute);
// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Unhandled Route Error:", err);
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || "Lỗi hệ thống";
  return res.status(statusCode).json({
    success: false,
    message,
  });
});

connectDB().then(() => {
  // Share cookie options with controllers (so dev/prod parity is 1-file).
  app.locals.refreshCookieOptions = refreshCookieOptions;

  app.listen(PORT, () => {
    console.log(`Server bắt đầu trên cổng ${PORT}`);
  });

  // ── Cron: expire subscriptions hằng ngày lúc 00:05 ──────────────────────────
  // Không dùng thư viện ngoài — dùng setInterval đơn giản (fire every 24h)
  // Để dùng cron expression thật, cài thêm: npm install node-cron
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  const scheduleDailyExpiry = () => {
    const now = new Date();
    // Tính thời gian đến 00:05 ngày mai
    const next = new Date(now);
    next.setHours(0, 5, 0, 0);
    if (next <= now) next.setDate(next.getDate() + 1);
    const delay = next.getTime() - now.getTime();

    setTimeout(async () => {
      console.log("[Cron] Chạy expireSubscriptions...");
      try {
        await expireSubscriptions();
      } catch (err) {
        console.error("[Cron] expireSubscriptions lỗi:", err);
      }
      // Schedule lại cho ngày tiếp theo
      setInterval(async () => {
        console.log("[Cron] Chạy expireSubscriptions...");
        try { await expireSubscriptions(); } catch (err) {
          console.error("[Cron] expireSubscriptions lỗi:", err);
        }
      }, MS_PER_DAY);
    }, delay);

    console.log(`[Cron] expireSubscriptions lên lịch lúc ${next.toISOString()}`);
  };
  scheduleDailyExpiry();
});

// Shared cookie options — `secure: false` in dev so cookies survive plain
// http://10.0.2.2 / http://localhost, but `secure: true` in production.
export const refreshCookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? "none" : "lax",
  maxAge: 14 * 24 * 60 * 60 * 1000,
};
