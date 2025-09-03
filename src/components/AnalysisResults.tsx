import React, { useState } from 'react';
import { ParseResult, PEC, ConfigObject } from '../types/network';

interface AnalysisResultsProps {
  results: ParseResult;
}

export const AnalysisResults: React.FC<AnalysisResultsProps> = ({ results }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'pecs' | 'configs' | 'trie'>('overview');
  const [expandedPECs, setExpandedPECs] = useState<Set<string>>(new Set());

  const togglePEC = (pecId: string) => {
    const newExpanded = new Set(expandedPECs);
    if (newExpanded.has(pecId)) {
      newExpanded.delete(pecId);
    } else {
      newExpanded.add(pecId);
    }
    setExpandedPECs(newExpanded);
  };

  const getStats = () => {
    const totalPrefixes = results.configObjects.reduce((sum, config) => sum + config.prefixes.length, 0);
    const configuredPECs = results.pecs.filter(p => p.configObjects.length > 0).length;
    const emptyPECs = results.pecs.filter(p => p.configObjects.length === 0).length;
    const coveragePercentage = results.pecs.length > 0 ? (configuredPECs / results.pecs.length) * 100 : 0;

    return {
      totalConfigs: results.configObjects.length,
      totalPrefixes,
      totalPECs: results.pecs.length,
      configuredPECs,
      emptyPECs,
      coveragePercentage: Math.round(coveragePercentage * 100) / 100
    };
  };

  const stats = getStats();

  return (
    <div className="analysis-results">
      <div className="results-header">
        <h2>Analysis Results</h2>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{stats.totalConfigs}</div>
            <div className="stat-label">Config Objects</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.totalPrefixes}</div>
            <div className="stat-label">Total Prefixes</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.totalPECs}</div>
            <div className="stat-label">Total PECs</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.coveragePercentage}%</div>
            <div className="stat-label">Coverage</div>
          </div>
        </div>
      </div>

      <div className="results-tabs">
        <button
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`tab-button ${activeTab === 'pecs' ? 'active' : ''}`}
          onClick={() => setActiveTab('pecs')}
        >
          Packet Equivalence Classes ({stats.totalPECs})
        </button>
        <button
          className={`tab-button ${activeTab === 'configs' ? 'active' : ''}`}
          onClick={() => setActiveTab('configs')}
        >
          Configuration Objects ({stats.totalConfigs})
        </button>
        <button
          className={`tab-button ${activeTab === 'trie' ? 'active' : ''}`}
          onClick={() => setActiveTab('trie')}
        >
          Trie Tree Structure
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <h3>Network Configuration Analysis Summary</h3>
            <div className="summary-grid">
              <div className="summary-section">
                <h4>Configuration Objects</h4>
                <ul>
                  <li>Prefix Lists: {results.configObjects.filter(c => c.type === 'prefix-list').length}</li>
                  <li>Route Maps: {results.configObjects.filter(c => c.type === 'route-map').length}</li>
                  <li>Interfaces: {results.configObjects.filter(c => c.type === 'interface').length}</li>
                  <li>BGP Configs: {results.configObjects.filter(c => c.type === 'bgp').length}</li>
                </ul>
              </div>
              <div className="summary-section">
                <h4>Packet Equivalence Classes</h4>
                <ul>
                  <li>Configured PECs: {stats.configuredPECs}</li>
                  <li>Empty PECs: {stats.emptyPECs}</li>
                  <li>Coverage: {stats.coveragePercentage}%</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'pecs' && (
          <div className="pecs-tab">
            <h3>Packet Equivalence Classes</h3>
            <div className="pecs-list">
              {results.pecs.map((pec) => (
                <div key={pec.id} className="pec-item">
                  <div 
                    className="pec-header"
                    onClick={() => togglePEC(pec.id)}
                  >
                    <span className="pec-id">{pec.id}</span>
                    <span className="pec-range">
                      {pec.range.start} - {pec.range.end}
                    </span>
                    <span className="pec-config-count">
                      {pec.configObjects.length} configs
                    </span>
                    <span className="pec-toggle">
                      {expandedPECs.has(pec.id) ? '▼' : '▶'}
                    </span>
                  </div>
                  {expandedPECs.has(pec.id) && (
                    <div className="pec-details">
                      <div className="pec-prefixes">
                        <strong>Contributing Prefixes:</strong>
                        <ul>
                          {pec.contributingPrefixes.map((prefix, idx) => (
                            <li key={idx}>
                              {prefix.network}/{prefix.mask}
                              {prefix.ge && ` ge ${prefix.ge}`}
                              {prefix.le && ` le ${prefix.le}`}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="pec-configs">
                        <strong>Configuration Objects:</strong>
                        <ul>
                          {pec.configObjects.map((config) => (
                            <li key={config.id}>
                              <strong>{config.type}</strong>: {config.name}
                              <br />
                              <small>Router: {config.router}</small>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'configs' && (
          <div className="configs-tab">
            <h3>Configuration Objects</h3>
            <div className="configs-list">
              {results.configObjects.map((config) => (
                <div key={config.id} className="config-item">
                  <div className="config-header">
                    <span className="config-type">{config.type}</span>
                    <span className="config-name">{config.name}</span>
                    <span className="config-router">{config.router}</span>
                  </div>
                  <div className="config-prefixes">
                    <strong>Prefixes:</strong>
                    <ul>
                      {config.prefixes.map((prefix, idx) => (
                        <li key={idx}>
                          {prefix.network}/{prefix.mask}
                          {prefix.ge && ` ge ${prefix.ge}`}
                          {prefix.le && ` le ${prefix.le}`}
                        </li>
                      ))}
                    </ul>
                  </div>
                  {config.matchConditions && config.matchConditions.length > 0 && (
                    <div className="config-matches">
                      <strong>Match Conditions:</strong>
                      <ul>
                        {config.matchConditions.map((match, idx) => (
                          <li key={idx}>
                            {match.type}: {match.value}
                            {match.prefixList && ` (prefix-list: ${match.prefixList})`}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {config.setActions && config.setActions.length > 0 && (
                    <div className="config-actions">
                      <strong>Set Actions:</strong>
                      <ul>
                        {config.setActions.map((action, idx) => (
                          <li key={idx}>
                            {action.type}: {action.value}
                            {action.additive && ' (additive)'}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'trie' && (
          <div className="trie-tab">
            <h3>Trie Tree Structure</h3>
            <p>This tab would show a visual representation of the Trie tree structure.</p>
            <p>For now, showing the extracted PECs which represent the Trie tree traversal results.</p>
            <div className="trie-preview">
              {results.pecs.slice(0, 10).map((pec) => (
                <div key={pec.id} className="trie-node">
                  <span className="node-range">
                    {pec.range.start} - {pec.range.end}
                  </span>
                  <span className="node-configs">
                    {pec.configObjects.length} configs
                  </span>
                </div>
              ))}
              {results.pecs.length > 10 && (
                <div className="trie-more">
                  ... and {results.pecs.length - 10} more nodes
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
