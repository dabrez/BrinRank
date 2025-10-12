import React, { useState } from 'react';
import { searchArxivPaper } from '../services/arxivService';
import { buildKnowledgeGraph } from '../utils/knowledgeGraphBuilder';
import { generateSyllabus } from '../services/geminiService';
import { getTopologicalOrder, findShortestLearningPath } from '../utils/pathFinder';
import KnowledgeGraph from '../components/KnowledgeGraph';
import './SyllabusPage.css';

const SyllabusPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [papers, setPapers] = useState([]);
  const [selectedPaper, setSelectedPaper] = useState(null);
  const [syllabus, setSyllabus] = useState('');
  const [knowledgeGraph, setKnowledgeGraph] = useState(null);
  const [shortestPath, setShortestPath] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError(null);
    try {
      // Check if the query is an arXiv URL and extract the ID
      const arxivUrlPattern = /arxiv\.org\/abs\/([0-9.]+)/i;
      const match = searchQuery.match(arxivUrlPattern);

      let results;
      if (match) {
        // If it's an arXiv URL, fetch the specific paper by ID
        console.log('Detected arXiv URL, extracting ID:', match[1]);
        const { getArxivPaperById } = await import('../services/arxivService');
        const paper = await getArxivPaperById(match[1]);
        results = [paper];
      } else {
        // Otherwise, perform a regular search
        results = await searchArxivPaper(searchQuery);
      }

      setPapers(results);
    } catch (err) {
      setError('Failed to search papers. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSyllabus = async (paper) => {
    setSelectedPaper(paper);
    setGenerating(true);
    setError(null);

    try {
      console.log('Building knowledge graph for syllabus...');
      const graph = await buildKnowledgeGraph(paper.title, paper.summary);
      console.log('Knowledge graph built:', graph);
      console.log('Graph nodes:', graph?.nodes?.length);
      console.log('Graph edges:', graph?.edges?.length);
      setKnowledgeGraph(graph);

      console.log('Finding shortest learning path...');
      const path = findShortestLearningPath(graph);
      console.log('Shortest path found:', path);
      setShortestPath(path);

      console.log('Generating syllabus...');
      const syllabusText = await generateSyllabus(paper.title, graph);
      console.log('Syllabus generated, length:', syllabusText?.length);
      setSyllabus(syllabusText);

      console.log('Final state check:');
      console.log('- selectedPaper:', paper.title);
      console.log('- knowledgeGraph set:', !!graph);
      console.log('- syllabus set:', !!syllabusText);
      console.log('- generating:', false);
    } catch (err) {
      setError('Failed to generate syllabus. Please try again.');
      console.error('Error during syllabus generation:', err);
      console.error('Error stack:', err.stack);
    } finally {
      setGenerating(false);
    }
  };

  const downloadSyllabus = () => {
    const element = document.createElement('a');
    const file = new Blob([syllabus], { type: 'text/markdown' });
    element.href = URL.createObjectURL(file);
    element.download = `syllabus-${selectedPaper?.arxivId || 'paper'}.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const renderMarkdown = (text) => {
    // Simple markdown rendering
    return text
      .split('\n')
      .map((line, idx) => {
        // Headers
        if (line.startsWith('### ')) {
          return <h3 key={idx}>{line.replace('### ', '')}</h3>;
        }
        if (line.startsWith('## ')) {
          return <h2 key={idx}>{line.replace('## ', '')}</h2>;
        }
        if (line.startsWith('# ')) {
          return <h1 key={idx}>{line.replace('# ', '')}</h1>;
        }
        // Bold
        if (line.includes('**')) {
          const parts = line.split('**');
          return (
            <p key={idx}>
              {parts.map((part, i) => (i % 2 === 0 ? part : <strong key={i}>{part}</strong>))}
            </p>
          );
        }
        // List items
        if (line.startsWith('- ') || line.startsWith('* ')) {
          return <li key={idx}>{line.substring(2)}</li>;
        }
        if (line.match(/^\d+\. /)) {
          return <li key={idx}>{line.replace(/^\d+\. /, '')}</li>;
        }
        // Empty line
        if (line.trim() === '') {
          return <br key={idx} />;
        }
        // Regular paragraph
        return <p key={idx}>{line}</p>;
      });
  };

  return (
    <div className="syllabus-page">
      <div className="syllabus-hero">
        <h1>Generate Research Syllabus</h1>
        <p className="subtitle">
          Create a comprehensive learning syllabus for student onboarding
        </p>

        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for a research paper"
            className="search-input"
            disabled={loading || generating}
          />
          <button
            type="submit"
            className="search-button"
            disabled={loading || generating}
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>

        {error && <div className="error-message">{error}</div>}
      </div>

      {papers.length > 0 && !selectedPaper && (
        <div className="papers-section">
          <h2>Select a Paper</h2>
          <div className="papers-grid">
            {papers.map((paper) => (
              <div key={paper.id} className="paper-card">
                <h3>{paper.title}</h3>
                <p className="paper-authors">
                  {paper.authors.slice(0, 3).join(', ')}
                  {paper.authors.length > 3 && ' et al.'}
                </p>
                <p className="paper-summary">
                  {paper.summary.substring(0, 150)}...
                </p>
                <button
                  onClick={() => handleGenerateSyllabus(paper)}
                  className="generate-button"
                  disabled={generating}
                >
                  Generate Syllabus
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {generating && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p>Generating comprehensive syllabus...</p>
          <p className="loading-subtext">
            Analyzing prerequisites and creating learning path
          </p>
        </div>
      )}

      {(() => {
        console.log('Render check:', {
          selectedPaper: !!selectedPaper,
          syllabus: !!syllabus,
          generating,
          knowledgeGraph: !!knowledgeGraph,
          shouldRenderSyllabus: selectedPaper && syllabus && !generating
        });
        return null;
      })()}

      {selectedPaper && syllabus && !generating && (
        <div className="syllabus-section">
          <div className="syllabus-header">
            <div>
              <h2>Research Onboarding Syllabus</h2>
              <p className="paper-title">{selectedPaper.title}</p>
            </div>
            <div className="syllabus-actions">
              <button onClick={downloadSyllabus} className="download-button">
                Download Syllabus
              </button>
              <button
                onClick={() => {
                  setSelectedPaper(null);
                  setSyllabus('');
                  setKnowledgeGraph(null);
                  setShortestPath(null);
                }}
                className="back-button"
              >
                ← Back to Search
              </button>
            </div>
          </div>

          {(() => {
            console.log('Knowledge graph check for rendering:', {
              knowledgeGraph: !!knowledgeGraph,
              nodes: knowledgeGraph?.nodes?.length,
              edges: knowledgeGraph?.edges?.length
            });
            return null;
          })()}

          {knowledgeGraph && (
            <>
              <div className="prerequisites-summary">
                <h3>Prerequisites Overview</h3>
                <div className="summary-stats">
                  <div className="summary-stat">
                    <span className="stat-number">{knowledgeGraph.nodes.length - 1}</span>
                    <span className="stat-label">Concepts</span>
                  </div>
                  <div className="summary-stat">
                    <span className="stat-number">
                      {getTopologicalOrder(knowledgeGraph).filter(n => n.isFoundational).length}
                    </span>
                    <span className="stat-label">Foundational</span>
                  </div>
                  <div className="summary-stat">
                    <span className="stat-number">
                      {knowledgeGraph.nodes.reduce((sum, n) => sum + (n.estimatedStudyHours || 0), 0)}h
                    </span>
                    <span className="stat-label">Total Time</span>
                  </div>
                </div>
              </div>

              <KnowledgeGraph
                graphData={knowledgeGraph}
                shortestPath={shortestPath}
              />
            </>
          )}

          <div className="syllabus-content">
            {renderMarkdown(syllabus)}
          </div>
        </div>
      )}
    </div>
  );
};

export default SyllabusPage;
