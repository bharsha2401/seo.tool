import React, { useState } from 'react';
import Dashboard from './components/Dashboard';
import UploadCsv from './components/UploadCsv';
import TemplateEditor from './components/TemplateEditor';
import PagesList from './components/PagesList';
import './styles.css';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [csvData, setCsvData] = useState(null);
  const [template, setTemplate] = useState(null);

  const tabs = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'upload', label: 'Upload CSV' },
    { id: 'template', label: 'Template Editor' },
    { id: 'pages', label: 'Generated Pages' }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'upload':
        return (
          <UploadCsv 
            csvData={csvData} 
            setCsvData={setCsvData}
            onNext={() => setActiveTab('template')}
          />
        );
      case 'template':
        return (
          <TemplateEditor 
            csvData={csvData}
            template={template}
            setTemplate={setTemplate}
            onNext={() => setActiveTab('pages')}
          />
        );
      case 'pages':
        return <PagesList />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="app">
      <header className="header">
        <div className="container">
          <nav className="nav">
            <a href="/" className="nav-logo">
              Programmatic SEO Tool
            </a>
            <ul className="nav-links">
              <li>
                <a href={`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080'}/`} target="_blank" rel="noopener noreferrer">
                  View Site
                </a>
              </li>
              <li>
                <a href={`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080'}/sitemap.xml`} target="_blank" rel="noopener noreferrer">
                  Sitemap
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      <main className="main">
        <div className="container">
          <div className="tabs">
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {renderContent()}
        </div>
      </main>
    </div>
  );
}

export default App;