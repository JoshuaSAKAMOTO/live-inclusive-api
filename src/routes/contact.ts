import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { contactSchema } from "../lib/validation";
import { sendAdminNotification, sendAutoReply } from "../services/resend";
import { sendLineNotification } from "../services/line";

type Bindings = {
  RESEND_API_KEY: string;
  LINE_CHANNEL_ACCESS_TOKEN: string;
  LINE_GROUP_ID: string;
  CONTACT_NOTIFICATION_EMAIL: string;
  TURNSTILE_SECRET_KEY: string;
};

async function verifyTurnstile(token: string, secretKey: string): Promise<boolean> {
  const response = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `secret=${secretKey}&response=${token}`,
    }
  );
  const result = await response.json() as { success: boolean };
  return result.success;
}

export const contactRoute = new Hono<{ Bindings: Bindings }>();

contactRoute.post(
  "/contact",
  zValidator("json", contactSchema, (result, c) => {
    if (!result.success) {
      return c.json(
        {
          success: false,
          message: "入力内容に誤りがあります",
          errors: result.error.flatten().fieldErrors,
        },
        400
      );
    }
  }),
  async (c) => {
    const data = c.req.valid("json");

    // Turnstile検証（必須）
    if (!data.turnstileToken) {
      return c.json(
        {
          success: false,
          message: "認証が必要です。ページを再読み込みしてください。",
        },
        400
      );
    }

    const isValid = await verifyTurnstile(data.turnstileToken, c.env.TURNSTILE_SECRET_KEY);
    if (!isValid) {
      return c.json(
        {
          success: false,
          message: "認証に失敗しました。ページを再読み込みしてもう一度お試しください。",
        },
        400
      );
    }

    try {
      // 並列で送信（どれかが失敗しても他は続行）
      const results = await Promise.allSettled([
        // 管理者へメール通知
        sendAdminNotification(
          c.env.RESEND_API_KEY,
          c.env.CONTACT_NOTIFICATION_EMAIL,
          data
        ),
        // 送信者への自動返信
        sendAutoReply(c.env.RESEND_API_KEY, data),
        // LINEグループへ通知
        sendLineNotification(
          c.env.LINE_CHANNEL_ACCESS_TOKEN,
          c.env.LINE_GROUP_ID,
          data
        ),
      ]);

      // エラーがあればログ出力（本番ではログサービスへ）
      results.forEach((result, index) => {
        if (result.status === "rejected") {
          console.error(`Notification ${index} failed:`, result.reason);
        }
      });

      // 少なくとも1つ成功していれば成功とみなす
      const hasSuccess = results.some((r) => r.status === "fulfilled");

      if (hasSuccess) {
        return c.json({
          success: true,
          message: "お問い合わせを受け付けました。確認メールをお送りしました。",
        });
      } else {
        throw new Error("All notifications failed");
      }
    } catch (error) {
      console.error("Contact form error:", error);
      return c.json(
        {
          success: false,
          message:
            "送信中にエラーが発生しました。お手数ですが、お電話にてお問い合わせください。",
        },
        500
      );
    }
  }
);
