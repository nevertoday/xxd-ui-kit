import type { APIRoute } from "astro";
import { mdPages } from "../../../lib/md.js";

// 每页的 Markdown 版本（给 AI）；内容在 src/lib/md.js。
export function getStaticPaths() {
  return mdPages("en").map((p) => ({ params: { path: p.path }, props: { body: p.body } }));
}

export const GET: APIRoute = ({ props }) => new Response(props.body, { headers: { "content-type": "text/markdown; charset=utf-8" } });
