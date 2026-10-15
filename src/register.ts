import { Routes } from "discord.js";
import { command } from "./command.ts";
import { config } from "./config.ts";
import { makeRest } from "./runtime.ts";

try {
  const settings = config();
  const rest = makeRest(settings.token);
  const identity = (await rest.get("/users/@me")) as { id: string; bot: boolean };
  if (!identity.bot || identity.id !== settings.applicationId)
    throw new Error("Application mismatch");
  // POST creates or updates only this command; never bulk-replace other commands.
  await rest.post(Routes.applicationGuildCommands(settings.applicationId, settings.guildId), {
    body: command.toJSON(),
  });
  console.log("/threadhaven registered for this server / Bu sunucu için kaydedildi.");
} catch {
  console.error(
    "Registration failed. Run npm run setup; verify application/server IDs, token, invitation and network. / Kayıt başarısız. npm run setup çalıştırın; uygulama/sunucu kimliğini, tokenı, daveti ve ağı kontrol edin.",
  );
  process.exitCode = 1;
}
