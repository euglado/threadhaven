import { Events } from "discord.js";
import { config } from "./config.ts";
import { createHandler } from "./handler.ts";
import { makeClient, makeRest } from "./runtime.ts";

try {
  const settings = config();
  const rest = makeRest(settings.token);
  const identity = (await rest.get("/users/@me")) as { id: string; bot: boolean };
  if (!identity.bot || identity.id !== settings.applicationId)
    throw new Error("Application mismatch");
  const client = makeClient();
  const handler = createHandler(rest, identity.id, settings.guildId);
  client.once(Events.ClientReady, () => console.log("ThreadHaven ready / ThreadHaven hazır."));
  client.on(Events.InteractionCreate, (i) => {
    if (i.isChatInputCommand() || i.isButton()) void handler.handle(i);
  });
  client.on(Events.Error, () =>
    console.error("Discord connection error / Discord bağlantı hatası."),
  );
  const cleanup = setInterval(() => handler.prune(), 30_000);
  cleanup.unref();
  const stop = () => {
    clearInterval(cleanup);
    client.destroy();
  };
  process.once("SIGINT", stop);
  process.once("SIGTERM", stop);
  await client.login(settings.token);
} catch {
  console.error(
    "Could not start. Run npm run setup; verify Node 24, token, application ID, server ID and network. / Başlatılamadı. npm run setup çalıştırın; Node 24, token, uygulama/sunucu kimliği ve ağı kontrol edin.",
  );
  process.exitCode = 1;
}
