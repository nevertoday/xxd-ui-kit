import { createContext, useContext, useMemo, type ReactNode } from "react";

export interface KumoTranslations {
  label?: {
    optional: string;
    tooltip: string;
  };
  layerDialog: {
    close: string;
    cancel: string;
    moreActions?: string;
  };
  /** Copy shared by many components (copy buttons, close buttons, loaders…). */
  common?: {
    copy: string;
    copied: string;
    copyToClipboard: string;
    copiedToClipboard: string;
    clickToCopy: string;
    copyCommand: string;
    close: string;
    loading: string;
    loadingChart: string;
    noResults: string;
    clearSelection: string;
    showOptions: string;
    remove: string;
    breadcrumb: string;
    resizeColumn: string;
    hideValue: string;
    revealValue: string;
    valueHidden: string;
    previousMonth: string;
    nextMonth: string;
    editMonthYear: string;
  };
  pagination?: {
    navigation: string;
    firstPage: string;
    previousPage: string;
    nextPage: string;
    lastPage: string;
    pageNumber: string;
    pageSize: string;
  };
}

export type KumoTranslationsPartial = {
  [Key in keyof KumoTranslations]?: Partial<NonNullable<KumoTranslations[Key]>>;
};

type ResolvedKumoTranslations = {
  [Key in keyof KumoTranslations]-?: NonNullable<KumoTranslations[Key]>;
};

const defaultTranslations: ResolvedKumoTranslations = {
  label: {
    optional: "(optional)",
    tooltip: "More information",
  },
  layerDialog: {
    close: "Close",
    cancel: "Cancel",
    moreActions: "More actions",
  },
  common: {
    copy: "Copy",
    copied: "Copied",
    copyToClipboard: "Copy to clipboard",
    copiedToClipboard: "Copied to clipboard",
    clickToCopy: "Click to copy",
    copyCommand: "Copy command",
    close: "Close",
    loading: "Loading",
    loadingChart: "Loading chart",
    noResults: "No results found",
    clearSelection: "Clear selection",
    showOptions: "Show options",
    remove: "Remove",
    breadcrumb: "breadcrumb",
    resizeColumn: "Resize column",
    hideValue: "Hide value",
    revealValue: "Reveal value",
    valueHidden: "Value hidden",
    previousMonth: "Previous month",
    nextMonth: "Next month",
    editMonthYear: "Edit month and year",
  },
  pagination: {
    navigation: "Pagination",
    firstPage: "First page",
    previousPage: "Previous page",
    nextPage: "Next page",
    lastPage: "Last page",
    pageNumber: "Page number",
    pageSize: "Page size",
  },
};

const KumoLocaleContext =
  createContext<ResolvedKumoTranslations>(defaultTranslations);

export interface KumoLocaleProviderProps {
  children: ReactNode;
  /**
   * Partial overrides for Kumo's built-in English copy. Components without an
   * override continue to use their English defaults.
   */
  translations?: KumoTranslationsPartial;
}

/**
 * Supplies translations for Kumo-owned UI copy. Explicit component props take
 * precedence over these defaults.
 */
export function KumoLocaleProvider({
  children,
  translations,
}: KumoLocaleProviderProps) {
  const value = useMemo<ResolvedKumoTranslations>(() => {
    const merged = { ...defaultTranslations } as Record<string, object>;
    for (const [key, part] of Object.entries(translations ?? {})) {
      merged[key] = { ...merged[key], ...part };
    }
    return merged as ResolvedKumoTranslations;
  }, [translations]);

  return (
    <KumoLocaleContext.Provider value={value}>
      {children}
    </KumoLocaleContext.Provider>
  );
}

/** @internal Used by Kumo components to resolve translated built-in copy. */
export function useKumoLocale(): ResolvedKumoTranslations {
  return useContext(KumoLocaleContext);
}
