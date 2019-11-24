const { Project, ts } = require("ts-morph");
const path = require('path')
const src = process.argv[2]
const target = process.argv[3]
if (!src || !target) {
    console.log("Usage: node ../index.js . ts3.4")
    process.exit(1)
}
const project = new Project({
    tsConfigFilePath: path.join(src, "tsconfig.json")
})
const cwd = project.addDirectoryAtPath(".")
const targetDir = project.createDirectory(target)

for (const f of project.getSourceFiles("**/*.d.ts")) {
    const newFile = targetDir.createSourceFile(cwd.getRelativePathTo(f), f.getFullText(), { overwrite: true })
    const gs = newFile.getDescendantsOfKind(ts.SyntaxKind.GetAccessor)
    for (const g of gs) {
        const s = g.getSetAccessor()
        const returnTypeNode = g.getReturnTypeNode()
        g.replaceWithText(`${getModifiersText(g)}${s ? "" : "readonly "}${g.getName()}: ${returnTypeNode && returnTypeNode.getText() || "any"}`)
        if (s) {
            s.remove()
        }
    }
    const ss = newFile.getDescendantsOfKind(ts.SyntaxKind.SetAccessor)
    for (const s of ss) {
        const g = s.getGetAccessor()
        if (!g) {
            const firstParam = s.getParameters()[0]
            const paramTypeNode = firstParam && firstParam.getTypeNode()
            s.replaceWithText(`${getModifiersText(s)}${s.getName()}: ${paramTypeNode && paramTypeNode.getText() || "any"}`)
        }
    }
}
targetDir.save()

/**
 * @param {import("ts-morph").ModifierableNode} node
 */
function getModifiersText(node) {
    const modifiersText = node.getModifiers().map(m => m.getText()).join(" ")
    return modifiersText.length > 0 ? modifiersText + " " : ""
}
