const slugify = require('slugify');

/**
 * Replace placeholders in a string with variables
 * @param {string} str - String with {variable} placeholders
 * @param {object} vars - Object with variable values
 * @returns {string} - String with placeholders replaced
 */
function fill(str, vars) {
  if (!str || typeof str !== 'string') return str;
  
  let result = str;
  Object.keys(vars).forEach(key => {
    const regex = new RegExp(`{${key}}`, 'g');
    result = result.replace(regex, vars[key] || '');
  });
  
  return result;
}

/**
 * Create a unique URL-friendly slug from a keyword
 * @param {string} keyword - Keyword to convert to slug
 * @param {Function} checkExists - Function to check if slug exists in DB
 * @returns {Promise<string>} - Unique URL-friendly slug
 */
async function makeUniqueSlug(keyword, checkExists) {
  if (!keyword) return '';
  
  const baseSlug = slugify(keyword, {
    lower: true,
    strict: true,
    remove: /[*+~.()'"!:@]/g
  });

  // If no check function provided, return base slug
  if (typeof checkExists !== 'function') {
    return baseSlug;
  }

  let finalSlug = baseSlug;
  let counter = 1;

  // Keep checking and incrementing until we find a unique slug
  while (await checkExists(finalSlug)) {
    finalSlug = `${baseSlug}-${counter}`;
    counter++;
  }

  return finalSlug;
}

/**
 * Build FAQ schema in JSON-LD format for SEO
 * @param {array} faqArray - Array of FAQ objects with q and a properties
 * @returns {object} - JSON-LD FAQ schema
 */
function buildFaqSchema(faqArray) {
  if (!Array.isArray(faqArray) || faqArray.length === 0) {
    return {};
  }

  const validFaqs = faqArray.filter(faq => faq.q && faq.a);
  
  if (validFaqs.length === 0) {
    return {};
  }

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": validFaqs.map(faq => ({
      "@type": "Question",
      "name": faq.q,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.a
      }
    }))
  };
}

/**
 * Validate template JSON against CSV headers
 * @param {object} template - Template object with variables array
 * @param {array} csvHeaders - Array of CSV column headers
 * @returns {object} - Validation result with isValid and missing variables
 */
function validateTemplate(template, csvHeaders) {
  if (!template || !template.variables || !Array.isArray(template.variables)) {
    return {
      isValid: false,
      missing: [],
      error: 'Template must have a variables array'
    };
  }

  if (!Array.isArray(csvHeaders)) {
    return {
      isValid: false,
      missing: [],
      error: 'CSV headers must be an array'
    };
  }

  const missing = template.variables.filter(variable => 
    !csvHeaders.includes(variable)
  );

  return {
    isValid: missing.length === 0,
    missing: missing,
    error: missing.length > 0 ? `Missing CSV columns: ${missing.join(', ')}` : null
  };
}

/**
 * Process template with variables and generate page content
 * @param {object} template - Template configuration
 * @param {object} vars - Variables from CSV row
 * @param {Function} checkSlugExists - Function to check slug uniqueness
 * @returns {Promise<object>} - Processed page content
 */
async function processTemplate(template, vars, checkSlugExists) {
  try {
    const processed = {
      title: fill(template.title || '', vars),
      metaDescription: fill(template.metaDescription || '', vars),
      h1: fill(template.h1 || '', vars),
      sections: [],
      faq: [],
      templateKey: template.templateKey || 'default'
    };

    // Process sections
    if (Array.isArray(template.sections)) {
      processed.sections = template.sections.map(section => fill(section, vars));
    }

    // Process FAQ
    if (Array.isArray(template.faq)) {
      processed.faq = template.faq.map(faqItem => ({
        q: fill(faqItem.q || '', vars),
        a: fill(faqItem.a || '', vars)
      }));
    }

    // Generate FAQ schema
    processed.faqSchema = buildFaqSchema(processed.faq);

    // Generate unique slug from a primary keyword
    const primaryKeyword = vars.keyword || vars[Object.keys(vars)[0]] || '';
    processed.slug = await makeUniqueSlug(primaryKeyword, checkSlugExists);

    return processed;
  } catch (error) {
    throw new Error(`Template processing error: ${error.message}`);
  }
}

module.exports = {
  fill,
  makeUniqueSlug,
  buildFaqSchema,
  validateTemplate,
  processTemplate
};