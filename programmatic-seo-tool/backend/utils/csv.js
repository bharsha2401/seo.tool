const Papa = require('papaparse');
const fs = require('fs');

/**
 * Parse CSV file to JSON array
 * @param {string} filePath - Path to CSV file
 * @returns {Promise} - Promise resolving to parsed data
 */
function parseCsvToJson(filePath) {
  return new Promise((resolve, reject) => {
    try {
      // Read file content
      const fileContent = fs.readFileSync(filePath, 'utf8');
      
      // Parse CSV
      Papa.parse(fileContent, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => {
          // Clean and normalize header names
          return header.trim().toLowerCase();
        },
        transform: (value, field) => {
          // Clean and trim all values
          return typeof value === 'string' ? value.trim() : value;
        },
        complete: (results) => {
          if (results.errors && results.errors.length > 0) {
            console.warn('CSV parsing warnings:', results.errors);
          }
          
          // Filter out empty rows
          const cleanData = results.data.filter(row => {
            return Object.values(row).some(value => value && value.toString().trim() !== '');
          });
          
          resolve({
            data: cleanData,
            headers: results.meta.fields || [],
            totalRows: cleanData.length
          });
        },
        error: (error) => {
          reject(new Error(`CSV parsing error: ${error.message}`));
        }
      });
    } catch (error) {
      reject(new Error(`File reading error: ${error.message}`));
    }
  });
}

/**
 * Validate CSV structure and content
 * @param {array} data - Parsed CSV data
 * @param {array} headers - CSV headers
 * @returns {object} - Validation result
 */
function validateCsv(data, headers) {
  const validation = {
    isValid: true,
    errors: [],
    warnings: []
  };

  // Check if we have data
  if (!data || data.length === 0) {
    validation.isValid = false;
    validation.errors.push('CSV file is empty or contains no valid data');
    return validation;
  }

  // Check if we have headers
  if (!headers || headers.length === 0) {
    validation.isValid = false;
    validation.errors.push('CSV file must have headers');
    return validation;
  }

  // Check for common required fields
  const commonFields = ['keyword'];
  const missingCommonFields = commonFields.filter(field => 
    !headers.includes(field.toLowerCase())
  );
  
  if (missingCommonFields.length > 0) {
    validation.warnings.push(`Consider adding these common fields: ${missingCommonFields.join(', ')}`);
  }

  // Check for empty columns
  const emptyColumns = headers.filter(header => {
    return data.every(row => !row[header] || row[header].toString().trim() === '');
  });

  if (emptyColumns.length > 0) {
    validation.warnings.push(`Empty columns detected: ${emptyColumns.join(', ')}`);
  }

  // Check data consistency
  const inconsistentRows = data.filter((row, index) => {
    const filledFields = Object.values(row).filter(value => 
      value && value.toString().trim() !== ''
    ).length;
    return filledFields < headers.length * 0.5; // Less than 50% fields filled
  });

  if (inconsistentRows.length > 0) {
    validation.warnings.push(`${inconsistentRows.length} rows have less than 50% of fields filled`);
  }

  return validation;
}

/**
 * Get preview of CSV data (first N rows)
 * @param {array} data - Full CSV data
 * @param {number} limit - Number of rows to return (default: 10)
 * @returns {array} - Limited data array
 */
function getPreview(data, limit = 10) {
  if (!Array.isArray(data)) return [];
  return data.slice(0, limit);
}

/**
 * Clean CSV file after processing
 * @param {string} filePath - Path to temporary CSV file
 */
function cleanupCsvFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`Cleaned up temporary file: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error cleaning up file ${filePath}:`, error.message);
  }
}

/**
 * Generate sample CSV content for download
 * @returns {string} - Sample CSV content
 */
function generateSampleCsv() {
  const sampleData = [
    ['keyword', 'city', 'brand', 'service', 'count'],
    ['seo services', 'Hyderabad', 'Acme Digital', 'Local SEO', '120'],
    ['seo services', 'Bangalore', 'Acme Digital', 'Local SEO', '120'],
    ['digital marketing', 'Mumbai', 'Acme Digital', 'PPC Management', '85'],
    ['web design', 'Delhi', 'Acme Digital', 'Website Development', '200']
  ];

  return Papa.unparse(sampleData);
}

module.exports = {
  parseCsvToJson,
  validateCsv,
  getPreview,
  cleanupCsvFile,
  generateSampleCsv
};