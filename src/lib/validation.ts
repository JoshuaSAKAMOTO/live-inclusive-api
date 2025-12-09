import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().min(1, "お名前を入力してください"),
  email: z.string().email("正しいメールアドレスを入力してください"),
  phone: z.string().optional(),
  category: z.enum(["ticket", "wheelchair", "sponsorship", "media", "other"], {
    errorMap: () => ({ message: "カテゴリを選択してください" }),
  }),
  message: z.string().min(1, "メッセージを入力してください"),
});

export type ContactFormData = z.infer<typeof contactSchema>;

export const categoryLabels: Record<ContactFormData["category"], string> = {
  ticket: "チケットについて",
  wheelchair: "車椅子席について",
  sponsorship: "協賛・後援について",
  media: "取材・メディアについて",
  other: "その他",
};
