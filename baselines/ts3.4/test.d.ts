/// <reference path="./src/test.d.ts" />
/// <reference types="node" />
export class C {
    protected p: number;
    public readonly q: string;
    private r: boolean;
}
// hi, this should still be there
export namespace N {
    abstract class D {
        p: number;
        readonly q: any;
        abstract r: boolean;
    }
}
import { C as CD } from "./src/test";
import * as rex_1 from "./src/test";
export { rex_1 as rex } from "./src/test";
