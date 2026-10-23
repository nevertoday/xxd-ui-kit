import type { APIRoute } from "astro";
import { llmsTxt } from "../../lib/md.js";

// 全站目录（给 AI）：每页一行，带 .md 版本的地址。内容在 src/lib/md.js。
export const GET: APIRoute = () => new Response(llmsTxt("en"), { headers: { "content-type": "text/plain; charset=utf-8" } });
