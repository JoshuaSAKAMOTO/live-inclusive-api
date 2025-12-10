import { ContactFormData, categoryLabels } from "../lib/validation";

interface ResendEmailOptions {
  apiKey: string;
  to: string;
  from: string;
  subject: string;
  html: string;
}

async function sendEmail(options: ResendEmailOptions): Promise<void> {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${options.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: options.from,
      to: options.to,
      subject: options.subject,
      html: options.html,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Resend API error: ${error}`);
  }
}

export async function sendAdminNotification(
  apiKey: string,
  adminEmail: string,
  data: ContactFormData
): Promise<void> {
  const html = `
    <h2>新しいお問い合わせ</h2>
    <table style="border-collapse: collapse; width: 100%; max-width: 600px;">
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd; background: #f5f5f5; width: 120px;"><strong>お名前</strong></td>
        <td style="padding: 8px; border: 1px solid #ddd;">${data.name}</td>
      </tr>
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd; background: #f5f5f5;"><strong>メール</strong></td>
        <td style="padding: 8px; border: 1px solid #ddd;"><a href="mailto:${data.email}">${data.email}</a></td>
      </tr>
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd; background: #f5f5f5;"><strong>電話番号</strong></td>
        <td style="padding: 8px; border: 1px solid #ddd;">${data.phone || "未入力"}</td>
      </tr>
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd; background: #f5f5f5;"><strong>カテゴリ</strong></td>
        <td style="padding: 8px; border: 1px solid #ddd;">${categoryLabels[data.category]}</td>
      </tr>
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd; background: #f5f5f5;"><strong>お問い合わせ内容</strong></td>
        <td style="padding: 8px; border: 1px solid #ddd; white-space: pre-wrap;">${data.message}</td>
      </tr>
    </table>
  `;

  await sendEmail({
    apiKey,
    to: adminEmail,
    from: "info@zushiliveinclusive.com",
    subject: `【お問い合わせ】${categoryLabels[data.category]} - ${data.name}様`,
    html,
  });
}

export async function sendAutoReply(
  apiKey: string,
  data: ContactFormData
): Promise<void> {
  const html = `
    <p>${data.name} 様</p>
    <p>この度は逗子ライブインクルーシブにお問い合わせいただき、誠にありがとうございます。</p>
    <p>以下の内容でお問い合わせを受け付けました。</p>
    <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
    <p><strong>カテゴリ:</strong> ${categoryLabels[data.category]}</p>
    <p><strong>お問い合わせ内容:</strong></p>
    <p style="white-space: pre-wrap; background: #f5f5f5; padding: 15px;">${data.message}</p>
    <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
    <p>内容を確認の上、担当者より折り返しご連絡いたします。</p>
    <p>今しばらくお待ちくださいますようお願い申し上げます。</p>
    <br>
    <p style="color: #666; font-size: 12px;">※こちらのご案内は送信専用アドレスから送信しております。ご連絡の際は下記アドレスにお願いいたします。</p>
    <br>
    <p>━━━━━━━━━━━━━━━━━━━━</p>
    <p>逗子ライブインクルーシブ実行委員会</p>
    <p>Email: zushilive2025@gmail.com</p>
    <p>Tel: 050-3578-2929</p>
    <p>━━━━━━━━━━━━━━━━━━━━</p>
  `;

  await sendEmail({
    apiKey,
    to: data.email,
    from: "info@zushiliveinclusive.com",
    subject: "【逗子ライブインクルーシブ】お問い合わせを受け付けました",
    html,
  });
}
