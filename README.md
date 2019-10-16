## Usage

1. `$ npm install downlevel-dts`
2. `$ npx downlevel-dts . ts3.4`
3. To your package.json, add

```json
"typesVersions": {
  "<=3.4.0-0": { "*": ["ts3.4/*"] }
}
```

4. `$ cp tsconfig.json ts3.4/tsconfig.json`

These instructions are modified and simplified from the Definitely Typed.
