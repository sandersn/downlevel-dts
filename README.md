downlevel-dts rewrites .d.ts files created by any version of TypeScript so
that they work with TypeScript 3.4 or later. It does this by
converting code with new features into code that uses equivalent old
features. For example, it rewrites accessors to properties, because
TypeScript didn't support accessors in .d.ts files until 3.6:

```ts
declare class C {
  get x(): number;
}
```

becomes

```ts
declare class C {
  readonly x: number;
}
```

Note that not all features can be downlevelled. For example,
TypeScript 4.0 allows spreading multiple tuple type variables, at any
position in a tuple. This is not allowed in previous versions, but has
no obvious downlevel emit, so downlevel-dts doesn't attempt to do
anything. Be sure to test the output of downlevel-dts with the
appropriate version of TypeScript.

## Features

Here is the list of features that are downlevelled:

### `Omit` (3.5)

```ts
type Less = Omit<T, K>;
```

becomes

```ts
type Less = Pick<T, Exclude<keyof T, K>>;
```

`Omit` has had non-builtin implementations since TypeScript 2.2, but
became built-in in TypeScript 3.5.

#### Semantics

`Omit` is a type alias, so the downlevel should behave exactly the same.

### Accessors (3.6)

TypeScript prevented accessors from being in .d.ts files until
TypeScript 3.6 because they behave very similarly to properties.
However, they behave differently with inheritance, so the distinction
can be useful.

```ts
declare class C {
  get x(): number;
}
```

becomes

```ts
declare class C {
  readonly x: number;
}
```

#### Semantics

The properties emitted downlevel can be overridden in more cases than
the original accessors, so the downlevel d.ts will be less strict. See
[the TypeScript 3.7 release
notes](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-7.html#the-usedefineforclassfields-flag-and-the-declare-property-modifier)
for more detail.

### `asserts` assertion guards (3.7)

TypeScript 3.7 introduced the `asserts` keyword, which provides a way to indicate that a function will throw if a parameter doesn't meet a condition.
This allows TypeScript to understand that whatever condition such a function checks must be true for the remainder of the containing scope.

Since there is no way to model this before 3.7, such functions are downlevelled to return `void`:

```ts
declare function assertIsString(val: any, msg?: string): asserts val is string;
declare function assert(val: any, msg?: string): asserts val;
```

becomes

```ts
declare function assertIsString(val: any, msg?: string): void;
declare function assert(val: any, msg?: string): void;
```

### Type-only import/export (3.8)

The downlevel emit is quite simple:

```ts
import type { T } from 'x';
```

becomes

```ts
import { T } from "x";
```

#### Semantics

The downlevel d.ts will be less strict because a class will be
constructable:

```ts
declare class C {
}
export type { C };
```

becomes

```ts
declare class C {}
export { C };
```

and the latter allows construction:

```ts
import { C } from "x";
var c = new C();
```

### `#private` (3.8)

TypeScript 3.8 supports the new ECMAScript-standard #private properties in
addition to its compile-time-only private properties. Since neither
are accessible at compile-time, downlevel-dts converts #private
properties to compile-time private properties:

```ts
declare class C {
  #private
}
```

It becomes:

```ts
declare class C {
  private "#private"`
}
```

#### Semantics

The standard emit for _any_ class with a #private property just adds a
single `#private` line. Similarly, a class with a private property
adds only the name of the property, but not the type. The d.ts
includes only enough information for consumers to avoid interfering
with the private property:

```ts
class C {
  #x = 1
  private y = 2
}
```

emits

```ts
declare class C {
  #private
  private y
}
```

which then downlevels to

```ts
declare class C {
  private "#private";
  private y;
}
```

This is incorrect if your class already has a field named `"#private"`.
But you really shouldn't do this!

The downlevel d.ts incorrectly prevents consumers from creating a
private property themselves named `"#private"`. The consumers of the
d.ts **also** shouldn't do this.

### `export * from 'x'` (3.8)

TypeScript 3.8 supports the new ECMAScript-standard `export * as namespace` syntax, which is just syntactic sugar for two import/export
statements:

```ts
export * as ns from 'x';
```

becomes

```ts
import * as ns_1 from "x";
export { ns_1 as ns };
```

#### Semantics

The downlevel semantics should be exactly the same as the original.

### `[named: number, tuple: string, ...members: boolean[]]` (4.0)

TypeScript 4.0 supports naming tuple members:

```ts
type T = [foo: number, bar: string];
```

becomes

```ts
type T = [/** foo */ number, /** bar */ string];
```

#### Semantics

The downlevel semantics are exactly the same as the original, but
the TypeScript language service won't be able to show the member names.

## Target

Since the earliest downlevel feature is from TypeScript 3.5,
downlevel-dts targets TypeScript 3.4 by default. The downlevel target is
configurable with `--to` argument.

Currently, TypeScript 3.0 features like `unknown` are not
downlevelled, nor are there any other plans to support TypeScript 2.x.

### Downlevel semantics

## Usage

1. `$ npm install downlevel-dts`
2. `$ npx downlevel-dts . ts3.4 [--to=3.4]`
3. To your package.json, add

```json
"typesVersions": {
  "<3.9": { "*": ["ts3.4/*"] }
}
```

4. `$ cp tsconfig.json ts3.9/tsconfig.json`

These instructions are modified and simplified from the Definitely Typed ones.
