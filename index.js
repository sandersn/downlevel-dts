const { Project, TypeGuards, ts } = require("ts-morph");
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
    newFile.forEachDescendant(n => {
        if (TypeGuards.isGetAccessorDeclaration(n)) {
            const s = n.getSetAccessor()
            n.replaceWithText(`${getModifiersText(n)}${s ? "" : "readonly "}${n.getName()}: ${n.getReturnTypeNodeOrThrow().getText()}`)
            if (s) {
                s.remove()
            }
        }
        else if (TypeGuards.isSetAccessorDeclaration(n)) {
            const g = n.getGetAccessor()
            if (!g) {
                n.replaceWithText(`${getModifiersText(n)}${n.getName()}: ${n.getReturnTypeNodeOrThrow().getText()}`)
            }
        }
    })
}
targetDir.save()

/**
 * @param {import("ts-morph").ModifierableNode} node
 */
function getModifiersText(node) {
    const modifiersText = node.getModifiers().map(m => m.getText()).join(" ")
    return modifiersText.length > 0 ? modifiersText + " " : ""
}
