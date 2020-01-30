const { main } = require("./index");
const sh = require("shelljs");
const fs = require("fs");
const path = require("path");
/**
 * @param {string} description
 * @param {{ [s: string]: () => void }} tests
 */
function suite(description, tests) {
  describe(description, () => {
    for (const k in tests) {
      test(k, tests[k], 10 * 1000);
    }
  });
}
suite("main", {
  works() {
    if (fs.existsSync("test/ts3.4")) {
      sh.rm("-r", "test/ts3.4");
    }
    main("test", "test/ts3.4");
    expect(fs.readFileSync("test/ts3.4/test.d.ts", "utf8")).toEqual(
      fs.readFileSync("baselines/ts3.4/test.d.ts", "utf8")
    );
    expect(fs.readFileSync("test/ts3.4/src/test.d.ts", "utf8")).toEqual(
      fs.readFileSync("baselines/ts3.4/src/test.d.ts", "utf8")
    );
  }
});
