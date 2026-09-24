// Next.js adds the site's base path to page links automatically, but NOT to
// files in the public/ folder (music, pictures). Wrap those paths in this.
// Without it the music and the red panda load on your computer and quietly
// 404 on GitHub Pages, where the site lives under /Mathquest-for-kids.
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

export function assetPath(path: string): string {
  return `${BASE_PATH}${path}`;
}
