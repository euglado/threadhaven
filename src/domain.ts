import { randomBytes } from "node:crypto";

export type Language = "en" | "tr";
export class UserError extends Error {}
export function language(value: string | null): Language {
  return value === "tr" ? "tr" : "en";
}
export function title(value: string): string {
  const clean = value.normalize("NFC").trim().replace(/ +/g, " ");
  // Single line, visible letters/numbers, plain punctuation. Reject mentions, links,
  // bidi/zero-width controls and formatting rather than silently changing them.
  if (
    clean.length < 3 ||
    clean.length > 80 ||
    !/[\p{L}\p{N}]/u.test(clean) ||
    /[^\p{L}\p{M}\p{N} .,!?'’():+-]/u.test(clean)
  ) {
    throw new UserError(
      "Use 3–80 plain characters; no links, mentions or formatting. / 3–80 sade karakter kullanın; bağlantı, etiket ve biçimlendirme kullanmayın.",
    );
  }
  return clean;
}
export function plan(value: string) {
  return Object.freeze({
    name: title(value),
    type: 11 as const,
    auto_archive_duration: 60 as const,
    rate_limit_per_user: 5,
  });
}
export function preview(name: string, parent: string, lang: Language): string {
  return lang === "tr"
    ? `ThreadHaven — özel önizleme\nBaşlık: ${name}\nKanal: ${parent}\nBu kanalı görebilen herkes başlığı görebilir.\n60 dakika hareketsizlik sonrası listeden kaldırma; 5 saniye yavaş mod.\nArşivleme silme değildir; etkinlik süreyi uzatabilir. Başlangıç mesajı gönderilmez.\nOluşturmak için onaylayın. Önizleme 5 dakika geçerlidir.`
    : `ThreadHaven — private preview\nTitle: ${name}\nChannel: ${parent}\nEveryone who can view this channel can view the thread.\nHide from list after 60 inactive minutes; 5-second slowmode.\nArchiving is not deletion; activity can extend the timer. No starter message is sent.\nConfirm to create. Preview expires in 5 minutes.`;
}
export const TTL = 5 * 60_000;
export interface Binding {
  user: string;
  guild: string;
  channel: string;
}
export interface Draft extends Binding {
  name: string;
  parent: string;
  lang: Language;
  message: string;
  expires: number;
}
export class Drafts {
  readonly items = new Map<string, Draft>();
  readonly limit: number;
  readonly now: () => number;
  constructor(limit = 100, now = Date.now) {
    this.limit = limit;
    this.now = now;
  }
  prune() {
    for (const [key, d] of this.items) if (d.expires <= this.now()) this.items.delete(key);
  }
  add(data: Omit<Draft, "expires" | "message">): string {
    this.prune();
    if (this.items.size >= this.limit)
      throw new UserError(
        "Preview capacity reached. Wait five minutes. / Önizleme kapasitesi doldu. Beş dakika bekleyin.",
      );
    const key = randomBytes(16).toString("hex");
    this.items.set(key, { ...data, message: "", expires: this.now() + TTL });
    return key;
  }
  bind(key: string, message: string) {
    const d = this.items.get(key);
    if (d) d.message = message;
  }
  take(key: string, binding: Binding, message: string): Draft | undefined {
    this.prune();
    const d = this.items.get(key);
    if (
      !d?.message ||
      d.message !== message ||
      d.user !== binding.user ||
      d.guild !== binding.guild ||
      d.channel !== binding.channel
    )
      return;
    this.items.delete(key); // consume before any await or write
    return d;
  }
}
export class Gate {
  readonly until = new Map<string, number>();
  readonly active = new Set<string>();
  readonly limit: number;
  readonly now: () => number;
  constructor(limit = 1000, now = Date.now) {
    this.limit = limit;
    this.now = now;
  }
  prune() {
    for (const [key, until] of this.until) if (until <= this.now()) this.until.delete(key);
  }
  enter(key: string, duration: number): boolean {
    this.prune();
    if (
      this.active.has(key) ||
      this.until.has(key) ||
      this.until.size >= this.limit ||
      this.active.size >= 100
    )
      return false;
    this.until.set(key, this.now() + duration);
    this.active.add(key);
    return true;
  }
  leave(key: string) {
    this.active.delete(key);
  }
}
