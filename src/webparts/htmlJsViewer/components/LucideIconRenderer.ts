const LUCIDE_BROWSE_URL = 'https://lucide.dev/icons/';
const DEFAULT_ICON_SIZE = 24;
const MAX_ICON_SIZE = 256;
const HEX_COLOR_PATTERN = /^#[0-9a-f]{3,8}$/i;
const ALLOWED_NODE_NAMES = new Set(['path', 'circle', 'ellipse', 'line', 'polyline', 'polygon', 'rect']);
const ALLOWED_NODE_ATTRIBUTES = new Set(['d', 'cx', 'cy', 'r', 'rx', 'ry', 'x', 'x1', 'x2', 'y', 'y1', 'y2', 'points', 'width', 'height']);

type ILucideNode = [string, Record<string, unknown>, ILucideNode[]?];

interface ILucideIconData {
  node: ILucideNode[];
}

interface ILucideRegistryModule {
  lucideDynamicIconImports: Record<string, () => Promise<{ default: ILucideIconData }> >;
  lucideIconNames: string[];
}

export interface ILucideIconResolution {
  document: string;
  warnings: string[];
}

let registryPromise: Promise<ILucideRegistryModule> | undefined;

export function normalizeLucideIconName(name: string): string {
  return name.trim().toLowerCase().replace(/[\s_]+/g, '-').replace(/-+/g, '-');
}

function getIconSize(value?: string): { value: number; warning?: string } {
  if (!value) {
    return { value: DEFAULT_ICON_SIZE };
  }
  const size = Number(value);
  if (!Number.isInteger(size) || size < 1 || size > MAX_ICON_SIZE) {
    return { value: DEFAULT_ICON_SIZE, warning: `Icon size must be a whole number from 1 to ${MAX_ICON_SIZE}.` };
  }
  return { value: size };
}

function getIconColor(value?: string): { value: string; warning?: string } {
  if (!value || value === 'currentColor') {
    return { value: value || 'currentColor' };
  }
  if (!HEX_COLOR_PATTERN.test(value)) {
    return { value: 'currentColor', warning: 'Icon color must be a hexadecimal color or currentColor.' };
  }
  return { value };
}

function escapeAttribute(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function renderNode(node: ILucideNode): string {
  const [name, attributes, children] = node;
  if (!ALLOWED_NODE_NAMES.has(name)) {
    return '';
  }
  const safeAttributes = Object.keys(attributes)
    .filter(attribute => ALLOWED_NODE_ATTRIBUTES.has(attribute))
    .map(attribute => ` ${attribute}="${escapeAttribute(String(attributes[attribute]))}"`)
    .join('');
  const childMarkup = children?.map(renderNode).join('') || '';
  return `<${name}${safeAttributes}>${childMarkup}</${name}>`;
}

function loadLucideRegistry(): Promise<ILucideRegistryModule> {
  if (!registryPromise) {
    registryPromise = import(/* webpackChunkName: "lucide-registry" */ '@lucide/icons/dynamic') as Promise<ILucideRegistryModule>;
  }
  return registryPromise;
}

function createIconMarkup(element: Element, icon: ILucideIconData, name: string): { markup: string; warnings: string[] } {
  const size = getIconSize(element.getAttribute('size') || undefined);
  const color = getIconColor(element.getAttribute('color') || undefined);
  const warnings = [size.warning, color.warning].filter((warning): warning is string => !!warning);
  const children = icon.node.map(renderNode).join('');
  return {
    markup: `<svg xmlns="http://www.w3.org/2000/svg" width="${size.value}" height="${size.value}" viewBox="0 0 24 24" fill="none" stroke="${escapeAttribute(color.value)}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-lucide="${escapeAttribute(name)}" aria-hidden="true" focusable="false">${children}</svg>`,
    warnings
  };
}

export async function getIconWarnings(htmlDocument: string): Promise<string[]> {
  if (!/<icon\b/i.test(htmlDocument)) {
    return [];
  }
  const parsedDocument = new DOMParser().parseFromString(htmlDocument, 'text/html');
  const registry = await loadLucideRegistry();
  const availableNames = new Set(registry.lucideIconNames.map(normalizeLucideIconName));
  const warnings: string[] = [];

  parsedDocument.querySelectorAll('icon').forEach(element => {
    const rawName = element.getAttribute('name') || '';
    const name = normalizeLucideIconName(rawName);
    if (!name || !availableNames.has(name)) {
      warnings.push(`Unknown Lucide icon "${rawName || '(missing name)'}". Browse ${LUCIDE_BROWSE_URL}`);
    }
    warnings.push(...[getIconSize(element.getAttribute('size') || undefined).warning, getIconColor(element.getAttribute('color') || undefined).warning]
      .filter((warning): warning is string => !!warning));
  });
  return Array.from(new Set(warnings));
}

export async function resolveLucideIcons(htmlDocument: string): Promise<ILucideIconResolution> {
  if (!/<icon\b/i.test(htmlDocument)) {
    return { document: htmlDocument, warnings: [] };
  }
  const parsedDocument = new DOMParser().parseFromString(htmlDocument, 'text/html');
  const registry = await loadLucideRegistry();
  const warnings: string[] = [];

  for (const element of Array.from(parsedDocument.querySelectorAll('icon'))) {
    const rawName = element.getAttribute('name') || '';
    const name = normalizeLucideIconName(rawName);
    const loader = registry.lucideDynamicIconImports[name];
    if (!loader) {
      warnings.push(`Unknown Lucide icon "${rawName || '(missing name)'}". Browse ${LUCIDE_BROWSE_URL}`);
      element.remove();
      continue;
    }
    const icon = (await loader()).default;
    const rendered = createIconMarkup(element, icon, name);
    warnings.push(...rendered.warnings);
    const replacement = parsedDocument.createElement('span');
    replacement.innerHTML = rendered.markup;
    element.replaceWith(replacement.firstElementChild as Element);
  }

  return {
    document: `<!doctype html>${parsedDocument.documentElement.outerHTML}`,
    warnings: Array.from(new Set(warnings))
  };
}
