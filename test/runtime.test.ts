import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readdirSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { GatewayIntentBits, PermissionFlagsBits, REST, Routes } from "discord.js";
import { command } from "../src/command.ts";
import { config } from "../src/config.ts";
import { makeClient, makeRest } from "../src/runtime.ts";

test("configuration errors never disclose input values", () => {
  assert.throws(
    () => config({ DISCORD_TOKEN: "sensitive-value" }),
    (error) => error instanceof Error && !error.message.includes("sensitive-value"),
  );
  for (const env of [{}, { DISCORD_TOKEN: "a b" }, { APPLICATION_ID: "x", GUILD_ID: "y" }])
    assert.throws(() => config(env));
});
test("Guilds-only intent, no message cache, and no REST retry", () => {
  const client = makeClient();
  assert.equal(client.options.intents.bitfield, GatewayIntentBits.Guilds);
  client.destroy();
  const rest = makeRest("unused-placeholder");
  assert.equal(rest.options.retries, 0);
  assert.equal(rest.options.timeout, 10_000);
  const reject = rest.options.rejectOnRateLimit;
  assert.equal(typeof reject, "function");
});
for (const failure of ["server", "rate", "reset"] as const) {
  test(`actual REST transport never repeats creation on ${failure} failure`, async () => {
    let calls = 0;
    const configured = makeRest("unused-placeholder");
    const rest = new REST({
      ...configured.options,
      makeRequest: async () => {
        calls++;
        if (failure === "reset")
          throw Object.assign(new Error("connection reset"), { code: "ECONNRESET" });
        const response = new Response(JSON.stringify({ retry_after: 0.01, global: false }), {
          status: failure === "server" ? 503 : 429,
          headers: {
            "content-type": "application/json",
            "retry-after": "0.01",
            "x-ratelimit-limit": "1",
            "x-ratelimit-remaining": "0",
            "x-ratelimit-reset-after": "0.01",
          },
        });
        return {
          body: null,
          bodyUsed: false,
          headers: response.headers,
          ok: response.ok,
          status: response.status,
          statusText: response.statusText,
          json: () => response.json(),
          text: () => response.text(),
          arrayBuffer: () => response.arrayBuffer(),
        };
      },
    }).setToken("unused-placeholder");
    await assert.rejects(
      rest.post(Routes.threads("400000000000000004"), { body: { name: "Book club", type: 11 } }),
    );
    assert.equal(calls, 1);
    rest.clearHashSweeper();
    rest.clearHandlerSweeper();
    configured.clearHashSweeper();
    configured.clearHandlerSweeper();
  });
}
test("guild command registration has manager default and explicit title limits", () => {
  const data = command.toJSON();
  assert.equal(data.name, "threadhaven");
  assert.equal(data.default_member_permissions, PermissionFlagsBits.ManageGuild.toString());
  assert.equal(data.contexts, undefined);
  assert.equal(data.integration_types, undefined);
  assert.equal(data.options?.length, 2);
});
for (const file of ["src/main.ts", "src/register.ts", "scripts/setup.mjs"]) {
  test(`real ${file} fails safely without configuration or file writes`, () => {
    const temp = mkdtempSync(path.join(tmpdir(), "threadhaven-smoke-"));
    const root = fileURLToPath(new URL("../", import.meta.url));
    try {
      const result = spawnSync(process.execPath, [path.join(root, file)], {
        cwd: temp,
        encoding: "utf8",
        timeout: 20_000,
        env: { PATH: process.env.PATH, SystemRoot: process.env.SystemRoot },
      });
      assert.equal(result.status, 1);
      assert.equal(result.error, undefined);
      assert.match(result.stderr, /setup|interactive/i);
      assert.deepEqual(readdirSync(temp), []);
    } finally {
      const resolved = realpathSync(temp);
      const parent = realpathSync(tmpdir());
      assert.equal(path.dirname(resolved), parent);
      assert.ok(path.basename(resolved).startsWith("threadhaven-smoke-"));
      rmSync(resolved, { recursive: true });
    }
  });
}
