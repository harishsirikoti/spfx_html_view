declare module '@lucide/icons/dynamic' {
  export const lucideDynamicIconImports: Record<string, () => Promise<{ default: { node: Array<[string, Record<string, unknown>, Array<unknown>?]> } }>>;
  export const lucideIconNames: string[];
}
