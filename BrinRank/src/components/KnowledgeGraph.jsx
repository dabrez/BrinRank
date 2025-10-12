import React, { useEffect, useRef, useState } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import './KnowledgeGraph.css';

const KnowledgeGraph = ({ graphData, shortestPath }) => {
  const fgRef = useRef();
  const [hoveredNode, setHoveredNode] = useState(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  console.log('KnowledgeGraph component rendered with:', {
    graphData,
    hasNodes: graphData?.nodes?.length,
    hasEdges: graphData?.edges?.length,
    shortestPath
  });

  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth * 0.9,
        height: window.innerHeight * 0.7,
      });
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    if (fgRef.current && graphData) {
      console.log('Zooming to fit graph');
      // Zoom to fit
      fgRef.current.zoomToFit(400);
    }
  }, [graphData]);

  if (!graphData || graphData.nodes.length === 0) {
    console.log('KnowledgeGraph: No data, showing placeholder');
    return (
      <div className="graph-placeholder">
        <p>Search for a research paper to generate the knowledge graph</p>
      </div>
    );
  }

  console.log('KnowledgeGraph: Rendering graph with', graphData.nodes.length, 'nodes');

  // Create a set of node IDs in the shortest path for highlighting
  const shortestPathIds = new Set(
    shortestPath?.path?.map(node => node.id) || []
  );

  // Prepare graph data for ForceGraph
  const graphFormatted = {
    nodes: graphData.nodes.map(node => ({
      ...node,
      color: getNodeColor(node, shortestPathIds),
      size: getNodeSize(node),
    })),
    links: graphData.edges.map(edge => ({
      source: edge.source,
      target: edge.target,
      color: isEdgeInPath(edge, shortestPath) ? '#FFD700' : '#999',
      width: isEdgeInPath(edge, shortestPath) ? 3 : 1,
    })),
  };

  return (
    <div className="knowledge-graph-container">
      <div className="graph-legend">
        <div className="legend-item">
          <span className="legend-dot paper"></span>
          <span>Research Paper</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot foundational"></span>
          <span>Foundational Concept</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot intermediate"></span>
          <span>Intermediate Concept</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot advanced"></span>
          <span>Advanced Concept</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot shortest-path"></span>
          <span>Shortest Learning Path</span>
        </div>
      </div>

      <ForceGraph2D
        ref={fgRef}
        graphData={graphFormatted}
        width={dimensions.width}
        height={dimensions.height}
        nodeLabel="name"
        nodeColor={node => node.color}
        nodeRelSize={6}
        nodeVal={node => node.size}
        linkColor={link => link.color}
        linkWidth={link => link.width}
        linkDirectionalArrowLength={3.5}
        linkDirectionalArrowRelPos={1}
        onNodeHover={setHoveredNode}
        nodeCanvasObject={(node, ctx, globalScale) => {
          const label = node.name;
          const fontSize = 12 / globalScale;
          ctx.font = `${fontSize}px Sans-Serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = node.color;

          // Draw node circle
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.size, 0, 2 * Math.PI, false);
          ctx.fill();

          // Draw label
          ctx.fillStyle = 'white';
          ctx.fillText(label, node.x, node.y + node.size + fontSize + 2);

          // Draw border for shortest path
          if (shortestPathIds.has(node.id)) {
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 3 / globalScale;
            ctx.stroke();
          }
        }}
        d3VelocityDecay={0.3}
        cooldownTime={3000}
      />

      {hoveredNode && (
        <div className="node-tooltip" style={{
          left: '50%',
          top: '20px',
        }}>
          <h3>{hoveredNode.name}</h3>
          <p><strong>Difficulty:</strong> {hoveredNode.difficulty}</p>
          <p><strong>Study Hours:</strong> {hoveredNode.estimatedStudyHours}h</p>
          {hoveredNode.description && (
            <p><strong>Description:</strong> {hoveredNode.description}</p>
          )}
        </div>
      )}

      {shortestPath && shortestPath.path && shortestPath.path.length > 0 && (
        <div className="path-info">
          <h3>Shortest Learning Path</h3>
          <p><strong>Total Study Time:</strong> {shortestPath.totalHours} hours</p>
          <p><strong>Concepts to Learn:</strong> {shortestPath.path.length - 1}</p>
          <div className="path-sequence">
            {shortestPath.path.map((node, idx) => (
              <span key={node.id}>
                {node.name}
                {idx < shortestPath.path.length - 1 && ' → '}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const getNodeColor = (node, shortestPathIds) => {
  if (node.type === 'paper') {
    return '#FF6B6B';
  }

  if (shortestPathIds.has(node.id)) {
    return '#FFD700'; // Gold for shortest path
  }

  if (node.isFoundational) {
    return '#51CF66';
  }

  switch (node.difficulty) {
    case 'undergraduate':
      return '#4DABF7';
    case 'graduate':
      return '#845EF7';
    case 'advanced':
      return '#E64980';
    default:
      return '#868E96';
  }
};

const getNodeSize = (node) => {
  if (node.type === 'paper') {
    return 10;
  }
  return 6;
};

const isEdgeInPath = (edge, shortestPath) => {
  if (!shortestPath || !shortestPath.path) return false;

  const pathIds = shortestPath.path.map(n => n.id);
  for (let i = 0; i < pathIds.length - 1; i++) {
    if (
      (edge.source === pathIds[i + 1] && edge.target === pathIds[i]) ||
      (edge.source.id === pathIds[i + 1] && edge.target.id === pathIds[i])
    ) {
      return true;
    }
  }
  return false;
};

export default KnowledgeGraph;
