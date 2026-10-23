import type { APIRoute } from "astro";
import { registryFor } from "../../../lib/data.js";
export const GET: APIRoute = () => new Response(JSON.stringify(registryFor("en"), null, 2), { headers: { "content-type": "application/json; charset=utf-8" } });
