import { Hono } from "hono";
import { cors } from "hono/cors";
import { contactRoute } from "./routes/contact";

type Bindings = {
  RESEND_API_KEY: string;
  LINE_CHANNEL_ACCESS_TOKEN: string;
  LINE_GROUP_ID: string;
  CONTACT_NOTIFICATION_EMAIL: string;
  ALLOWED_ORIGIN: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// CORS設定
app.use(
  "/api/*",
  cors({
    origin: (origin, c) => {
      const allowed = c.env.ALLOWED_ORIGIN || "http://localhost:3000";
      if (origin === allowed || origin === "http://localhost:3000") {
        return origin;
      }
      return null;
    },
    allowMethods: ["POST", "OPTIONS"],
    allowHeaders: ["Content-Type"],
  })
);

// ルート
app.route("/api", contactRoute);

// ヘルスチェック
app.get("/", (c) => c.json({ status: "ok", service: "live-inclusive-api" }));

export default app;
