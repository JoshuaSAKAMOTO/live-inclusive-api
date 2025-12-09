import { Hono } from "hono";
import { cors } from "hono/cors";
import { contactRoute } from "./routes/contact";
import { lineWebhookRoute } from "./routes/line-webhook";

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
    origin: "*",
    allowMethods: ["POST", "OPTIONS"],
    allowHeaders: ["Content-Type"],
  })
);

// ルート
app.route("/api", contactRoute);
app.route("/api", lineWebhookRoute);

// ヘルスチェック
app.get("/", (c) => c.json({ status: "ok", service: "live-inclusive-api" }));

export default app;
