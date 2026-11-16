import { access, readFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const requiredFiles = [
  'index.html',
  '404.html',
  'CNAME',
  '.nojekyll',
  'favicon.ico',
  'robots.txt',
  'sitemap.xml',
  'site.webmanifest',
  '.well-known/security.txt'
];

const failures = [];
const check = (condition, message) => {
  if (!condition) failures.push(message);
};

for (const relativePath of requiredFiles) {
  try {
    await access(path.join(root, relativePath), constants.R_OK);
  } catch {
    failures.push(`Missing required file: ${relativePath}`);
  }
}

const html = await readFile(path.join(root, 'index.html'), 'utf8');
const activeHtml = html.replace(/<template\b[\s\S]*?<\/template>/gi, '');

check(/<meta\s+name="description"\s+content="[^"]+"/i.test(html), 'Missing meta description.');
check(/<link\s+rel="canonical"\s+href="https:\/\/troublehacker\.in\/"/i.test(html), 'Missing canonical home URL.');
check(/<meta\s+property="og:title"/i.test(html), 'Missing Open Graph title.');
check(/<meta\s+name="twitter:card"/i.test(html), 'Missing Twitter card metadata.');
check(/<script\s+type="application\/ld\+json">/i.test(html), 'Missing JSON-LD structured data.');
check(!html.includes('/cdn-cgi/'), 'Cloudflare-only email decoder reference remains.');
check(!/CVE[‑-]2020[‑-]2872(?!\d)/u.test(html), 'Incorrect CVE-2020-2872 reference remains.');
check(!/href=(['"])#\1/i.test(activeHtml), 'Placeholder href="#" remains in active content.');
check((activeHtml.match(/<main\b/gi) ?? []).length === 1, 'Active document must contain exactly one <main>.');
check((activeHtml.match(/<h1\b/gi) ?? []).length === 1, 'Active document must contain exactly one <h1>.');
check(activeHtml.includes('mailto:adity4soni@gmail.com'), 'Accessible email link is missing.');

for (const match of activeHtml.matchAll(/<a\b([^>]*\btarget="_blank"[^>]*)>/gi)) {
  const attributes = match[1];
  const rel = attributes.match(/\brel="([^"]*)"/i)?.[1] ?? '';
  check(rel.split(/\s+/).includes('noopener'), `target="_blank" link lacks rel="noopener": <a${attributes}>`);
}

for (const match of activeHtml.matchAll(/href="(#[^"]+)"/gi)) {
  const id = match[1].slice(1);
  check(new RegExp(`\\bid=["']${id}["']`, 'i').test(activeHtml), `Anchor target is missing: #${id}`);
}

for (const match of html.matchAll(/<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/gi)) {
  try {
    JSON.parse(match[1]);
  } catch (error) {
    failures.push(`Invalid JSON-LD: ${error.message}`);
  }
}

try {
  JSON.parse(await readFile(path.join(root, 'site.webmanifest'), 'utf8'));
} catch (error) {
  failures.push(`Invalid site.webmanifest JSON: ${error.message}`);
}

const robots = await readFile(path.join(root, 'robots.txt'), 'utf8');
check(robots.includes('Sitemap: https://troublehacker.in/sitemap.xml'), 'robots.txt does not advertise the sitemap.');

const sitemap = await readFile(path.join(root, 'sitemap.xml'), 'utf8');
check(sitemap.includes('<loc>https://troublehacker.in/</loc>'), 'Home URL is missing from sitemap.xml.');

const security = await readFile(path.join(root, '.well-known/security.txt'), 'utf8');
const expires = security.match(/^Expires:\s*(.+)$/m)?.[1];
check(Boolean(expires) && Date.parse(expires) > Date.now(), 'security.txt Expires value must be in the future.');

if (failures.length) {
  console.error(`Site validation failed with ${failures.length} issue(s):`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`Site validation passed (${requiredFiles.length} required files checked).`);
