import assert from "node:assert/strict";
import test from "node:test";
import { PermissionFlagsBits as P } from "discord.js";
import { authorize, effective, type Snapshot } from "../src/access.ts";
import { binding, fixture, ids, roleAt } from "./fixtures.ts";

test("minimal bot permissions suffice without Send Messages or Manage Threads", () => {
  assert.equal(authorize(fixture(), binding, ids.bot), "community");
});
const rejections: [string, (s: Snapshot) => void][] = [
  [
    "obfuscated parent",
    (s) => {
      s.channel.flags = 1 << 17;
    },
  ],
  [
    "wrong guild",
    (s) => {
      s.guild.id = "other";
    },
  ],
  [
    "wrong parent guild",
    (s) => {
      s.channel.guild_id = "other";
    },
  ],
  [
    "wrong channel",
    (s) => {
      s.channel.id = "other";
    },
  ],
  [
    "wrong user",
    (s) => {
      s.member.user.id = "other";
    },
  ],
  [
    "wrong bot",
    (s) => {
      s.bot.user.id = "other";
    },
  ],
  [
    "bot invoker",
    (s) => {
      s.member.user.bot = true;
    },
  ],
  [
    "non-bot application",
    (s) => {
      s.bot.user.bot = false;
    },
  ],
  [
    "forum parent",
    (s) => {
      s.channel.type = 15;
    },
  ],
  [
    "thread parent",
    (s) => {
      s.channel.type = 11;
    },
  ],
  [
    "announcement parent",
    (s) => {
      s.channel.type = 5;
    },
  ],
  [
    "age-restricted parent",
    (s) => {
      s.channel.nsfw = true;
    },
  ],
  [
    "parent slowmode",
    (s) => {
      s.channel.rate_limit_per_user = 5;
    },
  ],
  [
    "member screening",
    (s) => {
      s.member.pending = true;
    },
  ],
  [
    "bot screening",
    (s) => {
      s.bot.pending = true;
    },
  ],
  [
    "member timeout",
    (s) => {
      s.member.communication_disabled_until = new Date(Date.now() + 60_000).toISOString();
    },
  ],
  [
    "bot timeout",
    (s) => {
      s.bot.communication_disabled_until = new Date(Date.now() + 60_000).toISOString();
    },
  ],
  [
    "invalid timeout",
    (s) => {
      s.member.communication_disabled_until = "broken";
    },
  ],
  [
    "missing role data",
    (s) => {
      s.roles = [];
    },
  ],
  [
    "unknown member role",
    (s) => {
      s.member.roles.push("missing");
    },
  ],
  [
    "unknown bot role",
    (s) => {
      s.bot.roles.push("missing");
    },
  ],
  [
    "manager role lost",
    (s) => {
      s.member.roles = [];
    },
  ],
  [
    "bot role lost",
    (s) => {
      s.bot.roles = [];
    },
  ],
  [
    "Administrator bot",
    (s) => {
      roleAt(s, 2).permissions = P.Administrator.toString();
    },
  ],
  [
    "bot owner",
    (s) => {
      s.guild.owner_id = ids.bot;
    },
  ],
  [
    "bot channel deny",
    (s) => {
      s.channel.permission_overwrites.push({
        id: ids.bot,
        type: 1,
        allow: "0",
        deny: P.CreatePublicThreads.toString(),
      });
    },
  ],
  [
    "member channel deny",
    (s) => {
      s.channel.permission_overwrites.push({
        id: ids.user,
        type: 1,
        allow: "0",
        deny: P.ViewChannel.toString(),
      });
    },
  ],
  [
    "user cannot participate",
    (s) => {
      roleAt(s, 1).permissions = (P.ViewChannel | P.CreatePublicThreads | P.ManageGuild).toString();
    },
  ],
];
for (const [name, mutate] of rejections)
  test(`fail closed: ${name}`, () => {
    const s = fixture();
    mutate(s);
    assert.throws(() => authorize(s, binding, ids.bot));
  });
test("expired timeout does not block", () => {
  const s = fixture();
  s.member.communication_disabled_until = new Date(1).toISOString();
  assert.equal(authorize(s, binding, ids.bot), "community");
});
test("human owner and Administrator retain permissions while bot admin is rejected", () => {
  const s = fixture();
  s.guild.owner_id = ids.user;
  s.member.roles = [];
  assert.equal(authorize(s, binding, ids.bot), "community");
  s.guild.owner_id = "other";
  roleAt(s, 1).permissions = P.Administrator.toString();
  s.member.roles = [ids.manager];
  assert.equal(authorize(s, binding, ids.bot), "community");
});
test("overwrite ordering: everyone, combined roles, then member", () => {
  const s = fixture();
  const bit = P.ViewChannel;
  s.roles.push({ id: "extra", permissions: "0" });
  s.member.roles.push("extra");
  s.channel.permission_overwrites = [
    { id: ids.guild, type: 0, allow: "0", deny: bit.toString() },
    { id: ids.manager, type: 0, allow: "0", deny: bit.toString() },
    { id: "extra", type: 0, allow: bit.toString(), deny: "0" },
  ];
  assert.equal(effective(s.member, s) & bit, bit);
  s.channel.permission_overwrites.reverse();
  assert.equal(effective(s.member, s) & bit, bit);
  s.channel.permission_overwrites.push({ id: ids.user, type: 1, allow: "0", deny: bit.toString() });
  assert.equal(effective(s.member, s) & bit, 0n);
});
