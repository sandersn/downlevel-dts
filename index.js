#!/usr/bin/env node
const sh = require("shelljs");
const fs = require("fs");
const ts = require("typescript");
const path = require("path");
const assert = require("assert");

/** @typedef {import("typescript").Node} Node */
/**
 * @param {string} src
 * @param {string} target
 */
function main(src, target) {
  if (!src || !target) {
    console.log("Usage: node index.js test test/ts3.4");
    process.exit(1);
  }

  // TODO: target path is probably wrong for absolute src (or target?)
  // TODO: Probably will want to alter package.json if discovered in the right place.
  const program = ts.createProgram(
    sh.find(path.join(src)).filter(f => f.endsWith(".d.ts") && !/node_modules/.test(f)),
    {}
  );
  const checker = program.getTypeChecker(); // just used for setting parent pointers right now
  const files = mapDefined(program.getRootFileNames(), program.getSourceFile);
  const printer = ts.createPrinter({
    newLine: ts.NewLineKind.CarriageReturnLineFeed
  });
  for (const t of ts.transform(files, [doTransform.bind(null, checker)]).transformed) {
    const f = /** @type {import("typescript").SourceFile} */ (t);
    const targetPath = path.join(target, path.resolve(f.fileName).slice(path.resolve(src).length));
    sh.mkdir("-p", path.dirname(targetPath));
    fs.writeFileSync(targetPath, dedupeTripleSlash(printer.printFile(f)));
  }
}
module.exports.main = main;

if (!(/** @type {*} */ (module.parent))) {
  const src = process.argv[2];
  const target = process.argv[3];
  main(src, target);
}
/**
 * @param {import("typescript").TypeChecker} checker
 * @param {import("typescript").TransformationContext} k
 */
function doTransform(checker, k) {
  /**
   * @param {Node} n
   * @return {import("typescript").VisitResult<Node>}
   */
  const transform = function(n) {
    if (ts.isGetAccessor(n)) {
      // get x(): number => x: number
      let flags = ts.getCombinedModifierFlags(n);
      if (!getMatchingAccessor(n, "get")) {
        flags |= ts.ModifierFlags.Readonly;
      }
      const modifiers = ts.createModifiersFromModifierFlags(flags);
      return ts.createProperty(
        n.decorators,
        modifiers,
        n.name,
        /*?! token*/ undefined,
        defaultAny(n.type),
        /*initialiser*/ undefined
      );
    } else if (ts.isSetAccessor(n)) {
      // set x(value: number) => x: number
      let flags = ts.getCombinedModifierFlags(n);
      if (getMatchingAccessor(n, "set")) {
        return undefined;
      } else {
        assert(n.parameters && n.parameters.length);
        return ts.createProperty(
          n.decorators,
          n.modifiers,
          n.name,
          /*?! token*/ undefined,
          defaultAny(n.parameters[0].type),
          /*initialiser*/ undefined
        );
      }
    } else if (ts.isPropertyDeclaration(n) && ts.isPrivateIdentifier(n.name) && n.name.escapedText === "#private") {
      // #private => private "#private"
      const modifiers = ts.createModifiersFromModifierFlags(ts.ModifierFlags.Private);
      const parentName = n.parent.name ? n.parent.name.escapedText : "(anonymous)";
      return ts.createProperty(
        n.decorators,
        modifiers,
        ts.createStringLiteral(parentName + ".#private"),
        /*?! token*/ undefined,
        /*type*/ undefined,
        /*initialiser*/ undefined
      );
    } else if (
      ts.isExportDeclaration(n) &&
      n.exportClause &&
      n.moduleSpecifier &&
      ts.isNamespaceExport(n.exportClause)
    ) {
      // export * as ns from 'x'
      //  =>
      // import * as ns_1 from 'x'
      // export { ns_1 as ns }
      const tempName = ts.createUniqueName(n.exportClause.name.getText());
      return [
        ts.createImportDeclaration(
          n.decorators,
          n.modifiers,
          ts.createImportClause(/*name*/ undefined, ts.createNamespaceImport(tempName)),
          n.moduleSpecifier
        ),
        ts.createExportDeclaration(
          undefined,
          undefined,
          ts.createNamedExports([ts.createExportSpecifier(tempName, n.exportClause.name)]),
          n.moduleSpecifier
        )
      ];
    } else if (ts.isExportDeclaration(n) && n.isTypeOnly) {
      return ts.createExportDeclaration(n.decorators, n.modifiers, n.exportClause, n.moduleSpecifier);
    } else if (ts.isImportClause(n) && n.isTypeOnly) {
      return ts.createImportClause(n.name, n.namedBindings);
    } else if (
      (ts.isTypeReferenceNode(n) && ts.isIdentifier(n.typeName) && n.typeName.escapedText === "Omit") ||
      (ts.isExpressionWithTypeArguments(n) && ts.isIdentifier(n.expression) && n.expression.escapedText === "Omit")
    ) {
      const symbol = checker.getSymbolAtLocation(ts.isTypeReferenceNode(n) ? n.typeName : n.expression);
      const typeArguments = n.typeArguments;

      if (
        symbol &&
        symbol.declarations.length &&
        symbol.declarations[0].getSourceFile().fileName.includes("node_modules/typescript/lib/lib") &&
        typeArguments
      ) {
        return ts.createTypeReferenceNode(ts.createIdentifier("Pick"), [
          typeArguments[0],
          ts.createTypeReferenceNode(ts.createIdentifier("Exclude"), [
            ts.createTypeOperatorNode(typeArguments[0]),
            typeArguments[1]
          ])
        ]);
      }
    }
    return ts.visitEachChild(n, transform, k);
  };
  return transform;
}

/** @param {import("typescript").TypeNode | undefined} t */
function defaultAny(t) {
  return t || ts.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword);
}

/**
 * @param {import("typescript").AccessorDeclaration} n
 * @param {'get' | 'set'} getset
 */
function getMatchingAccessor(n, getset) {
  if (!ts.isClassDeclaration(n.parent)) throw new Error("Bad AST -- accessor parent should be a class declaration.");
  const isOther = getset === "get" ? ts.isSetAccessor : ts.isGetAccessor;
  return n.parent.members.some(m => isOther(m) && m.name.getText() === n.name.getText());
}

/** @param {string} s */
function dedupeTripleSlash(s) {
  const lines = s.split("\n");
  const i = lines.findIndex(line => !line.startsWith("/// <reference "));
  return [...new Set(lines.slice(0, i)), ...lines.slice(i)].join("\n");
}

/**
 * @template T,U
 * @param {readonly T[]} l
 * @param {(t: T) => U | false | undefined} f
 * @return {U[]}
 */
function mapDefined(l, f) {
  const acc = [];
  for (const x of l) {
    const y = f(x);
    if (y) acc.push(y);
  }
  return acc;
}
