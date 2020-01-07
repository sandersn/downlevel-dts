const { Project, ts } = require("ts-morph")
const { cwd } = require('process')
const path = require('path')

/**
 * @param {string} src
 * @param {string} target
 */
async function main(src, target) {
    if (!src || !target) {
        console.log("Usage: node ../index.js . ts3.4")
        console.log("Usage: node ../index.js input output") // input/test.d.ts -> output/test.d.ts
        process.exit(1)
    }
    const project = new Project({
        tsConfigFilePath: path.join(src, "tsconfig.json")
    })
    for (const f of project.getSourceFiles("**/*.d.ts")) {
        if (f.isInNodeModules()) {
            continue
        }
        const gs = f.getDescendantsOfKind(ts.SyntaxKind.GetAccessor)
        for (const g of gs) {
            const s = g.getParent().getChildrenOfKind(ts.SyntaxKind.SetAccessor).find(s => s.getName() === g.getName())
            g.replaceWithText(`${s ? "" : "readonly "}${g.getName()}: ${g.getType().getText()}`)
            if (s) {
                s.remove()
            }
        }
        const ss = f.getDescendantsOfKind(ts.SyntaxKind.SetAccessor)
        for (const s of ss) {
            const g = s.getParent().getChildrenOfKind(ts.SyntaxKind.GetAccessor).find(g => s.getName() === g.getName())
            if (!g) {
                s.replaceWithText(`${s.getName()}: ${s.getType().getText()}`)
            }
        }
        f.copy(path.join(cwd(), target, path.relative(path.join(cwd(), src), f.getFilePath())), { overwrite: true })
        f.refreshFromFileSystemSync()
    }
    await project.save()
}
module.exports.main = main

if  (!/** @type {*} */(module).parent) {
    const src = process.argv[2]
    const target = process.argv[3]
    main(src, target).catch(e => { console.log(e); process.exit(1) })
}
