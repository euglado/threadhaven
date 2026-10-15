import assert from "node:assert/strict";
import test from "node:test";
import { Drafts, Gate, language, plan, preview, TTL, title } from "../src/domain.ts";
import { binding, ids } from "./fixtures.ts";

test("normalizes visible titles without hidden edits", () => {
  assert.equal(title("  Café  sohbeti  "), "Café sohbeti");
  assert.equal(title("Cafe\u0301"), "Café");
  assert.equal(title("Çalışma: 2. tur (C++)"), "Çalışma: 2. tur (C++)");
});
for (const value of [
  "",
  "ab",
  "x".repeat(81),
  "...",
  "@everyone",
  "<@123456789012345678>",
  "https://example.com",
  "two\nlines",
  "two\tlines",
  "hide\u202Etext",
  "hide\u200Btext",
  "**markup**",
  "emoji😀",
  "bad\u0000text",
  "bad\uD800text",
]) {
  test(`rejects unsafe title ${JSON.stringify(value)}`, () => assert.throws(() => title(value)));
}
test("API plan always explicitly requests public threads and modest defaults", () => {
  assert.deepEqual(plan("Book club"), {
    name: "Book club",
    type: 11,
    auto_archive_duration: 60,
    rate_limit_per_user: 5,
  });
  assert.ok(Object.isFrozen(plan("Book club")));
});
test("previews explain visibility, inactivity and no starter message", () => {
  assert.match(preview("Book club", "community", "en"), /Everyone.*view/);
  assert.match(preview("Book club", "community", "en"), /not deletion/);
  assert.match(preview("Book club", "community", "tr"), /silme değildir/);
  assert.equal(language("tr"), "tr");
  assert.equal(language("de"), "en");
});
test("drafts require message binding and consume exactly once", () => {
  const store = new Drafts();
  const k = store.add({ ...binding, name: "Book club", parent: "community", lang: "en" });
  assert.match(k, /^[a-f0-9]{32}$/);
  assert.equal(store.take(k, binding, ids.message), undefined);
  store.bind(k, ids.message);
  assert.equal(store.take(k, { ...binding, user: "other" }, ids.message), undefined);
  assert.equal(store.take(k, { ...binding, guild: "other" }, ids.message), undefined);
  assert.equal(store.take(k, { ...binding, channel: "other" }, ids.message), undefined);
  assert.equal(store.take(k, binding, "other"), undefined);
  assert.equal(store.items.size, 1);
  assert.equal(store.take(k, binding, ids.message)?.name, "Book club");
  assert.equal(store.take(k, binding, ids.message), undefined);
});
test("draft capacity and exact expiry free RAM", () => {
  let now = 0;
  const store = new Drafts(1, () => now);
  const data = { ...binding, name: "Book club", parent: "community", lang: "en" as const };
  const k = store.add(data);
  store.bind(k, ids.message);
  assert.throws(() => store.add(data));
  now = TTL;
  assert.equal(store.take(k, binding, ids.message), undefined);
  assert.equal(store.items.size, 0);
  store.add(data);
  assert.equal(store.items.size, 1);
});
test("cooldowns preserve active exclusion even after time elapses", () => {
  let now = 0;
  const gate = new Gate(2, () => now);
  assert.ok(gate.enter("a", 10));
  assert.equal(gate.enter("a", 10), false);
  now = 20;
  assert.equal(gate.enter("a", 10), false);
  gate.leave("a");
  assert.ok(gate.enter("a", 10));
  gate.leave("a");
  assert.equal(gate.enter("a", 10), false);
  now = 30;
  assert.ok(gate.enter("a", 10));
});
test("bounded cooldowns reject new keys without evicting safety state", () => {
  const gate = new Gate(1, () => 0);
  assert.ok(gate.enter("a", 10));
  gate.leave("a");
  assert.equal(gate.enter("b", 10), false);
  assert.equal(gate.until.size, 1);
});
