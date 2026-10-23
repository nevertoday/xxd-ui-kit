import { useState, type PropsWithChildren } from "react";
import "@xxd/mini/tokens.css";
import { XxdProvider, type Lang } from "@xxd/mini";
import { EMBED, EmbedBridge, embedSettings } from "./embed";
import { LangCtx, readLang, saveLang } from "./i18n";
import "./app.css";

export default function App({ children }: PropsWithChildren) {
  const [lang, setLangState] = useState<Lang>(readLang);
  const setLang = (l: Lang) => {
    saveLang(l);
    setLangState(l);
  };
  return (
    <LangCtx.Provider value={{ lang, setLang }}>
      <XxdProvider lang={lang} persist={!EMBED} initial={embedSettings()}>
        <EmbedBridge />
        {children}
      </XxdProvider>
    </LangCtx.Provider>
  );
}
