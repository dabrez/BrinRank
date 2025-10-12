// Find the shortest learning path from foundational concepts to the paper
export const findShortestLearningPath = (graph) => {
  const { nodes, edges } = graph;

  // Build adjacency list (reverse direction - from prerequisites to dependents)
  const adjacencyList = new Map();
  const reverseAdjacencyList = new Map();

  nodes.forEach(node => {
    adjacencyList.set(node.id, []);
    reverseAdjacencyList.set(node.id, []);
  });

  edges.forEach(edge => {
    // edge.source requires edge.target (target is prerequisite)
    adjacencyList.get(edge.target)?.push(edge.source);
    reverseAdjacencyList.get(edge.source)?.push(edge.target);
  });

  // Find all foundational nodes (leaf nodes in dependency tree)
  const foundationalNodes = nodes.filter(node =>
    node.isFoundational || reverseAdjacencyList.get(node.id)?.length === 0
  );

  // Find the paper root node
  const paperNode = nodes.find(node => node.type === 'paper');
  if (!paperNode) {
    return { path: [], totalHours: 0 };
  }

  // Use BFS to find shortest path considering study hours as weight
  let bestPath = [];
  let shortestTime = Infinity;

  foundationalNodes.forEach(startNode => {
    const result = dijkstraPath(startNode.id, paperNode.id, nodes, adjacencyList);
    if (result.distance < shortestTime) {
      shortestTime = result.distance;
      bestPath = result.path;
    }
  });

  // Convert node IDs to full node objects
  const pathNodes = bestPath.map(nodeId =>
    nodes.find(node => node.id === nodeId)
  ).filter(Boolean);

  const totalHours = pathNodes.reduce((sum, node) =>
    sum + (node.estimatedStudyHours || 0), 0
  );

  return {
    path: pathNodes,
    totalHours,
  };
};

// Dijkstra's algorithm for weighted shortest path
const dijkstraPath = (startId, targetId, nodes, adjacencyList) => {
  const distances = new Map();
  const previous = new Map();
  const unvisited = new Set();
  const nodeMap = new Map(nodes.map(n => [n.id, n]));

  // Initialize
  nodes.forEach(node => {
    distances.set(node.id, Infinity);
    previous.set(node.id, null);
    unvisited.add(node.id);
  });
  distances.set(startId, 0);

  while (unvisited.size > 0) {
    // Find unvisited node with minimum distance
    let currentId = null;
    let minDistance = Infinity;
    unvisited.forEach(nodeId => {
      const dist = distances.get(nodeId);
      if (dist < minDistance) {
        minDistance = dist;
        currentId = nodeId;
      }
    });

    if (currentId === null || minDistance === Infinity) {
      break;
    }

    unvisited.delete(currentId);

    // Found target
    if (currentId === targetId) {
      break;
    }

    // Update distances to neighbors
    const neighbors = adjacencyList.get(currentId) || [];
    neighbors.forEach(neighborId => {
      if (unvisited.has(neighborId)) {
        const node = nodeMap.get(currentId);
        const weight = node?.estimatedStudyHours || 1;
        const altDistance = distances.get(currentId) + weight;

        if (altDistance < distances.get(neighborId)) {
          distances.set(neighborId, altDistance);
          previous.set(neighborId, currentId);
        }
      }
    });
  }

  // Reconstruct path
  const path = [];
  let current = targetId;
  while (current !== null) {
    path.unshift(current);
    current = previous.get(current);
  }

  // If path doesn't start with startId, no path exists
  if (path.length === 0 || path[0] !== startId) {
    return { path: [], distance: Infinity };
  }

  return {
    path,
    distance: distances.get(targetId),
  };
};

// Find all learning paths (for comparison)
export const findAllLearningPaths = (graph) => {
  const { nodes, edges } = graph;

  // Build adjacency list
  const adjacencyList = new Map();
  nodes.forEach(node => adjacencyList.set(node.id, []));
  edges.forEach(edge => {
    adjacencyList.get(edge.target)?.push(edge.source);
  });

  // Find foundational and paper nodes
  const reverseAdjacencyList = new Map();
  nodes.forEach(node => reverseAdjacencyList.set(node.id, []));
  edges.forEach(edge => {
    reverseAdjacencyList.get(edge.source)?.push(edge.target);
  });

  const foundationalNodes = nodes.filter(node =>
    node.isFoundational || reverseAdjacencyList.get(node.id)?.length === 0
  );

  const paperNode = nodes.find(node => node.type === 'paper');
  if (!paperNode) {
    return [];
  }

  // Find all paths from foundational nodes to paper
  const allPaths = [];
  foundationalNodes.forEach(startNode => {
    const paths = findAllPathsDFS(startNode.id, paperNode.id, adjacencyList, nodes);
    allPaths.push(...paths);
  });

  return allPaths.map(path => ({
    path,
    totalHours: path.reduce((sum, node) => sum + (node.estimatedStudyHours || 0), 0),
  }));
};

const findAllPathsDFS = (startId, targetId, adjacencyList, nodes, visited = new Set(), currentPath = []) => {
  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  visited.add(startId);
  currentPath.push(nodeMap.get(startId));

  if (startId === targetId) {
    const pathCopy = [...currentPath];
    visited.delete(startId);
    currentPath.pop();
    return [pathCopy];
  }

  const paths = [];
  const neighbors = adjacencyList.get(startId) || [];

  for (const neighborId of neighbors) {
    if (!visited.has(neighborId)) {
      const subPaths = findAllPathsDFS(neighborId, targetId, adjacencyList, nodes, visited, currentPath);
      paths.push(...subPaths);
    }
  }

  visited.delete(startId);
  currentPath.pop();

  return paths;
};

// Topological sort for ordering concepts
export const getTopologicalOrder = (graph) => {
  const { nodes, edges } = graph;
  const inDegree = new Map();
  const adjacencyList = new Map();

  // Initialize
  nodes.forEach(node => {
    inDegree.set(node.id, 0);
    adjacencyList.set(node.id, []);
  });

  // Build graph (source requires target, so edge goes target -> source)
  edges.forEach(edge => {
    adjacencyList.get(edge.target)?.push(edge.source);
    inDegree.set(edge.source, (inDegree.get(edge.source) || 0) + 1);
  });

  // Find all nodes with no incoming edges
  const queue = [];
  inDegree.forEach((degree, nodeId) => {
    if (degree === 0) {
      queue.push(nodeId);
    }
  });

  const order = [];
  while (queue.length > 0) {
    const currentId = queue.shift();
    order.push(nodes.find(n => n.id === currentId));

    const neighbors = adjacencyList.get(currentId) || [];
    neighbors.forEach(neighborId => {
      const newDegree = inDegree.get(neighborId) - 1;
      inDegree.set(neighborId, newDegree);
      if (newDegree === 0) {
        queue.push(neighborId);
      }
    });
  }

  return order.filter(Boolean);
};
