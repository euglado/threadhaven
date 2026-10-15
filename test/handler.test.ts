import assert from "node:assert/strict";
import test from "node:test";
import {
  type ButtonInteraction,
  type ChatInputCommandInteraction,
  MessageFlags,
  MessageFlagsBitField,
  PermissionFlagsBits as P,
  type REST,
} from "discord.js";
import { createHandler } from "../src/handler.ts";
import { fixture, ids, roleAt } from "./fixtures.ts";

function harness() {
  const s = fixture();
  let now = 0;
  const posts: { route: string; options: unknown }[] = [];
  const reads: string[] = [];
  let failPost = false;
  let invalidResponse = false;
  let pause: Promise<void> | undefined;
  const rest = {
    async get(route: string) {
      reads.push(route);
      if (pause) await pause;
      if (route.endsWith(`/members/${ids.user}`)) return structuredClone(s.member);
      if (route.endsWith(`/members/${ids.bot}`)) return structuredClone(s.bot);
      if (route.endsWith("/roles")) return structuredClone(s.roles);
      if (route.startsWith("/channels/")) return structuredClone(s.channel);
      return structuredClone(s.guild);
    },
    async post(route: string, options: unknown) {
      posts.push({ route, options });
      if (failPost) throw new Error("sensitive-network-detail");
      return invalidResponse
        ? {}
        : { id: ids.thread, guild_id: ids.guild, parent_id: ids.channel, type: 11 };
    },
  } as unknown as Pick<REST, "get" | "post">;
  const h = createHandler(rest, ids.bot, ids.guild, () => now);
  function interaction(kind: "command" | "button", customId = "") {
    const output: Record<string, unknown>[] = [];
    const raw = {
      commandName: "threadhaven",
      customId,
      guildId: ids.guild,
      channelId: ids.channel,
      user: { id: ids.user },
      locale: "en",
      deferred: false,
      replied: false,
      message: {
        id: ids.message,
        author: { id: ids.bot },
        flags: new MessageFlagsBitField(MessageFlags.Ephemeral),
      },
      inGuild: () => Boolean(raw.guildId),
      isChatInputCommand: () => kind === "command",
      isButton: () => kind === "button",
      options: { getString: (name: string) => (name === "title" ? "Book club" : "en") },
      async reply(payload: Record<string, unknown>) {
        raw.replied = true;
        output.push(payload);
      },
      async deferReply(payload: Record<string, unknown>) {
        raw.deferred = true;
        output.push(payload);
      },
      async deferUpdate() {
        raw.deferred = true;
      },
      async editReply(payload: Record<string, unknown>) {
        output.push(payload);
        return { id: ids.message };
      },
    };
    return { raw, output, i: raw as unknown as ChatInputCommandInteraction & ButtonInteraction };
  }
  async function draft() {
    const c = interaction("command");
    await h.handle(c.i);
    const key = [...h.drafts.items.keys()][0];
    assert.ok(key);
    return { c, button: interaction("button", `th:create:${key}`), key };
  }
  return {
    h,
    s,
    posts,
    reads,
    interaction,
    draft,
    setNow: (n: number) => {
      now = n;
    },
    fail: () => {
      failPost = true;
    },
    badResponse: () => {
      invalidResponse = true;
    },
    pause: (p: Promise<void>) => {
      pause = p;
    },
  };
}
test("real adapter sends a private preview then creates precisely one public thread", async () => {
  const x = harness();
  const { c, button } = await x.draft();
  assert.equal(c.output[0]?.flags, MessageFlags.Ephemeral);
  assert.equal(x.posts.length, 0);
  assert.equal(x.reads.length, 5);
  await x.h.handle(button.i);
  assert.equal(x.reads.length, 10);
  assert.deepEqual(x.posts, [
    {
      route: `/channels/${ids.channel}/threads`,
      options: {
        body: { name: "Book club", type: 11, auto_archive_duration: 60, rate_limit_per_user: 5 },
        reason: "Confirmed public discussion thread",
      },
    },
  ]);
  assert.match(String(button.output.at(-1)?.content), new RegExp(ids.thread));
  assert.deepEqual(button.output.at(-1)?.components, []);
  assert.deepEqual(button.output.at(-1)?.allowedMentions, { parse: [], repliedUser: false });
  await x.h.handle(button.i);
  assert.equal(x.posts.length, 1);
});
for (const kind of ["user", "guild", "channel", "message", "author", "public"] as const) {
  test(`stolen or transplanted control rejected: ${kind}`, async () => {
    const x = harness();
    const { button } = await x.draft();
    if (kind === "user") button.raw.user.id = "other";
    if (kind === "guild") button.raw.guildId = "other";
    if (kind === "channel") button.raw.channelId = "other";
    if (kind === "message") button.raw.message.id = "other";
    if (kind === "author") button.raw.message.author.id = "other";
    if (kind === "public") button.raw.message.flags = new MessageFlagsBitField();
    await x.h.handle(button.i);
    assert.equal(x.posts.length, 0);
    assert.equal(x.h.drafts.items.size, 1);
  });
}
test("cancel consumes preview without new API fetch or mutation", async () => {
  const x = harness();
  const { key } = await x.draft();
  const cancel = x.interaction("button", `th:cancel:${key}`);
  await x.h.handle(cancel.i);
  assert.equal(x.reads.length, 5);
  assert.equal(x.posts.length, 0);
  assert.equal(x.h.drafts.items.size, 0);
});
test("simultaneous duplicate confirmation consumes once before await", async () => {
  const x = harness();
  const { button, key } = await x.draft();
  await Promise.all([
    x.h.handle(button.i),
    x.h.handle(x.interaction("button", `th:create:${key}`).i),
  ]);
  assert.equal(x.posts.length, 1);
});
test("permission loss after preview stops mutation and consumes draft", async () => {
  const x = harness();
  const { button } = await x.draft();
  roleAt(x.s, 2).permissions = "0";
  await x.h.handle(button.i);
  assert.equal(x.posts.length, 0);
  assert.equal(x.h.drafts.items.size, 0);
});
test("fresh role overwrite loss stops creation", async () => {
  const x = harness();
  const { button } = await x.draft();
  x.s.channel.permission_overwrites.push({
    id: ids.bot,
    type: 1,
    allow: "0",
    deny: P.CreatePublicThreads.toString(),
  });
  await x.h.handle(button.i);
  assert.equal(x.posts.length, 0);
});
test("parent rename invalidates preview", async () => {
  const x = harness();
  const { button } = await x.draft();
  x.s.channel.name = "new-name";
  await x.h.handle(button.i);
  assert.equal(x.posts.length, 0);
});
test("exact five-minute expiry stops creation", async () => {
  const x = harness();
  const { button } = await x.draft();
  x.setNow(300_000);
  await x.h.handle(button.i);
  assert.equal(x.posts.length, 0);
});
test("expiry while fresh REST checks are pending also stops creation", async () => {
  const x = harness();
  const { button } = await x.draft();
  let release = () => {};
  x.pause(
    new Promise<void>((resolve) => {
      release = resolve;
    }),
  );
  const pending = x.h.handle(button.i);
  await new Promise((resolve) => setImmediate(resolve));
  x.setNow(300_000);
  release();
  await pending;
  assert.equal(x.posts.length, 0);
});
test("uncertain network result never retries and withholds raw error", async () => {
  const x = harness();
  const { button } = await x.draft();
  x.fail();
  await x.h.handle(button.i);
  await x.h.handle(button.i);
  assert.equal(x.posts.length, 1);
  assert.match(JSON.stringify(button.output), /may have succeeded/);
  assert.doesNotMatch(JSON.stringify(button.output), /sensitive-network-detail/);
});
test("malformed successful API response is uncertain without retry", async () => {
  const x = harness();
  const { button } = await x.draft();
  x.badResponse();
  await x.h.handle(button.i);
  assert.equal(x.posts.length, 1);
  assert.match(String(button.output.at(-1)?.content), /may have succeeded/);
});
test("same-channel second creation is blocked for 60 seconds", async () => {
  const x = harness();
  const first = await x.draft();
  await x.h.handle(first.button.i);
  x.setNow(5_000);
  const second = await x.draft();
  await x.h.handle(second.button.i);
  assert.equal(x.posts.length, 1);
  x.setNow(60_000);
  const third = await x.draft();
  await x.h.handle(third.button.i);
  assert.equal(x.posts.length, 2);
});
test("form throttle and wrong server prevent API fetches", async () => {
  const x = harness();
  await x.draft();
  await x.h.handle(x.interaction("command").i);
  assert.equal(x.reads.length, 5);
  const wrong = x.interaction("command");
  wrong.raw.guildId = "other";
  await x.h.handle(wrong.i);
  assert.equal(x.reads.length, 5);
});
test("expired data is periodically prunable", async () => {
  const x = harness();
  await x.draft();
  x.setNow(300_000);
  x.h.prune();
  assert.equal(x.h.drafts.items.size, 0);
  assert.equal(x.h.forms.until.size, 0);
});
