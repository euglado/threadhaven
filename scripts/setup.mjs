import { existsSync, writeFileSync } from "node:fs";
import { createInterface } from "node:readline/promises";
import { Writable } from "node:stream";

if (
  Number(process.versions.node.split(".")[0]) !== 24 ||
  !process.stdin.isTTY ||
  !process.stdout.isTTY ||
  existsSync(".env")
) {
  console.error(
    "Use Node 24 in an interactive terminal. Existing .env is never overwritten; rename it securely to reconfigure. / Etkileşimli terminalde Node 24 kullanın. Var olan .env üzerine yazılmaz; yeniden kurulum için güvenle yeniden adlandırın.",
  );
  process.exitCode = 1;
} else {
  let hidden = false;
  const output = new Writable({
    write(chunk, _encoding, done) {
      if (!hidden) process.stdout.write(chunk);
      done();
    },
  });
  const rl = createInterface({ input: process.stdin, output, terminal: true });
  try {
    const app = (await rl.question("Application ID / Uygulama kimliği: ")).trim();
    const guild = (await rl.question("Server ID / Sunucu kimliği: ")).trim();
    process.stdout.write("Bot token (hidden / gizli): ");
    hidden = true;
    const token = (await rl.question("")).trim();
    hidden = false;
    process.stdout.write("\n");
    if (
      !/^\d{17,20}$/.test(app) ||
      !/^\d{17,20}$/.test(guild) ||
      !/^[A-Za-z0-9._-]{20,200}$/.test(token)
    )
      throw new Error("Invalid configuration");
    writeFileSync(".env", `DISCORD_TOKEN=${token}\nAPPLICATION_ID=${app}\nGUILD_ID=${guild}\n`, {
      flag: "wx",
      mode: 0o600,
    });
    console.log("Saved locally; keep .env secret. / Yerel kaydedildi; .env gizli kalsın.");
    console.log(
      `Invite / Davet: https://discord.com/oauth2/authorize?client_id=${app}&scope=bot%20applications.commands&permissions=34359739392&guild_id=${guild}&disable_guild_select=true`,
    );
    console.log(
      "Invite, then run register and start. / Davet edin, ardından register ve start çalıştırın.",
    );
  } catch {
    console.error(
      "Setup stopped; configuration was not replaced. / Kurulum durdu; yapılandırma değiştirilmedi.",
    );
    process.exitCode = 1;
  } finally {
    hidden = false;
    rl.close();
  }
}
