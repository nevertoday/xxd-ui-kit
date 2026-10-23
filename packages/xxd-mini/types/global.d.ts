declare module "*.css";
declare module "../styles/vars.js" {
  import type { TokenModes } from "@xxd/tokens/resolve";
  export const MODES: TokenModes;
  export const MIXES: Record<string, string>;
}
