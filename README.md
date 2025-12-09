# Live Inclusive API

逗子ライブインクルーシブのバックエンドAPI。Cloudflare Workers + Hono.jsで構築。

## 技術スタック

- **Runtime**: Cloudflare Workers
- **Framework**: Hono.js
- **Validation**: Zod
- **Email**: Resend
- **Notification**: LINE Messaging API

## API エンドポイント

### `POST /api/contact`

お問い合わせフォームからの送信を処理。

**リクエスト:**
```json
{
  "name": "お名前（必須）",
  "email": "メールアドレス（必須）",
  "phone": "電話番号（任意）",
  "category": "ticket | wheelchair | sponsorship | media | other（必須）",
  "message": "お問い合わせ内容（必須）"
}
```

**レスポンス:**
```json
{
  "success": true,
  "message": "お問い合わせを受け付けました。確認メールをお送りしました。"
}
```

**処理内容:**
1. 管理者へメール通知（Resend経由）
2. 送信者へ自動返信メール（Resend経由）
3. LINEグループへ通知（LINE Messaging API経由）

### `POST /api/line/webhook`

LINE Messaging API用のWebhookエンドポイント。グループID取得に使用。

## 環境変数（Secrets）

Cloudflare Workers Settingsで設定:

| 変数名 | 説明 |
|--------|------|
| `RESEND_API_KEY` | Resend APIキー |
| `LINE_CHANNEL_ACCESS_TOKEN` | LINE Messaging APIのチャンネルアクセストークン |
| `LINE_GROUP_ID` | 通知先LINEグループのID |
| `CONTACT_NOTIFICATION_EMAIL` | 管理者通知先メールアドレス |

wrangler.tomlで設定:

| 変数名 | 説明 |
|--------|------|
| `ALLOWED_ORIGIN` | CORS許可オリジン（現在は `*` で全許可） |

## デプロイ

```bash
export CLOUDFLARE_API_TOKEN=your-token
npx wrangler deploy
```

## ローカル開発

```bash
npm install
npm run dev
```

---

## 作業ログ

### 2025-12-09: お問い合わせフォーム機能実装

**実装内容:**
- Hono.jsベースのAPIサーバー構築
- Zodによるリクエストバリデーション
- Resendによるメール送信（管理者通知 + 自動返信）
- LINE Messaging APIによるグループ通知
- LINE Webhookエンドポイント（グループID取得用）
- CORS設定

**外部サービス設定:**
- Resend: ドメイン認証完了（zushiliveinclusive.com）
- LINE Developers: Messaging APIチャンネル作成、Webhook設定
- Cloudflare Workers: シークレット設定完了

**動作確認:**
- ✅ フォーム送信
- ✅ LINEグループ通知
- ✅ 送信者への自動返信メール
- ✅ 管理者メール通知（Gmail宛で動作確認済み）

---

## 既知の問題

### support@zushiliveinclusive.com へのメール不達

**状況:**
- Resendからは `Sent` ステータスで送信されている
- さくらインターネットのメールサーバーで受信されていない
- 同じドメインの別アドレス（Gmail等）では正常に受信できる

**原因（推定）:**
- さくらインターネット側のスパムフィルタ
- または受信サーバーの設定問題

**現在の対処:**
- `CONTACT_NOTIFICATION_EMAIL` を別のメールアドレス（Gmail等）に設定
- LINE通知が正常動作しているため、運用上の支障なし

**将来の対応:**
- さくらインターネットのサポートに問い合わせ
- または新しいメールアドレス（contact@など）を作成して使用
