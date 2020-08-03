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
export interface E {
    a: number;
    b: number;
}
export type F = Pick<E, Exclude<keyof E, 'a'>>;
export class G {
    private "G.#private";
}
export class H extends G {
    private "H.#private";
}
export interface I extends Pick<E, Exclude<keyof E, 'a'>> {
    version: number;
}
declare function guardIsString(val: any): val is string;
declare function assertIsString(val: any, msg?: string): void;
declare function assert(val: any, msg?: string): void;
