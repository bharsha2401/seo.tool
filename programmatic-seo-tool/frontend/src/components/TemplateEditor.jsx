import React, { useState, useEffect } from 'react';
import axios from 'axios';
import GenerateButton from './GenerateButton';

const presetTemplates = [
  {
    label: 'Local SEO (Default)',
    description: 'City + Keyword focused local landing page with FAQ.',
    data: {
      templateKey: 'local-seo',
      title: '{keyword} in {city} | {brand}',
      metaDescription: 'Boost growth with {keyword} in {city}. {brand} offers {service} trusted by {count}+ clients.',
      h1: '{keyword} in {city}',
      sections: [
        'Overview: {keyword} helps {city} businesses win local search.',
        'Our Services: {brand} provides {service} packages tailored to {city}.',
        "Proof: We've helped {count}+ brands in {city} succeed."
      ],
      faq: [
        { q: 'What is {keyword}?', a: '{keyword} is a set of tactics to improve visibility in {city}.' },
        { q: 'Why choose {brand} for {keyword}?', a: 'We specialize in {service} with proven results.' }
      ],
      variables: ['keyword','city','brand','service','count']
    }
  },
  {
    label: 'Service Landing',
    description: 'Service offering template with benefits + proof section.',
    data: {
      templateKey: 'service-landing',
      title: 'Professional {service} in {city} | {brand}',
      metaDescription: 'Need {service} in {city}? {brand} delivers reliable {service} trusted by {count}+ customers.',
      h1: '{service} in {city}',
      sections: [
        'Introduction: {brand} provides expert {service} for {city} clients.',
        'Why Us: Trusted by {count}+ businesses seeking {service}.',
        'Benefits: {service} improves performance and saves time.'
      ],
      faq: [
        { q: 'Who is {brand}?', a: '{brand} is a trusted provider of {service} solutions.' },
        { q: 'How does {service} help?', a: '{service} helps streamline operations in {city}.' }
      ],
      variables: ['service','city','brand','count']
    }
  },
  {
    label: 'FAQ Rich Page',
    description: 'Long-form FAQ heavy informational page.',
    data: {
      templateKey: 'faq-rich',
      title: 'Everything About {keyword} in {city} | {brand}',
      metaDescription: 'Learn all about {keyword} in {city}. {brand} answers top {keyword} questions for you.',
      h1: 'About {keyword} in {city}',
      sections: [
        'Introduction: {keyword} matters for {city} businesses and individuals.',
        'Core Concepts: Key ideas behind {keyword}.',
        'Use Cases: How {keyword} drives value in {city}.'
      ],
      faq: [
        { q: 'How does {keyword} work?', a: '{keyword} operates through structured steps to deliver results.' },
        { q: 'Where to apply {keyword}?', a: 'In {city}, {keyword} helps optimize performance locally.' },
        { q: 'Why is {brand} helpful?', a: '{brand} guides adoption and scaling.' }
      ],
      variables: ['keyword','city','brand']
    }
  }
];

const defaultTemplate = presetTemplates[0].data;

function TemplateEditor({ csvData, template, setTemplate, onNext }) {
  const [templateText, setTemplateText] = useState('');
  const [error, setError] = useState(null);
  const [validationError, setValidationError] = useState(null);
  const [isValid, setIsValid] = useState(false);
  const [showEditor, setShowEditor] = useState(true);
  const [selectedKey, setSelectedKey] = useState(template?.templateKey || defaultTemplate.templateKey);
  const [missingVars, setMissingVars] = useState([]); // variables not found in CSV
  const [varMappings, setVarMappings] = useState({}); // mapping from missingVar -> selected CSV header
  const [showMapping, setShowMapping] = useState(false);

  useEffect(() => {
    if (template) {
      setTemplateText(JSON.stringify(template, null, 2));
    } else {
      setTemplateText(JSON.stringify(defaultTemplate, null, 2));
    }
  }, [template]);

  useEffect(() => {
    validateTemplate();
  }, [templateText, csvData]);

  const validateTemplate = () => {
    try {
      const parsedTemplate = JSON.parse(templateText);
      const requiredFields = ['templateKey', 'title', 'metaDescription', 'h1', 'variables'];
      const missingFields = requiredFields.filter(field => !parsedTemplate[field]);
      if (missingFields.length > 0) {
        setValidationError(`Missing required fields: ${missingFields.join(', ')}`);
        setIsValid(false);
        return;
      }
      if (!Array.isArray(parsedTemplate.variables)) {
        setValidationError('Variables field must be an array');
        setIsValid(false);
        return;
      }
      if (csvData && csvData.headers) {
        const mv = parsedTemplate.variables.filter(v => !csvData.headers.includes(v));
        setMissingVars(mv);
        if (mv.length > 0) {
          setValidationError(`Variables not found in CSV: ${mv.join(', ')}`);
          setIsValid(false);
          return;
        }
      } else {
        setMissingVars([]);
      }
      setValidationError(null);
      setIsValid(true);
      setTemplate(parsedTemplate);
    } catch (err) {
      setValidationError('Invalid JSON format: ' + err.message);
      setIsValid(false);
      setMissingVars([]);
    }
  };

  const handleTemplateChange = (e) => {
    setTemplateText(e.target.value);
  };

  const resetTemplate = () => {
    setTemplateText(JSON.stringify(defaultTemplate, null, 2));
  };

  const loadSampleTemplate = () => {
    if (csvData && csvData.headers) {
      const sampleTemplate = {
        ...defaultTemplate,
        variables: csvData.headers
      };
      setTemplateText(JSON.stringify(sampleTemplate, null, 2));
    }
  };

  const applyPreset = (tpl) => {
    setSelectedKey(tpl.data.templateKey);
    setTemplateText(JSON.stringify(tpl.data, null, 2));
    setVarMappings({});
  };

  const handleMappingChange = (missingVar, newHeader) => {
    setVarMappings(prev => ({ ...prev, [missingVar]: newHeader }));
  };

  const applyMappings = () => {
    try {
      const parsed = JSON.parse(templateText);
      // Build replacement map only for mapped entries
      Object.entries(varMappings).forEach(([missingVar, header]) => {
        if (!header) return;
        // Replace occurrences of {missingVar} with {header} in all string fields
        const replacer = (val) => {
          if (typeof val === 'string') {
            return val.replace(new RegExp(`{${missingVar}}`, 'g'), `{${header}}`);
          } else if (Array.isArray(val)) {
            return val.map(replacer);
          } else if (val && typeof val === 'object') {
            const copy = {}; Object.entries(val).forEach(([k,v])=>copy[k]=replacer(v)); return copy;
          }
          return val;
        };
        // Apply to top-level known fields
        ['title','metaDescription','h1'].forEach(f => { if (parsed[f]) parsed[f] = replacer(parsed[f]); });
        if (parsed.sections) parsed.sections = replacer(parsed.sections);
        if (parsed.faq) parsed.faq = replacer(parsed.faq);
        // Update variables array: replace missingVar with header if header exists in CSV
        const idx = parsed.variables.indexOf(missingVar);
        if (idx !== -1) parsed.variables[idx] = header;
      });
      // Deduplicate variables
      parsed.variables = Array.from(new Set(parsed.variables));
      setTemplateText(JSON.stringify(parsed, null, 2));
      setShowMapping(false);
      setVarMappings({});
    } catch (e) {
      console.error('Mapping apply failed', e);
    }
  };

  const allMapped = missingVars.length > 0 && missingVars.every(mv => varMappings[mv]);

  return (
    <div className="template-editor">
      <div className="card">
        <h2>Select a Template</h2>
        <p>Pick one of the preset templates below. You can still customize the JSON afterward.</p>
        <div style={{display:'grid', gap:'15px', gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))', marginTop:'15px'}}>
          {presetTemplates.map(p => {
            const active = selectedKey === p.data.templateKey;
            return (
              <div key={p.data.templateKey} style={{
                border: active ? '2px solid var(--primary-color,#2563eb)' : '1px solid #ddd',
                borderRadius: '8px',
                padding: '12px',
                background: active ? 'linear-gradient(135deg, #2563eb11, #10b98111)' : '#fff',
                position: 'relative'
              }}>
                <h3 style={{marginTop:0, fontSize:'1rem'}}>{p.label}</h3>
                <p style={{fontSize:'.8rem', minHeight:'40px'}}>{p.description}</p>
                <div style={{display:'flex', gap:'8px', marginTop:'8px'}}>
                  <button
                    className={active ? 'btn btn-success' : 'btn btn-primary'}
                    style={{flex:1}}
                    onClick={() => applyPreset(p)}
                  >{active ? 'Selected' : 'Use Template'}</button>
                </div>
                <div style={{marginTop:'8px'}}>
                  <code style={{fontSize:'.65rem', color:'#555'}}>{p.data.variables.join(', ')}</code>
                </div>
                {active && <span style={{position:'absolute', top:8, right:10, fontSize:'.75rem', color:'#2563eb'}}>Active</span>}
              </div>
            )
          })}
        </div>
        <div style={{marginTop:'15px'}}>
          <button className="btn btn-secondary" onClick={() => setShowEditor(v=>!v)}>
            {showEditor ? 'Hide JSON Editor' : 'Show & Customize JSON'}
          </button>
        </div>
      </div>

      {showEditor && (
        <div className="card">
          <h2>Template Editor</h2>
          <p>Create or customize your page template. Use {'{variable}'} placeholders matching your CSV headers.</p>
          {!csvData && (
            <div className="alert alert-warning">⚠️ No CSV data loaded. Please upload a CSV first.</div>
          )}
          {csvData && (
            <div style={{ marginBottom: '20px' }}>
              <h3>Available Variables from CSV</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' }}>
                {csvData.headers.map(header => (
                  <span
                    key={header}
                    style={{
                      background: '#e8f5e8',
                      color: '#2d5a2d',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '0.9rem',
                      cursor: 'pointer'
                    }}
                    onClick={() => {
                      const el = document.getElementById('template-textarea');
                      if(!el) return;
                      const cursorPos = el.selectionStart || 0;
                      const newText = templateText.slice(0, cursorPos) + `{${header}}` + templateText.slice(cursorPos);
                      setTemplateText(newText);
                    }}
                    title="Click to insert variable"
                  >{'{' + header + '}'}</span>
                ))}
              </div>
            </div>
          )}
          <div className="form-group">
            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
              <button onClick={() => applyPreset(presetTemplates[0])} className="btn btn-secondary">Reset Default</button>
              {csvData && (
                <button onClick={() => {
                  if (csvData && csvData.headers) {
                    try {
                      const parsed = JSON.parse(templateText);
                      parsed.variables = csvData.headers;
                      setTemplateText(JSON.stringify(parsed, null, 2));
                    } catch {}
                  }
                }} className="btn btn-info">Use CSV Headers</button>
              )}
            </div>
            <label>Template JSON</label>
            <textarea
              id="template-textarea"
              className="form-control textarea"
              value={templateText}
              onChange={e=>setTemplateText(e.target.value)}
              placeholder="Enter your template JSON here..."
              style={{ minHeight: '400px', fontFamily: 'Monaco, Consolas, "Courier New", monospace', fontSize: '13px' }}
            />
          </div>
          {validationError && <div className="alert alert-error">❌ {validationError}</div>}
          {!isValid && missingVars.length > 0 && csvData?.headers && (
            <div className="card" style={{background:'#fff7ed', border:'1px solid #f97316', marginTop:'10px'}}>
              <h3 style={{marginTop:0}}>Map Missing Variables</h3>
              <p style={{fontSize:'.8rem'}}>Your template expects variables not found in the CSV. Map them below to existing CSV columns or adjust the template.</p>
              <div style={{display:'flex', flexDirection:'column', gap:'10px'}}>
                {missingVars.map(mv => (
                  <div key={mv} style={{display:'flex', alignItems:'center', gap:'10px'}}>
                    <code style={{background:'#fee2e2', padding:'4px 6px', borderRadius:'4px'}}>{`{${mv}}`}</code>
                    <span style={{fontSize:'.75rem'}}>→</span>
                    <select
                      className="form-control"
                      style={{maxWidth:'220px'}}
                      value={varMappings[mv] || ''}
                      onChange={e => handleMappingChange(mv, e.target.value)}
                    >
                      <option value="">Select CSV column</option>
                      {csvData.headers.filter(h => !missingVars.includes(h)).map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
              <div style={{marginTop:'12px', display:'flex', gap:'8px'}}>
                <button className="btn btn-primary" disabled={!allMapped} onClick={applyMappings}>Apply Mappings</button>
                <button className="btn btn-secondary" onClick={()=>setVarMappings({})}>Reset Mappings</button>
              </div>
              {!allMapped && <p style={{fontSize:'.7rem', color:'#b45309', marginTop:'6px'}}>Select a CSV column for each missing variable to enable Apply.</p>}
            </div>
          )}
          {isValid && <div className="alert alert-success">✅ Template is valid and ready!</div>}
          {isValid && csvData && template && (
            <GenerateButton csvData={csvData} template={template} onSuccess={onNext} />
          )}
          {missingVars.length > 0 && (
            <div className="alert alert-warning" style={{marginTop:'15px'}}>
              ⚠️ Some variables are missing from the CSV: <strong>{missingVars.join(', ')}</strong>
              <div style={{marginTop:'10px'}}>
                <button className="btn btn-link" onClick={() => setShowMapping(v=>!v)}>
                  {showMapping ? 'Hide' : 'Show'} Variable Mapping
                </button>
              </div>
              {showMapping && (
                <div style={{marginTop:'10px'}}>
                  <h4>Variable Mapping</h4>
                  <p>Map the missing variables to the correct CSV headers:</p>
                  <div style={{display:'grid', gap:'10px', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))'}}>
                    {missingVars.map(mv => (
                      <div key={mv} style={{
                        padding:'10px',
                        borderRadius:'8px',
                        border: '1px solid #ddd',
                        background: '#fafafa',
                        display:'flex',
                        flexDirection:'column',
                        gap:'8px'
                      }}>
                        <strong>{mv}</strong>
                        <select
                          value={varMappings[mv] || ''}
                          onChange={e => handleMappingChange(mv, e.target.value)}
                          className="form-select"
                        >
                          <option value="">Select CSV Header</option>
                          {csvData.headers.map(header => (
                            <option key={header} value={header}>{header}</option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                  <div style={{marginTop:'10px'}}>
                    <button
                      className="btn btn-primary"
                      onClick={applyMappings}
                      disabled={!allMapped}
                    >
                      Apply Mappings
                    </button>
                    <span style={{fontSize:'.8rem', color:'#666', marginLeft:'10px'}}>
                      {allMapped ? 'All variables are mapped.' : 'Please map all variables before applying.'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="card">
        <h2>Template Structure</h2>
        <div className="grid grid-2">
          <div>
            <h3>Required Fields</h3>
            <ul>
              <li><code>templateKey</code> - Unique identifier</li>
              <li><code>title</code> - SEO page title (may include variables)</li>
              <li><code>metaDescription</code> - Meta description text</li>
              <li><code>h1</code> - Main page heading</li>
              <li><code>variables</code> - Array of CSV columns used</li>
            </ul>
          </div>
          <div>
            <h3>Optional Fields</h3>
            <ul>
              <li><code>sections</code> - Array of body content strings</li>
              <li><code>faq</code> - Array of objects <code>{`{ q, a }`}</code></li>
            </ul>
          </div>
        </div>
        <p style={{fontSize:'.8rem',marginTop:'10px'}}>Below is an <strong>example format</strong>. It does NOT update when you edit—your working JSON is above in the editor. Variables inside braces like <code>{`{city}`}</code> are replaced per CSV row.</p>
        <details style={{marginTop:'8px'}}>
          <summary style={{cursor:'pointer', fontWeight:600}}>Show Example JSON</summary>
          <pre style={{ background: '#f8f9fa', padding: '15px', borderRadius: '4px', fontSize: '12px', overflow: 'auto', marginTop:'10px' }}>
{JSON.stringify(presetTemplates[0].data, null, 2)}
          </pre>
        </details>
      </div>
    </div>
  );
}

export default TemplateEditor;