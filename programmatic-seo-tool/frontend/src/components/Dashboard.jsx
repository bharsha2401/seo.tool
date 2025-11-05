import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/stats');
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      setError('Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-error">
        {error}
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="card">
        <h2>Dashboard Overview</h2>
        <p>Welcome to the Programmatic SEO Tool admin panel. Generate SEO-optimized landing pages at scale.</p>
      </div>

      {stats && (
        <>
          <div className="stats">
            <div className="stat-card">
              <div className="stat-number">{stats.totalPages}</div>
              <div className="stat-label">Total Pages</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{stats.pagesByTemplate?.length || 0}</div>
              <div className="stat-label">Templates Used</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{stats.recentPages?.length || 0}</div>
              <div className="stat-label">Recent Pages</div>
            </div>
          </div>

          {stats.pagesByTemplate && stats.pagesByTemplate.length > 0 && (
            <div className="card">
              <h2>Pages by Template</h2>
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Template Key</th>
                      <th>Pages Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.pagesByTemplate.map(item => (
                      <tr key={item._id}>
                        <td>{item._id}</td>
                        <td>{item.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {stats.recentPages && stats.recentPages.length > 0 && (
            <div className="card">
              <h2>Recent Pages</h2>
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
                    {stats.recentPages.map(page => (
                      <tr key={page._id}>
                        <td>{page.title}</td>
                        <td>
                          <a 
                            href={`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080'}/${page.slug}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            style={{color: '#007bff', textDecoration: 'none'}}
                          >
                            {page.slug}
                          </a>
                        </td>
                        <td>{page.templateKey}</td>
                        <td>{new Date(page.createdAt).toLocaleDateString()}</td>
                        <td>
                          <a 
                            href={`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080'}/${page.slug}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="btn btn-secondary"
                            style={{fontSize: '12px', padding: '4px 8px'}}
                          >
                            View
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      <div className="card">
        <h2>Quick Actions</h2>
        <div className="grid grid-2">
          <div>
            <h3>Get Started</h3>
            <p>New to the tool? Follow these steps:</p>
            <ol>
              <li>Upload your CSV data with keywords and variables</li>
              <li>Create or edit your template with placeholders</li>
              <li>Generate pages and view the results</li>
              <li>Check your sitemap and SEO pages</li>
            </ol>
          </div>
          <div>
            <h3>Resources</h3>
            <p>Helpful links and downloads:</p>
            <div style={{display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '15px'}}>
              <a href="/api/sample-csv" className="btn btn-secondary" download>
                Download Sample CSV
              </a>
              <a href="/sitemap.xml" target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
                View Sitemap
              </a>
              <a href="/" target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                View Homepage
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;