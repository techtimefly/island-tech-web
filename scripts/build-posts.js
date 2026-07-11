const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const contentDir = path.join(root, 'content', 'islandtech', 'posts');
const outputDir = path.join(root, 'sites', 'islandtech', 'posts');
const requiredFields = ['title', 'date', 'description', 'category', 'tags'];

const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

const slugify = (value) => String(value)
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '');

const formatDate = (value) => {
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) throw new Error(`Invalid date: ${value}`);
  return new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(date);
};

const parseFrontmatter = (file, raw) => {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) throw new Error(`${file} is missing frontmatter`);

  const data = {};
  const lines = match[1].split('\n');
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (!line.trim()) continue;

    const keyMatch = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!keyMatch) throw new Error(`${file} has invalid frontmatter line: ${line}`);

    const key = keyMatch[1];
    let value = keyMatch[2].trim();
    if (value === '') {
      const list = [];
      while (lines[index + 1] && /^\s+-\s+/.test(lines[index + 1])) {
        index += 1;
        list.push(lines[index].replace(/^\s+-\s+/, '').replace(/^['"]|['"]$/g, ''));
      }
      data[key] = list;
    } else {
      data[key] = value.replace(/^['"]|['"]$/g, '');
    }
  }

  for (const field of requiredFields) {
    if (!data[field] || (Array.isArray(data[field]) && data[field].length === 0)) {
      throw new Error(`${file} is missing required frontmatter field: ${field}`);
    }
  }

  if (!Array.isArray(data.tags)) data.tags = [data.tags];
  return { data, body: match[2].trim() };
};

const inlineMarkdown = (text) => {
  const codeTokens = [];
  let rendered = escapeHtml(text).replace(/`([^`]+)`/g, (_match, code) => {
    const token = `@@CODE${codeTokens.length}@@`;
    codeTokens.push(`<code>${code}</code>`);
    return token;
  });

  rendered = rendered
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/\[([^\]]+)\]\(([^\s)]+)\)/g, (_match, label, href) => `<a href="${escapeHtml(href)}">${label}</a>`)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

  codeTokens.forEach((code, index) => {
    rendered = rendered.replace(`@@CODE${index}@@`, code);
  });
  return rendered;
};

const renderMarkdown = (markdown) => {
  const lines = markdown.split('\n');
  const html = [];
  let paragraph = [];
  let list = null;
  let inCode = false;
  let codeLang = '';
  let codeLines = [];

  const flushParagraph = () => {
    if (!paragraph.length) return;
    html.push(`<p>${inlineMarkdown(paragraph.join(' '))}</p>`);
    paragraph = [];
  };

  const flushList = () => {
    if (!list) return;
    html.push(`<${list.type}>${list.items.map((item) => `<li>${inlineMarkdown(item)}</li>`).join('')}</${list.type}>`);
    list = null;
  };

  const flushCode = () => {
    html.push(`<pre><code${codeLang ? ` class="language-${escapeHtml(codeLang)}"` : ''}>${escapeHtml(codeLines.join('\n'))}</code></pre>`);
    codeLines = [];
    codeLang = '';
  };

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith('```')) {
      flushParagraph();
      flushList();
      if (inCode) {
        flushCode();
        inCode = false;
      } else {
        inCode = true;
        codeLang = trimmed.slice(3).trim();
      }
      continue;
    }

    if (inCode) {
      codeLines.push(line);
      continue;
    }

    if (!trimmed) {
      flushParagraph();
      flushList();
      continue;
    }

    const heading = trimmed.match(/^(#{2,4})\s+(.+)$/);
    if (heading) {
      flushParagraph();
      flushList();
      const level = heading[1].length;
      const content = inlineMarkdown(heading[2]);
      const id = slugify(heading[2]);
      html.push(`<h${level} id="${id}">${content}</h${level}>`);
      continue;
    }

    const unordered = trimmed.match(/^-\s+(.+)$/);
    if (unordered) {
      flushParagraph();
      if (!list || list.type !== 'ul') {
        flushList();
        list = { type: 'ul', items: [] };
      }
      list.items.push(unordered[1]);
      continue;
    }

    const ordered = trimmed.match(/^\d+\.\s+(.+)$/);
    if (ordered) {
      flushParagraph();
      if (!list || list.type !== 'ol') {
        flushList();
        list = { type: 'ol', items: [] };
      }
      list.items.push(ordered[1]);
      continue;
    }

    paragraph.push(trimmed);
  }

  flushParagraph();
  flushList();
  if (inCode) flushCode();
  return html.join('\n');
};

const pageShell = ({ title, description, body, prefix = '' }) => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}">
    <link rel="stylesheet" href="${prefix}styles.css">
    <script>try{const t=localStorage.getItem("islandtech-theme");const d=window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches;document.documentElement.dataset.theme=t|| (d?"dark":"light");}catch(e){}</script>
  </head>
  <body>
    <header class="site-header">
      <a class="brand" href="${prefix}index.html" aria-label="Island Tech IO home">
        <img src="${prefix}assets/island_tech_logo.png" alt="" width="56" height="56">
        <span>Island Tech IO</span>
      </a>
      <nav aria-label="Main navigation">
        <a href="${prefix}index.html#offers">Services</a>
        <a href="${prefix}engagements.html">Engagements</a>
        <a href="${prefix}insights.html">Insights</a>
        <a href="${prefix}about.html">About</a>
        <a class="nav-cta" href="${prefix}index.html#contact">Contact</a>
      </nav>
      <button class="theme-toggle" type="button" aria-label="Toggle color theme" title="Toggle color theme" data-theme-toggle>
        <span class="theme-toggle-icon" aria-hidden="true">◐</span>
      </button>
    </header>

    <main>
${body}
    </main>

    <button class="back-to-top" type="button" aria-label="Back to top">Back to top</button>

    <footer>
      <p>Island Tech IO is a registered DBA of Island Tech Solutions LLC, a Colorado LLC formed in 2022.</p>
      <p class="footer-links"><a href="mailto:contact@islandtech.io">contact@islandtech.io</a><a href="${prefix}privacy.html">Privacy</a></p>
    </footer>
    <script src="${prefix}site.js" defer></script>
  </body>
</html>
`;

const renderPost = (post) => pageShell({
  title: `${post.title} | Island Tech IO`,
  description: post.description,
  prefix: '../',
  body: `      <article class="post-page">
        <header class="post-header">
          <p class="eyebrow">${escapeHtml(post.category)}</p>
          <h1>${escapeHtml(post.title)}</h1>
          <p class="lede">${escapeHtml(post.description)}</p>
          <div class="post-meta">
            <time datetime="${escapeHtml(post.date)}">${escapeHtml(formatDate(post.date))}</time>
            <span>${post.tags.map(escapeHtml).join(' / ')}</span>
          </div>
        </header>
        <div class="post-body">
${post.html.split('\n').map((line) => `          ${line}`).join('\n')}
        </div>
        <aside class="post-cta">
          <p class="eyebrow">Consulting</p>
          <h2>Need help turning AppSec findings into useful engineering signal?</h2>
          <p>Island Tech IO helps teams tune tools, workflows, and DevSecOps pipelines so security output becomes practical engineering work.</p>
          <div class="hero-actions">
            <a class="button primary" href="../index.html#contact">Start a Conversation</a>
            <a class="button secondary" href="index.html">Back to Insights</a>
          </div>
        </aside>
      </article>`,
});

const renderIndex = (posts) => pageShell({
  title: 'Posts | Island Tech IO',
  description: 'AppSec, DevSecOps, tooling, and veteran technology career posts from Island Tech IO.',
  prefix: '../',
  body: `      <section class="page-hero narrow-hero">
        <p class="eyebrow">Posts</p>
        <h1>Field notes with enough detail to use.</h1>
        <p class="lede">Writing on AppSec tooling, DevSecOps workflows, vulnerability operations, AI security, and career lessons from the engineering floor.</p>
      </section>

      <section class="section posts-list">
${posts.map((post) => `        <article>
          <p class="eyebrow">${escapeHtml(post.category)}</p>
          <h2><a href="${escapeHtml(post.outputName)}">${escapeHtml(post.title)}</a></h2>
          <p>${escapeHtml(post.description)}</p>
          <div class="post-meta">
            <time datetime="${escapeHtml(post.date)}">${escapeHtml(formatDate(post.date))}</time>
            <span>${post.tags.map(escapeHtml).join(' / ')}</span>
          </div>
        </article>`).join('\n')}
      </section>`,
});

if (!fs.existsSync(contentDir)) {
  fs.mkdirSync(contentDir, { recursive: true });
}

const files = fs.readdirSync(contentDir).filter((file) => file.endsWith('.md')).sort();
const posts = files.map((file) => {
  const raw = fs.readFileSync(path.join(contentDir, file), 'utf8');
  const { data, body } = parseFrontmatter(file, raw);
  const slug = slugify(path.basename(file, '.md').replace(/^\d{4}-\d{2}-\d{2}-/, ''));
  return {
    ...data,
    source: file,
    outputName: `${data.date}-${slug}.html`,
    html: renderMarkdown(body),
  };
}).sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title));

fs.rmSync(outputDir, { recursive: true, force: true });
fs.mkdirSync(outputDir, { recursive: true });

for (const post of posts) {
  fs.writeFileSync(path.join(outputDir, post.outputName), renderPost(post), 'utf8');
}

fs.writeFileSync(path.join(outputDir, 'index.html'), renderIndex(posts), 'utf8');
console.log(`Built ${posts.length} Island Tech post${posts.length === 1 ? '' : 's'}.`);
