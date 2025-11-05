const express = require('express');
const Page = require('../models/Page');

const router = express.Router();

// -----------------------------
// Sitemap (dynamic)
// -----------------------------
router.get('/sitemap.xml', async (req, res) => {
  try {
    const pages = await Page.find({}, 'slug updatedAt').sort({ updatedAt: -1 });
    const baseUrl = req.protocol + '://' + req.get('host');
    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url>\n    <loc>${baseUrl}/</loc>\n    <lastmod>${new Date().toISOString()}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>`;
    pages.forEach(p => {
      const lastmod = p.updatedAt ? p.updatedAt.toISOString() : new Date().toISOString();
      sitemap += `\n  <url>\n    <loc>${baseUrl}/${p.slug}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>`;
    });
    sitemap += '\n</urlset>';
    res.setHeader('Content-Type', 'application/xml');
    res.send(sitemap);
  } catch (e) {
    console.error('Sitemap generation error:', e);
    res.status(500).send('Error generating sitemap');
  }
});

// -----------------------------
// Robots
// -----------------------------
router.get('/robots.txt', (req, res) => {
  const baseUrl = req.protocol + '://' + req.get('host');
  const robots = `User-agent: *\nAllow: /\n\nSitemap: ${baseUrl}/sitemap.xml\n\nDisallow: /admin/\nDisallow: /api/`;
  res.setHeader('Content-Type', 'text/plain');
  res.send(robots);
});

// -----------------------------
// Home (simple marketing / recent pages)
// -----------------------------
router.get('/', async (req, res) => {
  try {
    const recentPages = await Page.find().select('slug title metaDescription').sort({ createdAt: -1 }).limit(10);
    const sections = [
      'Transform your SEO strategy with automated page generation. Upload CSV data and generate hundreds of optimized landing pages in minutes.',
      'Perfect for local businesses, service providers, and marketers needing location or product specific landing pages at scale.',
      'Each generated page includes structured data, meta tags, and clean semantic HTML built to rank.'
    ];
    const faq = [
      { q: 'How does programmatic SEO work?', a: 'Upload a CSV + JSON template. Each row becomes a page with variables filled.' },
      { q: 'Is the output SEO friendly?', a: 'Yes. Titles, meta descriptions, JSON-LD (FAQ) and clean markup are included.' },
      { q: 'Can I add custom variables?', a: 'Add headers to your CSV and reference them in the JSON template with {variable} placeholders.' }
    ];
    const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Programmatic SEO Tool - Generate SEO Pages at Scale</title><meta name="description" content="Create hundreds of SEO-optimized landing pages automatically."><link rel="stylesheet" href="/styles.css"><link rel="stylesheet" href="/templates.css"></head><body class="variant-basic"><header><div class="container"><a class="logo" href="/">Programmatic SEO Tool</a><nav><a href="/">Home</a><a href="/sitemap.xml">Sitemap</a><a href="/admin">Admin</a></nav></div></header><main><div class="container"><h1>Welcome to Programmatic SEO Tool</h1>${sections.map(s=>`<div class='section'><p>${s}</p></div>`).join('')}${faq.length?`<div class='faq-container'><h2>Frequently Asked Questions</h2>${faq.map(f=>`<div class='faq-item'><div class='faq-question'>${f.q}</div><div class='faq-answer'>${f.a}</div></div>`).join('')}</div>`:''}${recentPages.length?`<div class='related-pages'><h3>Recently Generated Pages</h3><div class='related-links'>${recentPages.slice(0,6).map(p=>`<a href='/${p.slug}'>${p.title}</a>`).join('')}</div></div>`:''}<div class='section'><h2>Get Started</h2><p><a class='btn btn-primary' href='/admin'>Admin Panel</a> to upload your CSV and template.</p></div></div></main><footer><div class="container"><p>&copy; ${new Date().getFullYear()} Programmatic SEO Tool.</p><p><a href="/sitemap.xml">Sitemap</a> | <a href="/admin">Admin Panel</a></p></div></footer></body></html>`;
    res.send(html);
  } catch (e) {
    console.error('Home page error:', e);
    res.status(500).send('Error loading home page');
  }
});

// -----------------------------
// Template map (templateKey -> view + variant)
// -----------------------------
const TEMPLATE_MAP = {
  'minimal': { variant: 'basic', view: 'page_template_minimal' },
  'local-seo': { variant: 'basic', view: 'page_template_minimal' },
  'service-landing': { variant: 'service', view: 'page_template_modern_blue' },
  'modern-blue': { variant: 'service', view: 'page_template_modern_blue' },
  'dark-pastel': { variant: 'dark', view: 'page_template_dark_pastel' },
  'faq-rich': { variant: 'faq', legacyInline: true }
};

// -----------------------------
// Dynamic page route
// -----------------------------
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const page = await Page.findOne({ slug });
    if (!page) {
      return res.status(404).send(`<!DOCTYPE html><html><head><title>Page Not Found</title><style>body{font-family:Arial, sans-serif;margin:40px;text-align:center;}h1{color:#333;}a{color:#4f46e5;text-decoration:none;}</style></head><body><h1>Page Not Found</h1><p>The page "${slug}" does not exist.</p><p><a href="/">← Back to Home</a> | <a href="/admin">Admin Panel</a></p></body></html>`);
    }

    const templateDef = TEMPLATE_MAP[page.templateKey] || TEMPLATE_MAP['minimal'];
    const relatedPages = await Page.find({ templateKey: page.templateKey, slug: { $ne: page.slug } })
      .select('slug title').limit(6);

    // Legacy inline FAQ heavy template
    if (templateDef.legacyInline) {
      const variant = 'faq';
      const tocItems = [];
      (page.sections||[]).slice(0,3).forEach((s,idx)=> tocItems.push(`Section ${idx+1}`));
      if (page.faq) page.faq.slice(0,5).forEach(f=> tocItems.push(f.q));
      const tocBlock = tocItems.length ? `<div class="toc"><strong>On this page:</strong><ul style="margin:10px 0 0; padding-left:18px; line-height:1.4;">${tocItems.map(t=>`<li>${t}</li>`).join('')}</ul></div>` : '';
      const faqFirstBlock = page.faq && page.faq.length ? `<div class="faq-container"><h2 class="focal-faq-heading">Frequently Asked Questions</h2>${page.faq.map(f=>`<div class='faq-item'><div class='faq-question'>${f.q}</div><div class='faq-answer'>${f.a}</div></div>`).join('')}</div>` : '';
      const sectionMarkup = (page.sections||[]).slice(0,2).map(s=>`<div class='section'><p>${s}</p></div>`).join('');
      const relatedBlock = relatedPages.length ? `<div class='related-pages'><h2>Related Pages</h2><div class='related-links'>${relatedPages.map(r=>`<a href='/${r.slug}'>${r.title}</a>`).join('')}</div></div>` : '';
      const accordionScript = `<script>(function(){document.addEventListener('DOMContentLoaded',function(){document.querySelectorAll('.faq-container .faq-item').forEach(function(it){var q=it.querySelector('.faq-question');if(q){q.addEventListener('click',function(){it.classList.toggle('open');});}});});})();</script>`;
      const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>${page.title}</title><meta name="description" content="${page.metaDescription}"><meta property="og:title" content="${page.title}"><meta property="og:description" content="${page.metaDescription}"><link rel="stylesheet" href="/styles.css"><link rel="stylesheet" href="/templates.css"></head><body class="variant-${variant}"><header><div class="container"><a class="logo" href="/">Programmatic SEO Tool</a><nav><a href="/">Home</a><a href="/sitemap.xml">Sitemap</a><a href="/admin">Admin</a></nav></div></header><main><div class="container"><section class="page-hero"><h1>${page.h1}</h1><p>${page.metaDescription||''}</p><div style="margin-top:18px;display:flex;gap:12px;flex-wrap:wrap;"><a href="/" class="btn btn-secondary">Home</a><a href="/admin" class="btn btn-primary">Generate More</a></div></section>${tocBlock}${faqFirstBlock}${sectionMarkup}${relatedBlock}</div></main><footer><div class="container"><p>&copy; ${new Date().getFullYear()} Programmatic SEO Tool.</p><p><a href="/sitemap.xml">Sitemap</a> | <a href="/admin">Admin Panel</a></p></div></footer>${page.faqSchema && Object.keys(page.faqSchema).length ? `<script type="application/ld+json">${JSON.stringify(page.faqSchema)}</script>` : ''}${accordionScript}</body></html>`;
      return res.send(html);
    }

    // EJS rendered templates
    const ejs = require('ejs');
    const path = require('path');
    const viewPath = path.join(__dirname, '..', 'views', `${templateDef.view}.ejs`);
    const bodyHtml = await ejs.renderFile(viewPath, { ...page.toObject(), relatedPages }, { async: true });
    const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>${page.title}</title><meta name="description" content="${page.metaDescription}"><meta property="og:title" content="${page.title}"><meta property="og:description" content="${page.metaDescription}"><link rel="stylesheet" href="/styles.css"><link rel="stylesheet" href="/templates.css"></head><body class="variant-${templateDef.variant}"><header><div class="container"><a class="logo" href="/">Programmatic SEO Tool</a><nav><a href="/">Home</a><a href="/sitemap.xml">Sitemap</a><a href="/admin">Admin</a></nav></div></header><main><div class="container">${bodyHtml}</div></main><footer><div class="container"><p>&copy; ${new Date().getFullYear()} Programmatic SEO Tool.</p><p><a href="/sitemap.xml">Sitemap</a> | <a href="/admin">Admin Panel</a></p></div></footer>${page.faqSchema && Object.keys(page.faqSchema).length ? `<script type="application/ld+json">${JSON.stringify(page.faqSchema)}</script>` : ''}</body></html>`;
    res.send(html);
  } catch (e) {
    console.error('Page rendering error:', e);
    res.status(500).send('<!DOCTYPE html><html><head><title>Server Error</title></head><body style="font-family:Arial, sans-serif;margin:40px;text-align:center;"><h1>Server Error</h1><p>There was an error loading this page.</p><p><a href="/">← Back to Home</a></p></body></html>');
  }
});

module.exports = router;