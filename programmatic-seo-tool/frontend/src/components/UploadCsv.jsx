import React, { useState, useRef } from 'react';
import axios from 'axios';

function UploadCsv({ csvData, setCsvData, onNext }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileUpload = async (file) => {
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      setError('Please select a CSV file');
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('csvFile', file);

    try {
      const response = await axios.post('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        setCsvData(response.data.data);
        setError(null);
      } else {
        setError(response.data.error || 'Failed to upload CSV');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setError(error.response?.data?.error || 'Failed to upload CSV file');
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleClearData = () => {
    setCsvData(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="upload-csv">
      <div className="card">
        <h2>Upload CSV Data</h2>
        <p>Upload a CSV file containing your data. The first row should contain column headers.</p>

        {!csvData && (
          <>
            <div
              className={`file-upload ${dragOver ? 'dragover' : ''}`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept=".csv"
                style={{ display: 'none' }}
              />
              
              {loading ? (
                <div className="loading">
                  <div className="spinner"></div>
                  <p>Processing CSV file...</p>
                </div>
              ) : (
                <div>
                  <p style={{ fontSize: '1.2rem', marginBottom: '10px' }}>
                    📁 Drop your CSV file here or click to browse
                  </p>
                  <p style={{ color: '#6c757d', fontSize: '0.9rem' }}>
                    Maximum file size: 5MB
                  </p>
                </div>
              )}
            </div>

            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              <a href="/api/sample-csv" className="btn btn-secondary" download>
                Download Sample CSV
              </a>
            </div>
          </>
        )}

        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        {csvData && (
          <div style={{ marginTop: '20px' }}>
            <div className="alert alert-success">
              ✅ CSV uploaded successfully! Found {csvData.totalRows} rows with {csvData.headers.length} columns.
            </div>

            {csvData.validation && csvData.validation.warnings && csvData.validation.warnings.length > 0 && (
              <div className="alert alert-warning">
                <strong>Warnings:</strong>
                <ul style={{ marginTop: '5px', paddingLeft: '20px' }}>
                  {csvData.validation.warnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}

            <div style={{ marginBottom: '20px' }}>
              <h3>CSV Headers</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' }}>
                {csvData.headers.map(header => (
                  <span 
                    key={header}
                    style={{
                      background: '#e3f2fd',
                      color: '#1565c0',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '0.9rem'
                    }}
                  >
                    {header}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h3>Data Preview (First {csvData.preview.length} rows)</h3>
              <div style={{ overflowX: 'auto' }}>
                <table className="table">
                  <thead>
                    <tr>
                      {csvData.headers.map(header => (
                        <th key={header}>{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {csvData.preview.map((row, index) => (
                      <tr key={index}>
                        {csvData.headers.map(header => (
                          <td key={header}>{row[header] || ''}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button onClick={handleClearData} className="btn btn-secondary">
                Upload Different File
              </button>
              <button onClick={onNext} className="btn btn-primary">
                Next: Create Template →
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <h2>CSV Format Requirements</h2>
        <div className="grid grid-2">
          <div>
            <h3>Required Format</h3>
            <ul>
              <li>First row must contain column headers</li>
              <li>Headers should be lowercase and descriptive</li>
              <li>Common fields: keyword, city, brand, service, count</li>
              <li>No empty rows between data</li>
            </ul>
          </div>
          <div>
            <h3>Example CSV Structure</h3>
            <pre style={{
              background: '#f8f9fa',
              padding: '10px',
              borderRadius: '4px',
              fontSize: '0.8rem',
              overflow: 'auto'
            }}>
{`keyword,city,brand,service,count
seo services,Hyderabad,Acme Digital,Local SEO,120
web design,Mumbai,Acme Digital,Website Dev,85`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UploadCsv;