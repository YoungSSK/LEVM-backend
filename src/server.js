import express, { json } from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import connectDB from "./libs/db.js";
import authRoute from "./routes/authRouter.js";
import swaggerUi from "swagger-ui-express";
import fs from "fs";
dotenv.config();
const app = express();
const PORT = process.env.PORT || 5001;
app.set("trust proxy", 1);
//middleware
app.use(express.json());
app.use(cookieParser());

// swagger
const swaggerDocument = JSON.parse(
  fs.readFileSync("./src/swagger.json", "utf8"),
);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
//public router
app.use("/api/auth", authRoute);

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server bắt đầu trên cổng ${PORT}`);
  });
});
