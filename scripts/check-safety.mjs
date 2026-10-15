import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const lock = JSON.parse(readFileSync("package-lock.json", "utf8"));
const allowed = new Set([
  "MIT",
  "MIT OR Apache-2.0",
  "Apache-2.0",
  "BSD-2-Clause",
  "BSD-3-Clause",
  "ISC",
  "0BSD",
  "BlueOak-1.0.0",
]);
let packages = 0;
for (const [name, entry] of Object.entries(lock.packages)) {
  if (!name) continue;
  if (
    !allowed.has(entry.license) ||
    !/^https:\/\/registry\.npmjs\.org\//.test(entry.resolved ?? "") ||
    !/^sha512-[A-Za-z0-9+/]+={0,2}$/.test(entry.integrity ?? "") ||
    entry.hasInstallScript ||
    entry.link
  )
    throw new Error(`Dependency policy failed: ${name}`);
  packages++;
}
const files = execFileSync(
  "git",
  ["ls-files", "-z", "--cached", "--others", "--exclude-standard"],
  { encoding: "utf8" },
)
  .split("\0")
  .filter(Boolean);
// Heuristic source credential scan, not a guarantee that every possible secret is detected.
const patterns = [
  new RegExp("gh" + "[opusr]_[A-Za-z0-9]{30,}"),
  new RegExp("github_" + "pat_[A-Za-z0-9_]{30,}"),
  new RegExp("-----BEGIN " + "(?:RSA |EC |OPENSSH )?PRIVATE KEY-----"),
  /[A-Za-z0-9_-]{23,28}\.[A-Za-z0-9_-]{6}\.[A-Za-z0-9_-]{27,}/,
];
for (const file of files) {
  if (/^\.env(?:\.|$)/.test(file) && file !== ".env.example")
    throw new Error("Secret configuration is not ignored");
  const content = readFileSync(file, "utf8");
  if (patterns.some((pattern) => pattern.test(content)))
    throw new Error(`Potential credential in ${file}; value withheld`);
}
console.log(
  `${packages} dependency licenses/registry/SHA-512/no-install-script records passed; ${files.length} source files passed credential-pattern scan.`,
);
