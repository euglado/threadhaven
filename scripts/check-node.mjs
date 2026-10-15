if (Number(process.versions.node.split(".")[0]) !== 24) {
  console.error("Install Node.js 24 LTS / Node.js 24 LTS kurun: https://nodejs.org/");
  process.exitCode = 1;
}
