import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
export const command = new SlashCommandBuilder()
  .setName("threadhaven")
  .setDescription("Privately preview a public discussion thread before creating it")
  .setDescriptionLocalizations({
    tr: "Herkese açık tartışma başlığını oluşturmadan önce özel önizleyin",
  })
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .addStringOption((o) =>
    o
      .setName("title")
      .setDescription("3–80 plain characters; no links or mentions")
      .setRequired(true)
      .setMinLength(3)
      .setMaxLength(80),
  )
  .addStringOption((o) =>
    o
      .setName("language")
      .setDescription("Preview language / Önizleme dili")
      .addChoices({ name: "Türkçe", value: "tr" }, { name: "English", value: "en" }),
  );
