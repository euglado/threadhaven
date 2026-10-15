import {
  ActionRowBuilder,
  ButtonBuilder,
  type ButtonInteraction,
  ButtonStyle,
  type ChatInputCommandInteraction,
  MessageFlags,
  type REST,
  Routes,
} from "discord.js";
import { authorize, fresh } from "./access.ts";
import { type Binding, Drafts, Gate, language, plan, preview, UserError } from "./domain.ts";

export const SAFE_MENTIONS = {
  parse: [] as ("roles" | "users" | "everyone")[],
  repliedUser: false,
};
const ERROR =
  "Check your permissions and channel settings, then try a new preview. / İzinleri ve kanal ayarlarını kontrol edip yeni önizleme açın.";
const UNCERTAIN =
  "Creation may have succeeded. Check the channel's thread list before trying again; this confirmation cannot retry. / Başlık oluşmuş olabilir. Tekrar denemeden önce kanalın başlık listesini kontrol edin; bu onay tekrar kullanılamaz.";
type Interaction = ChatInputCommandInteraction | ButtonInteraction;
export function createHandler(
  rest: Pick<REST, "get" | "post">,
  botId: string,
  guildId: string,
  now = Date.now,
) {
  const drafts = new Drafts(100, now);
  const forms = new Gate(1000, now);
  const creates = new Gate(1000, now);
  async function handle(i: Interaction) {
    const isCommand = i.isChatInputCommand() && i.commandName === "threadhaven";
    const isButton = i.isButton() && i.customId.startsWith("th:");
    if (!isCommand && !isButton) return;
    let gate: Gate | undefined;
    let gateKey = "";
    let writeAttempted = false;
    let key: string | undefined;
    try {
      if (!i.inGuild() || i.guildId !== guildId) {
        await i.reply({
          content: ERROR,
          flags: MessageFlags.Ephemeral,
          allowedMentions: SAFE_MENTIONS,
        });
        return;
      }
      const binding: Binding = { user: i.user.id, guild: i.guildId, channel: i.channelId };
      if (i.isChatInputCommand()) {
        gate = forms;
        gateKey = `${binding.guild}:${binding.user}`;
        if (!gate.enter(gateKey, 5_000)) {
          gate = undefined;
          throw new UserError(
            "Wait five seconds or for your current preview to finish. / Beş saniye veya mevcut önizlemenizin bitmesini bekleyin.",
          );
        }
        await i.deferReply({ flags: MessageFlags.Ephemeral });
        const thread = plan(i.options.getString("title", true));
        const lang = language(i.options.getString("language") ?? (i.locale === "tr" ? "tr" : "en"));
        const parent = authorize(await fresh(rest, binding, botId), binding, botId, now());
        key = drafts.add({ ...binding, name: thread.name, lang, parent });
        const components = new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId(`th:create:${key}`)
            .setStyle(ButtonStyle.Primary)
            .setLabel(lang === "tr" ? "Herkese açık başlık oluştur" : "Create public thread"),
          new ButtonBuilder()
            .setCustomId(`th:cancel:${key}`)
            .setStyle(ButtonStyle.Secondary)
            .setLabel(lang === "tr" ? "Vazgeç" : "Discard"),
        );
        const response = await i.editReply({
          content: preview(thread.name, parent, lang),
          components: [components],
          allowedMentions: SAFE_MENTIONS,
        });
        drafts.bind(key, response.id);
      } else if (i.isButton()) {
        const match = /^th:(create|cancel):([a-f0-9]{32})$/.exec(i.customId);
        if (!match || !i.message.flags.has(MessageFlags.Ephemeral) || i.message.author.id !== botId)
          throw new Error("Invalid control");
        const draft = drafts.take(match[2] as string, binding, i.message.id);
        if (!draft)
          throw new UserError(
            "Preview expired, used, or belongs elsewhere. Run /threadhaven again. / Önizleme süresi dolmuş, kullanılmış veya başka yere ait. /threadhaven komutunu yeniden kullanın.",
          );
        await i.deferUpdate();
        await i.editReply({
          content: draft.lang === "tr" ? "İşleniyor…" : "Processing…",
          components: [],
          allowedMentions: SAFE_MENTIONS,
        });
        if (match[1] === "cancel") {
          await i.editReply({
            content:
              draft.lang === "tr"
                ? "Vazgeçildi; başlık oluşturulmadı."
                : "Discarded; no thread created.",
            components: [],
            allowedMentions: SAFE_MENTIONS,
          });
          return;
        }
        gate = creates;
        gateKey = `${binding.guild}:${binding.channel}`;
        if (!gate.enter(gateKey, 60_000)) {
          gate = undefined;
          throw new UserError(
            "This channel is busy. Wait 60 seconds and make a new preview. / Kanal meşgul. 60 saniye bekleyip yeni önizleme açın.",
          );
        }
        if (draft.expires <= now()) throw new Error("Expired");
        const parent = authorize(await fresh(rest, binding, botId), binding, botId, now());
        if (parent !== draft.parent || draft.expires <= now())
          throw new Error("Preview changed or expired");
        writeAttempted = true;
        const result = (await rest.post(Routes.threads(binding.channel), {
          body: plan(draft.name),
          reason: "Confirmed public discussion thread",
        })) as { id?: string; parent_id?: string; guild_id?: string; type?: number };
        if (
          !/^\d{17,20}$/.test(result.id ?? "") ||
          result.parent_id !== binding.channel ||
          result.guild_id !== binding.guild ||
          result.type !== 11
        )
          throw new Error("Unexpected result");
        const url = `https://discord.com/channels/${binding.guild}/${result.id}`;
        await i.editReply({
          content:
            draft.lang === "tr"
              ? `Başlık oluşturuldu. Açmak için bağlantı: ${url}`
              : `Thread created. Open it here: ${url}`,
          components: [],
          allowedMentions: SAFE_MENTIONS,
        });
      }
    } catch (error) {
      if (key) drafts.items.delete(key);
      const content = writeAttempted
        ? UNCERTAIN
        : error instanceof UserError
          ? error.message
          : ERROR;
      try {
        if (i.deferred || i.replied)
          await i.editReply({ content, components: [], allowedMentions: SAFE_MENTIONS });
        else
          await i.reply({ content, flags: MessageFlags.Ephemeral, allowedMentions: SAFE_MENTIONS });
      } catch {
        /* Never log interaction tokens, titles, IDs or raw API errors. */
      }
    } finally {
      gate?.leave(gateKey);
    }
  }
  return {
    handle,
    prune() {
      drafts.prune();
      forms.prune();
      creates.prune();
    },
    drafts,
    forms,
    creates,
  };
}
