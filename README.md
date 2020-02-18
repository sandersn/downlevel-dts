downlevel-dts rewrites .d.ts files created by any version of Typescript so
that they work with Typescript 3.4 or later. It does this by
converting code with new features into code that uses equivalent old
features. For example, it rewrites accessors to properties, because
Typescript didn't support accessors in .d.ts files until 3.6:

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

`Omit` has had non-builtin implementations since Typescript 2.2, but
became built-in in Typescript 3.5.

### Accessors (3.6)

Typescript prevented accessors from being in .d.ts files until
Typescript 3.6 because they behave very similarly to properties.
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

### Type-only import/export (3.8)

Typescript 3.8 supports type-only imports, but they are stricter than
Typescript's original imports, which let you import types or values.
So the downlevel emit is quite simple:

```ts
import type { T } from 'x';
```

becomes

```ts
import { T } from "x";
```

### `#private` (3.8)

Typescript 3.8 supports the new ECMAScript-standard #private properties in
addition to its compile-time-only private properties. Since neither
are accessible at compile-time, downlevel-dts converts #private
properties to compile-time private properties:

```ts
declare class C {
  #private
}
```

(This is the standard emit for _any_ class with a #private property.)
It becomes:

```ts
declare class C {
  private "#private"`
}
```

This is incorrect if your class already has a field named `"#private"`.
But you really shouldn't do this!

### `export * from 'x'` (3.8)

Typescript 3.8 supports the new ECMAScript-standard `export * as namespace` syntax, which is just syntactic sugar for two import/export
statements:

```ts
export * as ns from 'x';
```

becomes

```ts
import * as ns_1 from "x";
export { ns_1 as ns };
```

## Target

All told, that means that downlevel-dts targets Typescript 3.4. In the
future the downlevel target may be configurable as Typescript 3.4
becomes less used.

Currently, Typescript 3.0 features like `unknown` are not
downlevelled, nor are there plans to support Typescript 2.x.

## Usage

1. `$ npm install downlevel-dts`
2. `$ npx downlevel-dts . ts3.4`
3. To your package.json, add

```json
"typesVersions": {
  "<=3.5": { "*": ["ts3.4/*"] }
}
```

4. `$ cp tsconfig.json ts3.4/tsconfig.json`

These instructions are modified and simplified from the Definitely Typed.
