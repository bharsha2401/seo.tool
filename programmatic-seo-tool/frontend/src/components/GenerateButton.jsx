import React, { useState } from 'react';
import axios from 'axios';

function GenerateButton({ csvData, template, onSuccess }) {
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const handleGenerate = async () => {
    if (!csvData || !template) {
      setError('CSV data and template are required');
      return;
    }

    setGenerating(true);
    setProgress(0);
    setError(null);
    setResults(null);

    // Simulate progress for better UX
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 10;
      });
    }, 200);

    try {
      const requestData = {
        rows: csvData.preview, // For demo, use preview data
        template: template,
        templateKey: template.templateKey
      };

      const response = await axios.post('/api/generate', requestData);

      clearInterval(progressInterval);
      setProgress(100);

      if (response.data.success) {
        setResults(response.data.results);
        setTimeout(() => {
          if (onSuccess) onSuccess();
        }, 2000);
      } else {
        setError(response.data.error || 'Failed to generate pages');
      }

    } catch (error) {
      clearInterval(progressInterval);
      console.error('Generation error:', error);
      setError(error.response?.data?.error || 'Failed to generate pages');
    } finally {
      setTimeout(() => {
        setGenerating(false);
        setProgress(0);
      }, 2000);
    }
  };

  if (results) {
    return (
      <div style={{ marginTop: '20px' }}>
        <div className="alert alert-success">
          <h3>🎉 Generation Complete!</h3>
          <p>Successfully generated <strong>{results.success}</strong> pages!</p>
          
          {results.errors > 0 && (
            <p style={{ color: '#856404' }}>
              ⚠️ {results.errors} rows had errors and were skipped.
            </p>
          )}
          
          <div style={{ marginTop: '15px' }}>
            <button onClick={onSuccess} className="btn btn-primary">
              View Generated Pages →
            </button>
          </div>
        </div>

        {results.pages && results.pages.length > 0 && (
          <div className="card" style={{ marginTop: '20px' }}>
            <h3>Generated Pages Preview</h3>
            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
              {results.pages.slice(0, 10).map((page, index) => (
                <div key={index} style={{
                  padding: '8px',
                  borderBottom: '1px solid #eee',
                  display: 'flex',
                  justifyContent: 'space-between'
                }}>
                  <span>{page.title}</span>
                  <a 
                    href={`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080'}/${page.slug}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{color: '#007bff', fontSize: '0.9rem'}}
                  >
                    View Page
                  </a>
                </div>
              ))}
            </div>
            {results.pages.length > 10 && (
              <p style={{color: '#6c757d', fontSize: '0.9rem', marginTop: '10px'}}>
                ...and {results.pages.length - 10} more pages
              </p>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ marginTop: '20px' }}>
      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      <div className="card" style={{ background: '#f8f9fa', border: '2px solid #007bff' }}>
        <h3>Ready to Generate Pages</h3>
        <p>This will create <strong>{csvData?.preview?.length || 0}</strong> SEO pages using your template.</p>
        
        <div style={{ margin: '15px 0' }}>
          <strong>Template:</strong> {template?.templateKey}
        </div>
        
        {generating ? (
          <div>
            <div className="progress">
              <div 
                className="progress-bar" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p style={{ textAlign: 'center', marginTop: '10px' }}>
              Generating pages... {Math.round(progress)}%
            </p>
          </div>
        ) : (
          <button 
            onClick={handleGenerate}
            className="btn btn-success"
            style={{ fontSize: '16px', padding: '12px 24px' }}
          >
            🚀 Generate {csvData?.preview?.length || 0} Pages
          </button>
        )}
      </div>

      <div className="alert alert-warning" style={{ marginTop: '15px' }}>
        <strong>Note:</strong> This demo uses the first {csvData?.preview?.length || 0} rows from your CSV. 
        In production, you would process all {csvData?.totalRows || 0} rows.
      </div>
    </div>
  );
}

export default GenerateButton;