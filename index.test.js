const { main } = require("./index")
const fs = require("fs")
const path = require("path")
/**
 * @param {string} description
 * @param {{ [s: string]: () => void }} tests
 */
function suite(description, tests) {
    describe(description, () => {
        for (const k in tests) {
            test(k, tests[k], 10 * 1000)
        }
    })
}
suite("main", {
    async works() {
        fs.rmdirSync("test/ts3.4", { recursive: true })
        await main("test", "test/ts3.4")
        expect(fs.readFileSync("baselines/ts3.4/test.d.ts", "utf8")).toEqual(fs.readFileSync("test/ts3.4/test.d.ts", "utf8"))
        expect(fs.readFileSync("baselines/ts3.4/src/test.d.ts", "utf8")).toEqual(fs.readFileSync("test/ts3.4/src/test.d.ts", "utf8"))
    },
})
