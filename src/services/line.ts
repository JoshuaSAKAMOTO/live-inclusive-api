import { ContactFormData, categoryLabels } from "../lib/validation";

export async function sendLineNotification(
  channelAccessToken: string,
  groupId: string,
  data: ContactFormData
): Promise<void> {
  const message = `【新規お問い合わせ】

■ お名前
${data.name}

■ メール
${data.email}

■ 電話番号
${data.phone || "未入力"}

■ カテゴリ
${categoryLabels[data.category]}

■ 内容
${data.message}`;

  const response = await fetch("https://api.line.me/v2/bot/message/push", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${channelAccessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      to: groupId,
      messages: [
        {
          type: "text",
          text: message,
        },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`LINE API error: ${error}`);
  }
}
