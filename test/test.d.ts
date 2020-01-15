export class C {
  protected get p(): number;
  protected set p(value: number);
  public get q(): string;
  private set r(value: boolean);
}
export namespace N {
  abstract class D {
    get p(): number;
    set p(value: number);
    get q();
    abstract set r(value: boolean);
  }
}
import type { C as CD } from "./src/test";

export * as rex from "./src/test";
