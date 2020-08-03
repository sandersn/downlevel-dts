/// <reference types="node" />
/// <reference path="./src/test.d.ts" />
export class C {
  protected get p(): number;
  protected set p(value: number);
  public get q(): string;
  private set r(value: boolean);
}
// hi, this should still be there
export namespace N {
  abstract class D {
    /**
     * @readonly
     * @memberof BlobLeaseClient
     * @type {number}
     */
    get p(): number;
    /** preserve this too */
    set p(value: number);
    get q();
    abstract set r(value: boolean);
  }
}
import type { C as CD } from "./src/test";

export * as rex from "./src/test";

export interface E {
  a: number;
  b: number;
}

export type F = Omit<E, 'a'>

export class G {
    #private
}
export class H extends G {
    #private
}
declare function guardIsString(val: any): val is string;
declare function assertIsString(val: any, msg?: string): asserts val is string;
declare function assert(val: any, msg?: string): asserts val;
