import { parse as parseCode } from "./parser";

export const parse = parseCode;

type ExcludePredicates<Segment extends string> =
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Segment extends `${infer Name}.${infer _Predicates}` ? Name : Segment;

type SplitFirstSegmentEntity<TPath extends string> =
  TPath extends `/${infer Segment}/${infer Rest}`
    ? [ExcludePredicates<Segment>, `/${Rest}`]
    : TPath extends `/${infer Segment}`
    ? [ExcludePredicates<Segment>, ""]
    : ["", ""];

type Resolve<
  TDef,
  TPath extends string
> = SplitFirstSegmentEntity<TPath> extends [infer Segment, infer Rest]
  ? Segment extends keyof TDef
    ? TDef[Segment] extends (...args: never[]) => unknown
      ? Rest extends `/${infer Rest}`
        ? Resolve<ReturnType<TDef[Segment]>, `/${Rest}`>
        : ReturnType<TDef[Segment]>
      : never
    : never
  : never;

export class ResourceTree<TDef> {
  constructor(public def: TDef) {}

  query<TPath extends string>(path: TPath): Resolve<TDef, TPath> {
    const segments = parseCode(path);

    return segments.reduce((def, segment) => {
      const fn = def[segment.name];

      return fn(
        segment.predicates.reduce((param, predicate) => {
          return {
            ...param,
            [predicate.name]:
              predicate.params.length === 0
                ? [true]
                : predicate.params.map((param) => param.value),
          };
        }, {})
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }, this.def as any);
  }
}

export function encode(value: string) {
  return encodeURIComponent(value.replace("'", "\\'"));
}
