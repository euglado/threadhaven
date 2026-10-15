import { PermissionFlagsBits as P, type REST, Routes } from "discord.js";
import { type Binding, UserError } from "./domain.ts";

export interface Role {
  id: string;
  permissions: string;
}
export interface Member {
  user: { id: string; bot?: boolean };
  roles: string[];
  pending?: boolean;
  communication_disabled_until?: string | null;
}
export interface Channel {
  id: string;
  guild_id: string;
  name: string;
  type: number;
  nsfw?: boolean;
  flags?: number;
  rate_limit_per_user?: number;
  permission_overwrites: { id: string; type: number; allow: string; deny: string }[];
}
export interface Snapshot {
  guild: { id: string; owner_id: string };
  roles: Role[];
  channel: Channel;
  member: Member;
  bot: Member;
}
export function base(member: Member, roles: Role[], guild: string): bigint {
  const ids = new Set([guild, ...member.roles]);
  if ([...ids].some((id) => !roles.some((role) => role.id === id))) throw new Error("Missing role");
  return roles.filter((r) => ids.has(r.id)).reduce((bits, r) => bits | BigInt(r.permissions), 0n);
}
export function effective(member: Member, snapshot: Snapshot): bigint {
  const bits = base(member, snapshot.roles, snapshot.guild.id);
  if (member.user.id === snapshot.guild.owner_id || bits & P.Administrator) return ~0n;
  const list = snapshot.channel.permission_overwrites;
  let result = bits;
  const everyone = list.find((o) => o.type === 0 && o.id === snapshot.guild.id);
  if (everyone) result = (result & ~BigInt(everyone.deny)) | BigInt(everyone.allow);
  const applicable = list.filter(
    (o) => o.type === 0 && member.roles.includes(o.id) && o.id !== snapshot.guild.id,
  );
  const deny = applicable.reduce((b, o) => b | BigInt(o.deny), 0n);
  const allow = applicable.reduce((b, o) => b | BigInt(o.allow), 0n);
  result = (result & ~deny) | allow;
  const own = list.find((o) => o.type === 1 && o.id === member.user.id);
  if (own) result = (result & ~BigInt(own.deny)) | BigInt(own.allow);
  return result;
}
const REQUIRED = P.ViewChannel | P.CreatePublicThreads;
export function authorize(s: Snapshot, binding: Binding, botId: string, now = Date.now()): string {
  if (
    s.guild.id !== binding.guild ||
    s.channel.guild_id !== binding.guild ||
    s.channel.id !== binding.channel ||
    s.member.user.id !== binding.user ||
    s.bot.user.id !== botId ||
    s.member.user.bot ||
    !s.bot.user.bot
  )
    throw new Error("Identity mismatch");
  if (
    s.channel.type !== 0 ||
    s.channel.nsfw ||
    (s.channel.rate_limit_per_user ?? 0) > 0 ||
    typeof s.channel.name !== "string" ||
    !s.channel.name.length ||
    s.channel.name.length > 100 ||
    ((s.channel.flags ?? 0) & (1 << 17)) !== 0
  )
    throw new UserError(
      "Use a regular, non-age-restricted text channel without parent slowmode. / Yavaş modu kapalı, yaş kısıtlaması olmayan normal metin kanalı kullanın.",
    );
  for (const m of [s.member, s.bot]) {
    if (
      m.pending ||
      (m.communication_disabled_until &&
        (!Number.isFinite(Date.parse(m.communication_disabled_until)) ||
          Date.parse(m.communication_disabled_until) > now))
    )
      throw new UserError(
        "Complete server screening and wait for timeouts to end. / Sunucu kabul adımlarını tamamlayın ve zaman aşımının bitmesini bekleyin.",
      );
  }
  if ((base(s.bot, s.roles, s.guild.id) & P.Administrator) !== 0n || s.guild.owner_id === botId)
    throw new UserError(
      "Remove Administrator from the bot's roles. / Botun rollerinden Yönetici iznini kaldırın.",
    );
  const user = effective(s.member, s);
  const bot = effective(s.bot, s);
  if (
    (user & REQUIRED) !== REQUIRED ||
    !(user & P.ManageGuild) ||
    !(user & P.SendMessagesInThreads) ||
    (bot & REQUIRED) !== REQUIRED
  )
    throw new UserError(
      "You need Manage Server, View Channel, Create Public Threads and Send Messages in Threads. Bot needs View Channel and Create Public Threads. / Sizde Sunucuyu Yönet, Kanalı Görüntüle, Herkese Açık Alt Başlık Oluştur ve Alt Başlıklarda Mesaj Gönder; botta Kanalı Görüntüle ve Herkese Açık Alt Başlık Oluştur izinleri gerekir.",
    );
  return s.channel.name;
}
export async function fresh(
  rest: Pick<REST, "get">,
  binding: Binding,
  botId: string,
): Promise<Snapshot> {
  const [guild, roles, channel, member, bot] = await Promise.all([
    rest.get(Routes.guild(binding.guild)),
    rest.get(Routes.guildRoles(binding.guild)),
    rest.get(Routes.channel(binding.channel)),
    rest.get(Routes.guildMember(binding.guild, binding.user)),
    rest.get(Routes.guildMember(binding.guild, botId)),
  ]);
  return { guild, roles, channel, member, bot } as Snapshot;
}
