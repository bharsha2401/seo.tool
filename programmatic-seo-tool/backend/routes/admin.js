const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const Page = require('../models/Page');
const { parseCsvToJson, validateCsv, getPreview, cleanupCsvFile, generateSampleCsv } = require('../utils/csv');
const { validateTemplate, processTemplate, makeUniqueSlug } = require('../utils/templating');

const router = express.Router();
const slugify = require('slugify');
const DeployedPage = require('../models/DeployedPage');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Use timestamp to avoid filename conflicts
    const timestamp = Date.now();
    cb(null, `${timestamp}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    if (file.mimetype === 'text/csv' || path.extname(file.originalname).toLowerCase() === '.csv') {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  }
});

// POST /api/upload - Upload and parse CSV file
router.post('/upload', upload.single('csvFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: 'No CSV file uploaded' 
      });
    }

    console.log('Processing uploaded file:', req.file.filename);
    
    // Parse CSV file
    const csvResult = await parseCsvToJson(req.file.path);
    
    // Validate CSV structure
    const validation = validateCsv(csvResult.data, csvResult.headers);
    
    // Get preview (first 10 rows)
    const preview = getPreview(csvResult.data, 10);
    
    // Clean up the uploaded file
    cleanupCsvFile(req.file.path);
    
    res.json({
      success: true,
      data: {
        headers: csvResult.headers,
        preview: preview,
        totalRows: csvResult.totalRows,
        validation: validation,
        fileName: req.file.originalname
      }
    });

  } catch (error) {
    console.error('CSV upload error:', error);
    
    // Clean up file if it exists
    if (req.file) {
      cleanupCsvFile(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to process CSV file'
    });
  }
});

// POST /api/generate - Generate pages from CSV data and template
router.post('/generate', async (req, res) => {
  try {
    const { rows, template, templateKey } = req.body;

    // Validate request
    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No data rows provided'
      });
    }

    if (!template || typeof template !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'No template provided'
      });
    }

    // Extract headers from first row
    const headers = Object.keys(rows[0]);
    
    // Validate template against CSV headers
    const templateValidation = validateTemplate(template, headers);
    if (!templateValidation.isValid) {
      return res.status(400).json({
        success: false,
        error: templateValidation.error,
        missing: templateValidation.missing
      });
    }

    console.log(`Generating ${rows.length} pages with template: ${templateKey || 'default'}`);
    
    const results = {
      success: 0,
      skipped: 0,
      errors: 0,
      pages: []
    };

    // Process each row
    for (let i = 0; i < rows.length; i++) {
      try {
        const rowData = rows[i];
        
        // Create function to check if slug exists in database
        const checkSlugExists = async (slug) => {
          const existingPage = await Page.findOne({ slug });
          return !!existingPage;
        };
        
        // Process template with row data (async)
        const processedData = await processTemplate(template, rowData, checkSlugExists);
        
        // finalSlug is now handled by processTemplate's makeUniqueSlug
        const finalSlug = processedData.slug;
        
        // Create page document
        const pageData = {
          slug: finalSlug,
          title: processedData.title,
          metaDescription: processedData.metaDescription,
          h1: processedData.h1,
          sections: processedData.sections,
          faq: processedData.faq,
          faqSchema: processedData.faqSchema,
          vars: rowData,
          templateKey: processedData.templateKey
        };

        // Save to database
        const page = new Page(pageData);
        await page.save();
        
        results.success++;
        results.pages.push({
          slug: finalSlug,
          title: processedData.title
        });

        console.log(`Created page: ${finalSlug}`);

      } catch (error) {
        console.error(`Error processing row ${i + 1}:`, error);
        results.errors++;
      }
    }

    res.json({
      success: true,
      message: `Generated ${results.success} pages successfully`,
      results: results
    });

  } catch (error) {
    console.error('Page generation error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate pages'
    });
  }
});

// GET /api/pages - List all pages (with pagination)
router.get('/pages', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const templateKey = req.query.templateKey;
    
    const skip = (page - 1) * limit;
    
    // Build query
    let query = {};
    if (templateKey) {
      query.templateKey = templateKey;
    }
    
    // Get total count
    const totalPages = await Page.countDocuments(query);
    
    // Get pages
    const pages = await Page.find(query)
      .select('slug title metaDescription templateKey createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get unique template keys for filtering
    const templateKeys = await Page.distinct('templateKey');
    
    res.json({
      success: true,
      data: {
        pages: pages,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalPages / limit),
          totalItems: totalPages,
          itemsPerPage: limit,
          hasNextPage: skip + limit < totalPages,
          hasPrevPage: page > 1
        },
        templateKeys: templateKeys
      }
    });

  } catch (error) {
    console.error('Pages list error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch pages'
    });
  }
});

// POST /api/deploy/:slug - Render page and write static HTML to public/deployed/<deploySlug>/index.html
router.post('/deploy/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const deployName = req.body.deployName; // optional override
    const page = await Page.findOne({ slug });
    if (!page) return res.status(404).json({ success: false, error: 'Page not found' });

    // Determine deploy slug based on provided deployName, page.vars.keyword or page.slug
    let base = (deployName && String(deployName).trim()) || (page.vars && (page.vars.keyword || page.vars.keyword1)) || page.title || page.slug;
    base = String(base || page.slug);
    const deploySlug = slugify(base, { lower: true, strict: true });

    // prevent collision by appending number
    let finalDeploySlug = deploySlug;
    let counter = 1;
    while (await DeployedPage.findOne({ deploySlug: finalDeploySlug })) {
      finalDeploySlug = `${deploySlug}-${counter}`;
      counter++;
    }

    // Render the page using existing EJS templates (reuse pages route rendering)
    const ejs = require('ejs');
    const viewName = page.templateKey || 'page_template_minimal';
    // Map templateKey to view filename if necessary (reuse existing mapping)
    const TEMPLATE_VIEW_MAP = {
      'minimal': 'page_template_minimal',
      'local-seo': 'page_template_minimal',
      'service-landing': 'page_template_modern_blue',
      'modern-blue': 'page_template_modern_blue',
      'dark-pastel': 'page_template_dark_pastel'
    };
    const viewFile = TEMPLATE_VIEW_MAP[page.templateKey] || TEMPLATE_VIEW_MAP['minimal'] || 'page_template_minimal';
    const viewPath = path.join(__dirname, '..', 'views', `${viewFile}.ejs`);
    const relatedPages = await Page.find({ templateKey: page.templateKey, slug: { $ne: page.slug } }).select('slug title').limit(6);
    const bodyHtml = await ejs.renderFile(viewPath, { ...page.toObject(), relatedPages }, { async: true });

    // Build full HTML with head (canonical to deployed path)
    const siteUrl = (process.env.SITE_URL || 'http://localhost:8080').replace(/\/$/, '');
    const deployedUrl = `${siteUrl}/deployed/${finalDeploySlug}`;
    const fullHtml = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${page.title}</title><meta name="description" content="${page.metaDescription||''}"><link rel="canonical" href="${deployedUrl}"><link rel="stylesheet" href="/styles.css"><link rel="stylesheet" href="/templates.css"></head><body>${bodyHtml}</body></html>`;

    // Write to public/deployed/<finalDeploySlug>/index.html
    const outDir = path.join(__dirname, '..', 'public', 'deployed', finalDeploySlug);
    fs.mkdirSync(outDir, { recursive: true });
    const outFile = path.join(outDir, 'index.html');
    fs.writeFileSync(outFile, fullHtml, 'utf8');

    // Default deployed record info (local)
    let deployedRecord = {
      pageSlug: page.slug,
      deploySlug: finalDeploySlug,
      title: page.title,
      url: deployedUrl,
      provider: 'local-static'
    };

    // If GitHub publishing is configured, push the file to the configured repo & branch
    if (process.env.GITHUB_TOKEN && process.env.GITHUB_REPO) {
      try {
        const githubToken = process.env.GITHUB_TOKEN;
        const repo = process.env.GITHUB_REPO; // expected 'owner/repo'
        const apiBase = 'https://api.github.com';

        // Get repo info to determine default branch
        const repoInfo = await axios.get(`${apiBase}/repos/${repo}`, {
          headers: { Authorization: `token ${githubToken}`, 'User-Agent': 'programmatic-seo-tool' }
        });
        const defaultBranch = repoInfo.data.default_branch;
        const branch = process.env.GITHUB_BRANCH || defaultBranch;

        // Path in repo where we'll store deployed pages
        const repoPath = `deployed/${finalDeploySlug}/index.html`;

        // Check if file exists to obtain sha
        let existingSha = null;
        try {
          const getRes = await axios.get(`${apiBase}/repos/${repo}/contents/${encodeURIComponent(repoPath)}?ref=${branch}`, {
            headers: { Authorization: `token ${githubToken}`, 'User-Agent': 'programmatic-seo-tool' }
          });
          existingSha = getRes.data.sha;
        } catch (err) {
          // not found is okay; we'll create it
        }

        // Commit the file (create or update)
        const commitMessage = `Deploy page: ${finalDeploySlug}`;
        const putBody = {
          message: commitMessage,
          content: Buffer.from(fullHtml, 'utf8').toString('base64'),
          branch: branch
        };
        if (existingSha) putBody.sha = existingSha;

        const putRes = await axios.put(`${apiBase}/repos/${repo}/contents/${encodeURIComponent(repoPath)}`, putBody, {
          headers: { Authorization: `token ${githubToken}`, 'User-Agent': 'programmatic-seo-tool' }
        });

        // Construct a public URL for the deployed page.
        // If the user provided a publish base URL (e.g., Netlify/Vercel site URL), prefer that.
        if (process.env.GITHUB_PUBLISH_BASE_URL) {
          deployedRecord.url = `${process.env.GITHUB_PUBLISH_BASE_URL.replace(/\/$/, '')}/deployed/${finalDeploySlug}/`;
        } else {
          // Fallback to raw GitHub URL (works but not pretty). Recommend connecting the repo to Netlify/Vercel.
          deployedRecord.url = `https://raw.githubusercontent.com/${repo}/${branch}/deployed/${finalDeploySlug}/index.html`;
        }
        deployedRecord.provider = 'github';

      } catch (gitErr) {
        console.error('GitHub publish error:', gitErr.response && gitErr.response.data ? gitErr.response.data : gitErr.message || gitErr);
        // keep local deployedRecord if GitHub publishing fails
      }
    }

    // Save deployed record to DB
    const deployed = new DeployedPage(deployedRecord);
    await deployed.save();

    res.json({ success: true, message: 'Deployed successfully', data: { url: deployedRecord.url, deploySlug: finalDeploySlug } });
  } catch (error) {
    console.error('Deploy error:', error);
    res.status(500).json({ success: false, error: error.message || 'Deploy failed' });
  }
});

// GET /api/deployed - list deployed pages
router.get('/deployed', async (req, res) => {
  try {
    const items = await DeployedPage.find().sort({ createdAt: -1 }).limit(200);
    res.json({ success: true, data: items });
  } catch (e) {
    console.error('List deployed error:', e);
    res.status(500).json({ success: false, error: e.message });
  }
});

// DELETE /api/deployed/:id - remove deployed page and files
router.delete('/deployed/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const rec = await DeployedPage.findById(id);
    if (!rec) return res.status(404).json({ success: false, error: 'Deployed page not found' });
    const outDir = path.join(__dirname, '..', 'public', 'deployed', rec.deploySlug);
    // remove directory recursively
    fs.rmSync(outDir, { recursive: true, force: true });
    await DeployedPage.deleteOne({ _id: id });
    res.json({ success: true, message: 'Deleted deployed page' });
  } catch (e) {
    console.error('Delete deployed error:', e);
    res.status(500).json({ success: false, error: e.message });
  }
});

// GET /api/pages/:slug - Get specific page details
router.get('/pages/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    
    const page = await Page.findOne({ slug: slug });
    
    if (!page) {
      return res.status(404).json({
        success: false,
        error: 'Page not found'
      });
    }

    res.json({
      success: true,
      data: page
    });

  } catch (error) {
    console.error('Page fetch error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch page'
    });
  }
});

// DELETE /api/pages/:slug - Delete specific page
router.delete('/pages/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    
    const result = await Page.deleteOne({ slug: slug });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'Page not found'
      });
    }

    res.json({
      success: true,
      message: 'Page deleted successfully'
    });

  } catch (error) {
    console.error('Page delete error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete page'
    });
  }
});

// DELETE /api/pages - Bulk delete pages by template key
router.delete('/pages', async (req, res) => {
  try {
    const { templateKey } = req.query;
    
    if (!templateKey) {
      return res.status(400).json({
        success: false,
        error: 'Template key is required for bulk deletion'
      });
    }
    
    const result = await Page.deleteMany({ templateKey: templateKey });
    
    res.json({
      success: true,
      message: `Deleted ${result.deletedCount} pages with template key: ${templateKey}`,
      deletedCount: result.deletedCount
    });

  } catch (error) {
    console.error('Bulk delete error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete pages'
    });
  }
});

// GET /api/sample-csv - Download sample CSV
router.get('/sample-csv', (req, res) => {
  try {
    const csvContent = generateSampleCsv();
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="sample-seo-data.csv"');
    res.send(csvContent);
    
  } catch (error) {
    console.error('Sample CSV error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate sample CSV'
    });
  }
});

// GET /api/stats - Get dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    const totalPages = await Page.countDocuments();
    
    // Get pages by template key
    const pagesByTemplate = await Page.aggregate([
      { $group: { _id: '$templateKey', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    // Get recent pages
    const recentPages = await Page.find()
      .select('slug title templateKey createdAt')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      data: {
        totalPages: totalPages,
        pagesByTemplate: pagesByTemplate,
        recentPages: recentPages
      }
    });

  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch statistics'
    });
  }
});

module.exports = router;