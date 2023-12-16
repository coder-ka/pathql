import { Streams, C, N, F, SingleParser } from "@masala/parser";
import pc from "picocolors";

type GetSingleParserValue<T> = T extends SingleParser<infer R> ? R : never;

const blanks = C.char(" ").optrep().drop();
const comma = C.char(",").drop();
const nil = C.string("null").map(() => ({
  type: "null" as const,
  value: null,
}));
const boolean = C.string("true")
  .map((x) => x as "true")
  .or(C.string("false").map((x) => x as "false"))
  .map((value) => ({
    type: "boolean" as const,
    value: value === "true",
  }));
const escapedQuote = C.char("\\").drop().then(C.char("'")).last();
const char = escapedQuote.or(C.charNotIn("'"));
const string = C.char("'")
  .drop()
  .then(char.rep())
  .then(C.char("'").drop())
  .map((value) => ({
    type: "string" as const,
    value: value.join(),
  }));

string.parse(Streams.ofString(`''`));

const number = N.number().map((value) => ({
  type: "number" as const,
  value: value,
}));
const value = nil.or(boolean).or(string).or(number);
export type Value = GetSingleParserValue<typeof value>;
const param = blanks.then(value).then(blanks).single();
export type Param = GetSingleParserValue<typeof param>;
const restParam = comma.then(param).last();
const predicateParams = param
  .then(restParam.optrep().array())
  .array()
  .map((value) => {
    const [param, restParam] = value as [Param, Param[]];

    return [param, ...restParam];
  });
const predicateCall = C.char("(")
  .drop()
  .then(blanks)
  .then(
    predicateParams.opt().map((value) => (value.isPresent() ? value.value : []))
  )
  .then(blanks)
  .then(C.char(")").drop())
  .single()
  .map((value) => value as Param[]);
const predicateName = C.charNotIn("(./")
  .rep()
  .map((value) => value.join());
const predicateBody = predicateName
  .then(
    predicateCall.opt().map((value) => (value.isPresent() ? value.value : []))
  )
  .map((tuple) => {
    const [name, params] = tuple.array() as [string, Param[]];

    return {
      name,
      params,
    };
  });
const predicate = C.char(".").drop().then(predicateBody).last();
export type Predicate = GetSingleParserValue<typeof predicate>;
const predicates = predicate.optrep().array();
const segmentName = C.charNotIn("/.")
  .rep()
  .map((value) => value.join());
const segmentBody = segmentName.then(predicates).map((tuple) => {
  const [name, predicates] = tuple.array() as [string, Predicate[]];

  return {
    name,
    predicates,
  };
});
const segment = C.char("/").drop().then(segmentBody).last();
export type Segment = GetSingleParserValue<typeof segment>;
const segments = segment.rep().map((tuple) => tuple.array());

const expr = segments.then(F.eos().drop()).first();

export function parse(path: string) {
  const normalized = decodeURIComponent(path[0] === "/" ? path : "/" + path);

  const stream = Streams.ofString(normalized);

  const parsing = expr.parse(stream);

  if (!parsing.isAccepted()) {
    const location = parsing.location();

    throw new SyntaxError(
      `Syntax Error found at ${location}: ${normalized.slice(
        0,
        location - 1
      )}${pc.underline(pc.bgRed(normalized[location]))}${normalized.slice(
        location
      )}`
    );
  }

  return parsing.value;
}
