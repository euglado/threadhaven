import { Client, GatewayIntentBits, Options, REST } from "discord.js";
export function makeRest(token: string) {
  return new REST({
    version: "10",
    retries: 0,
    timeout: 10_000,
    rejectOnRateLimit: () => true,
  }).setToken(token);
}
export function makeClient() {
  return new Client({
    intents: [GatewayIntentBits.Guilds],
    makeCache: Options.cacheWithLimits({
      ...Options.DefaultMakeCacheSettings,
      MessageManager: 0,
      GuildMemberManager: 0,
    }),
    rest: { retries: 0, timeout: 10_000, rejectOnRateLimit: () => true },
    allowedMentions: { parse: [], repliedUser: false },
  });
}
