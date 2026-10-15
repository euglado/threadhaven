export function config(env: NodeJS.ProcessEnv = process.env) {
  const token = env.DISCORD_TOKEN?.trim();
  const applicationId = env.APPLICATION_ID?.trim();
  const guildId = env.GUILD_ID?.trim();
  if (
    !token ||
    !/^[A-Za-z0-9._-]{20,200}$/.test(token) ||
    !/^\d{17,20}$/.test(applicationId ?? "") ||
    !/^\d{17,20}$/.test(guildId ?? "")
  ) {
    throw new Error("Run npm run setup / Önce npm run setup çalıştırın.");
  }
  return { token, applicationId: applicationId as string, guildId: guildId as string };
}
