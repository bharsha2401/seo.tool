import React, { useState, useEffect } from 'react';
import axios from 'axios';

function PagesList() {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [templateKeys, setTemplateKeys] = useState([]);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    templateKey: ''
  });

  useEffect(() => {
    fetchPages();
  }, [filters]);

  // deployed pages state (moved up so it's available before we reference it)
  const [deployedPages, setDeployedPages] = useState([]);

  // map deployed pages by pageSlug for quick lookup (null-safe)
  const deployedMap = (deployedPages || []).reduce((acc, d) => {
    if (d && d.pageSlug) acc[d.pageSlug] = d;
    return acc;
  }, {});

  const fetchPages = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams(filters).toString();
      const response = await axios.get(`/api/pages?${queryParams}`);
      
      if (response.data.success) {
        setPages(response.data.data.pages);
        setPagination(response.data.data.pagination);
        setTemplateKeys(response.data.data.templateKeys);
        setError(null);
      }
    } catch (error) {
      console.error('Error fetching pages:', error);
      setError('Failed to load pages');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const handleTemplateFilter = (templateKey) => {
    setFilters(prev => ({ 
      ...prev, 
      templateKey: templateKey,
      page: 1 // Reset to first page when filtering
    }));
  };

  const handleDeletePage = async (slug) => {
    if (!window.confirm(`Are you sure you want to delete the page: ${slug}?`)) {
      return;
    }

    try {
      await axios.delete(`/api/pages/${slug}`);
      fetchPages(); // Refresh the list
    } catch (error) {
      console.error('Error deleting page:', error);
      alert('Failed to delete page');
    }
  };

  const fetchDeployed = async () => {
    try {
      const r = await axios.get('/api/deployed');
      if (r.data.success) setDeployedPages(r.data.data);
    } catch (e) {
      console.error('Failed to fetch deployed pages', e);
    }
  };

  useEffect(() => { fetchDeployed(); }, []);

  const handleDeploy = async (slug) => {
    if (!window.confirm(`Deploy page '${slug}' to static site?`)) return;
    try {
      const r = await axios.post(`/api/deploy/${slug}`);
      if (r.data.success) {
        alert('Deployed: ' + r.data.data.url);
        fetchDeployed();
        fetchPages();
      }
    } catch (e) {
      console.error('Deploy failed', e);
      alert('Deploy failed');
    }
  };

  const handleDeleteDeployed = async (id) => {
    if (!window.confirm('Delete deployed page?')) return;
    try {
      await axios.delete(`/api/deployed/${id}`);
      fetchDeployed();
    } catch (e) {
      console.error('Failed to delete deployed', e);
      alert('Failed to delete deployed page');
    }
  };

  const handleBulkDelete = async (templateKey) => {
    if (!window.confirm(`Are you sure you want to delete ALL pages with template: ${templateKey}?`)) {
      return;
    }

    try {
      await axios.delete(`/api/pages?templateKey=${templateKey}`);
      fetchPages(); // Refresh the list
    } catch (error) {
      console.error('Error bulk deleting pages:', error);
      alert('Failed to delete pages');
    }
  };

  const renderPagination = () => {
    if (!pagination || pagination.totalPages <= 1) return null;

    const pages = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, pagination.currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(pagination.totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage < maxPagesToShow - 1) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`btn ${pagination.currentPage === i ? 'active' : ''}`}
        >
          {i}
        </button>
      );
    }

    return (
      <div className="pagination">
        <button 
          onClick={() => handlePageChange(pagination.currentPage - 1)}
          disabled={!pagination.hasPrevPage}
          className="btn"
        >
          ← Previous
        </button>
        
        {pages}
        
        <button 
          onClick={() => handlePageChange(pagination.currentPage + 1)}
          disabled={!pagination.hasNextPage}
          className="btn"
        >
          Next →
        </button>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading pages...</p>
      </div>
    );
  }

  return (
    <div className="pages-list">
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2>Generated Pages</h2>
          <div>
            {pagination && (
              <span style={{ color: '#6c757d', fontSize: '0.9rem' }}>
                Showing {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1}-
                {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of {pagination.totalItems} pages
              </span>
            )}
          </div>
        </div>

        {/* Template Filter */}
        {templateKeys.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <label style={{ marginRight: '10px' }}>Filter by Template:</label>
            <select 
              value={filters.templateKey}
              onChange={(e) => handleTemplateFilter(e.target.value)}
              className="form-control"
              style={{ width: 'auto', display: 'inline-block' }}
            >
              <option value="">All Templates</option>
              {templateKeys.map(key => (
                <option key={key} value={key}>{key}</option>
              ))}
            </select>
            
            {filters.templateKey && (
              <button 
                onClick={() => handleBulkDelete(filters.templateKey)}
                className="btn btn-danger"
                style={{ marginLeft: '10px' }}
              >
                Delete All ({filters.templateKey})
              </button>
            )}
          </div>
        )}

        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        {pages.length === 0 ? (
          <div className="alert alert-warning">
            No pages found. Generate some pages first!
          </div>
        ) : (
          <>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Slug</th>
                    <th>Template</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pages.map(page => (
            <tr key={page._id}>
                      <td style={{ maxWidth: '300px' }}>
                        <div style={{ fontWeight: '500' }}>{page.title}</div>
                        <div style={{ 
                          fontSize: '0.8rem', 
                          color: '#6c757d',
                          marginTop: '2px'
                        }}>
                          {page.metaDescription}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <a
                            href={`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080'}/${page.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: '#007bff', textDecoration: 'none', fontFamily: 'monospace' }}
                          >
                            {page.slug}
                          </a>
                          {deployedMap[page.slug] && (
                            <a href={deployedMap[page.slug].url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.85rem', color: '#0b5cff' }}>
                              Deployed: {deployedMap[page.slug].url}
                            </a>
                          )}
                        </div>
                      </td>
                      <td>
                        <span style={{
                          background: '#e3f2fd',
                          color: '#1565c0',
                          padding: '2px 6px',
                          borderRadius: '3px',
                          fontSize: '0.8rem'
                        }}>
                          {page.templateKey}
                        </span>
                      </td>
                      <td>
                        <div>{new Date(page.createdAt).toLocaleDateString()}</div>
                        <div style={{ fontSize: '0.8rem', color: '#6c757d' }}>
                          {new Date(page.createdAt).toLocaleTimeString()}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '5px' }}>
                          <a
                            href={`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080'}/${page.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-secondary"
                            style={{ fontSize: '12px', padding: '4px 8px' }}
                          >
                            View
                          </a>
                          {!deployedMap[page.slug] ? (
                            <button
                              onClick={() => handleDeploy(page.slug)}
                              className="btn btn-info"
                              style={{ fontSize: '12px', padding: '4px 8px' }}
                            >
                              Deploy
                            </button>
                          ) : (
                            <>
                              <a href={deployedMap[page.slug].url} target="_blank" rel="noopener noreferrer" className="btn" style={{ fontSize: '12px', padding: '6px 8px', background:'#eef6ff', color:'#0b5cff' }}>
                                Open Deployed
                              </a>
                              <button onClick={() => handleDeleteDeployed(deployedMap[page.slug]._id)} className="btn btn-danger" style={{ fontSize: '12px', padding: '4px 8px' }}>
                                Remove
                              </button>
                            </>
                          )}
                          <button 
                            onClick={() => handleDeletePage(page.slug)}
                            className="btn btn-danger"
                            style={{ fontSize: '12px', padding: '4px 8px' }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {renderPagination()}
          </>
        )}
      </div>

      {pages.length > 0 && (
        <div className="card">
          <h2>Quick Actions</h2>
          <div className="grid grid-2">
            <div>
              <h3>Export & SEO</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <a href="/sitemap.xml" target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
                  View XML Sitemap
                </a>
                <a href="/robots.txt" target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
                  View Robots.txt
                </a>
              </div>
            </div>
            <div>
              <h3>Management</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button onClick={fetchPages} className="btn btn-secondary">
                  Refresh List
                </button>
                <a href="/" target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                  View Homepage
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

        {deployedPages && deployedPages.length > 0 && (
          <div className="card" style={{ marginTop: 20 }}>
            <h2>Deployed Pages</h2>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>URL</th>
                    <th>Deployed At</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {deployedPages.map(d => (
                    <tr key={d._id}>
                      <td>{d.title}</td>
                      <td>
                        <a href={d.url} target="_blank" rel="noopener noreferrer">{d.url}</a>
                      </td>
                      <td>{new Date(d.createdAt).toLocaleString()}</td>
                      <td>
                        <button onClick={() => handleDeleteDeployed(d._id)} className="btn btn-danger">Remove</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
    </div>
  );
}

export default PagesList;