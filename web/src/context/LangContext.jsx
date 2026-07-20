import React, { createContext, useContext, useEffect, useState } from "react";

const LangCtx = createContext(null);
const KEY = "nova_lang";

export function LangProvider({ children }) {
  const [lang, setLangState] = useState(() => localStorage.getItem(KEY) || "en");

  const setLang = (l) => {
    setLangState(l);
    localStorage.setItem(KEY, l);
  };

  useEffect(() => {
    document.documentElement.lang = lang === "zh" ? "zh" : "en";
  }, [lang]);

  return (
    <LangCtx.Provider value={{ lang, setLang, isZh: lang === "zh" }}>
      {children}
    </LangCtx.Provider>
  );
}

export function useLang() {
  return useContext(LangCtx);
}

/** Pick English or Chinese string */
export function t(lang, en, zh) {
  return lang === "zh" ? zh : en;
}
