import { PermissionFlagsBits as P } from "discord.js";
import type { Snapshot } from "../src/access.ts";

export const ids = {
  guild: "100000000000000001",
  user: "200000000000000002",
  bot: "300000000000000003",
  channel: "400000000000000004",
  message: "500000000000000005",
  thread: "600000000000000006",
  manager: "700000000000000007",
  botRole: "800000000000000008",
};
export const binding = { user: ids.user, guild: ids.guild, channel: ids.channel };
export function roleAt(s: Snapshot, index: number) {
  const role = s.roles[index];
  if (!role) throw new Error("Fixture role missing");
  return role;
}
export function fixture(): Snapshot {
  return {
    guild: { id: ids.guild, owner_id: "900000000000000009" },
    roles: [
      { id: ids.guild, permissions: "0" },
      {
        id: ids.manager,
        permissions: (
          P.ManageGuild |
          P.ViewChannel |
          P.CreatePublicThreads |
          P.SendMessagesInThreads
        ).toString(),
      },
      { id: ids.botRole, permissions: (P.ViewChannel | P.CreatePublicThreads).toString() },
    ],
    channel: {
      id: ids.channel,
      guild_id: ids.guild,
      type: 0,
      name: "community",
      permission_overwrites: [],
    },
    member: { user: { id: ids.user }, roles: [ids.manager], pending: false },
    bot: { user: { id: ids.bot, bot: true }, roles: [ids.botRole], pending: false },
  };
}
