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
};

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
