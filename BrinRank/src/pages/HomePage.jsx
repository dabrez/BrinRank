import React, { useState } from 'react';
import { searchArxivPaper } from '../services/arxivService';
import { buildKnowledgeGraph } from '../utils/knowledgeGraphBuilder';
import { findShortestLearningPath } from '../utils/pathFinder';
import KnowledgeGraph from '../components/KnowledgeGraph';
import './HomePage.css';

const HomePage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [papers, setPapers] = useState([]);
  const [selectedPaper, setSelectedPaper] = useState(null);
  const [knowledgeGraph, setKnowledgeGraph] = useState(null);
  const [shortestPath, setShortestPath] = useState(null);
  const [loading, setLoading] = useState(false);
  const [buildingGraph, setBuildingGraph] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const results = await searchArxivPaper(searchQuery);
      setPapers(results);
    } catch (err) {
      setError('Failed to search papers. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePaperSelect = async (paper) => {
    setSelectedPaper(paper);
    setBuildingGraph(true);
    setError(null);

    try {
      console.log('Building knowledge graph for:', paper.title);
      const graph = await buildKnowledgeGraph(paper.title, paper.summary);
      setKnowledgeGraph(graph);

      console.log('Finding shortest learning path...');
      const path = findShortestLearningPath(graph);
      setShortestPath(path);
    } catch (err) {
      setError('Failed to build knowledge graph. Please try again.');
      console.error(err);
    } finally {
      setBuildingGraph(false);
    }
  };

  return (
    <div className="home-page">
      <div className="hero-section">
        <h1>BrinRank</h1>
        <p className="subtitle">
          Discover the shortest learning path to understand research papers
        </p>

        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for a research paper (e.g., 'transformer neural networks')"
            className="search-input"
            disabled={loading || buildingGraph}
          />
          <button
            type="submit"
            className="search-button"
            disabled={loading || buildingGraph}
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>

        {error && <div className="error-message">{error}</div>}
      </div>

      {papers.length > 0 && !selectedPaper && (
        <div className="papers-list">
          <h2>Search Results</h2>
          <div className="papers-grid">
            {papers.map((paper) => (
              <div key={paper.id} className="paper-card">
                <h3>{paper.title}</h3>
                <p className="paper-authors">
                  {paper.authors.slice(0, 3).join(', ')}
                  {paper.authors.length > 3 && ' et al.'}
                </p>
                <p className="paper-summary">
                  {paper.summary.substring(0, 200)}...
                </p>
                <button
                  onClick={() => handlePaperSelect(paper)}
                  className="analyze-button"
                  disabled={buildingGraph}
                >
                  Analyze Prerequisites
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {buildingGraph && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p>Building knowledge graph...</p>
          <p className="loading-subtext">
            This may take a minute as we recursively analyze prerequisites
          </p>
        </div>
      )}

      {selectedPaper && knowledgeGraph && !buildingGraph && (
        <div className="graph-section">
          <div className="selected-paper-info">
            <h2>{selectedPaper.title}</h2>
            <p className="paper-authors">
              By {selectedPaper.authors.join(', ')}
            </p>
            <button
              onClick={() => {
                setSelectedPaper(null);
                setKnowledgeGraph(null);
                setShortestPath(null);
              }}
              className="back-button"
            >
              ← Back to Results
            </button>
          </div>

          <KnowledgeGraph
            graphData={knowledgeGraph}
            shortestPath={shortestPath}
          />

          <div className="graph-stats">
            <div className="stat-card">
              <h3>{knowledgeGraph.nodes.length - 1}</h3>
              <p>Prerequisite Concepts</p>
            </div>
            <div className="stat-card">
              <h3>{shortestPath?.totalHours || 0}h</h3>
              <p>Estimated Study Time</p>
            </div>
            <div className="stat-card">
              <h3>{knowledgeGraph.edges.length}</h3>
              <p>Concept Dependencies</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;
