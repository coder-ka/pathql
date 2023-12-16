import { deepStrictEqual } from "assert";
import { parse } from "../";

const ast = parse(
  `/user.is_admin/posts.published.str('hoge').num(1).bool(true).multiple('fuga', 20, false)`
);

deepStrictEqual(ast, [
  { name: "user", predicates: [{ name: "is_admin", params: [] }] },
  {
    name: "posts",
    predicates: [
      { name: "published", params: [] },
      { name: "str", params: [{ type: "string", value: "hoge" }] },
      { name: "num", params: [{ type: "number", value: 1 }] },
      { name: "bool", params: [{ type: "boolean", value: true }] },
      {
        name: "multiple",
        params: [
          { type: "string", value: "fuga" },
          { type: "number", value: 20 },
          { type: "boolean", value: false },
        ],
      },
    ],
  },
]);
