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
import { authMiddleware } from "./middlewares/authMiddleware.js";
import swaggerUi from "swagger-ui-express";
import fs from "fs";

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
connectDB().then(() => {
  // Share cookie options with controllers (so dev/prod parity is 1-file).
  app.locals.refreshCookieOptions = refreshCookieOptions;

  app.listen(PORT, () => {
    console.log(`Server bắt đầu trên cổng ${PORT}`);
  });
});

// Shared cookie options — `secure: false` in dev so cookies survive plain
// http://10.0.2.2 / http://localhost, but `secure: true` in production.
export const refreshCookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? "none" : "lax",
  maxAge: 14 * 24 * 60 * 60 * 1000,
};
