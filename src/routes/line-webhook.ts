import { Hono } from "hono";

type Bindings = {
  LINE_CHANNEL_ACCESS_TOKEN: string;
};

interface LineEvent {
  type: string;
  source: {
    type: string;
    groupId?: string;
    userId?: string;
  };
  message?: {
    type: string;
    text: string;
  };
}

interface LineWebhookBody {
  events: LineEvent[];
}

export const lineWebhookRoute = new Hono<{ Bindings: Bindings }>();

// LINE Webhook検証用（署名検証は省略 - 本番では実装推奨）
lineWebhookRoute.post("/line/webhook", async (c) => {
  try {
    const body: LineWebhookBody = await c.req.json();

    console.log("=== LINE Webhook Received ===");
    console.log(JSON.stringify(body, null, 2));

    for (const event of body.events) {
      // グループに追加された時、またはグループでメッセージを受信した時
      if (event.source.type === "group" && event.source.groupId) {
        console.log("========================================");
        console.log("🎉 GROUP ID FOUND:", event.source.groupId);
        console.log("========================================");
      }
    }

    // LINEには常に200を返す
    return c.json({ status: "ok" });
  } catch (error) {
    console.error("Webhook error:", error);
    return c.json({ status: "ok" });
  }
});
