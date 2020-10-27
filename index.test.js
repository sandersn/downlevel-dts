const { main } = require("./index");
const sh = require("shelljs");
const fs = require("fs");
const semver = require("semver");

describe("main", () => {
  const tsVersions = ["3.4", "3.5", "3.6", "3.7", "3.8", "3.9", "4.0"];

  afterEach(() => {
    for (const tsVersion of tsVersions) {
      if (fs.existsSync(`test/ts${tsVersion}`)) {
        sh.rm("-r", `test/ts${tsVersion}`);
      }
    }
  });

  for (const tsVersion of tsVersions) {
    test(
      "downlevel TS to " + tsVersion,
      () => {
        main("test", `test/ts${tsVersion}`, semver.coerce(tsVersion));

        expect(fs.readFileSync(`test/ts${tsVersion}/test.d.ts`, "utf8")).toEqual(
          fs.readFileSync(`baselines/ts${tsVersion}/test.d.ts`, "utf8")
        );
        expect(fs.readFileSync(`test/ts${tsVersion}/src/test.d.ts`, "utf8")).toEqual(
          fs.readFileSync(`baselines/ts${tsVersion}/src/test.d.ts`, "utf8")
        );
      },
      10 * 1000
    );
  }
});
