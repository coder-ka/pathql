import { deepStrictEqual } from "assert";
import { ResourceTree } from "../";

const rt = new ResourceTree({
  admin() {
    return {
      posts({ published }: { published?: [boolean] }) {
        return {
          get() {
            return [
              {
                id: 0,
                name: "post1",
                published: true,
              },
              {
                id: 1,
                name: "post2",
                published: true,
              },
              {
                id: 2,
                name: "post3",
                published: false,
              },
            ].filter(
              (x) => published === undefined || x.published === published[0]
            );
          },
        };
      },
    };
  },
});

const posts = rt.query("/admin/posts.published").get();

deepStrictEqual(posts, [
  {
    id: 0,
    name: "post1",
    published: true,
  },
  {
    id: 1,
    name: "post2",
    published: true,
  },
]);
