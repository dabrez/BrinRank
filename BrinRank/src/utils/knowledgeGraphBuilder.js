import { extractRequirements, extractFullConceptHierarchy } from '../services/geminiService';

export class KnowledgeGraphBuilder {
  constructor() {
    this.nodes = new Map();
    this.edges = [];
    this.processedConcepts = new Set();
  }

  async buildGraph(paperTitle, paperAbstract) {
    // Reset state
    this.nodes.clear();
    this.edges = [];
    this.processedConcepts.clear();

    // Create root node for the paper
    const rootNode = {
      id: 'paper-root',
      name: paperTitle,
      type: 'paper',
      difficulty: 'research',
      description: 'Target research paper',
      estimatedStudyHours: 0,
      level: 0,
    };
    this.nodes.set(rootNode.id, rootNode);

    // Extract FULL concept hierarchy in ONE API call
    console.log('Extracting full concept hierarchy for paper...');
    const conceptHierarchy = await extractFullConceptHierarchy(paperTitle, paperAbstract);

    // Build graph from the hierarchy structure
    this.buildGraphFromHierarchy(conceptHierarchy, 'paper-root');

    return {
      nodes: Array.from(this.nodes.values()),
      edges: this.edges,
    };
  }

  buildGraphFromHierarchy(hierarchy, parentId, depth = 1) {
    if (!hierarchy || !hierarchy.concepts) return;

    for (const concept of hierarchy.concepts) {
      // Create unique ID for this concept
      const conceptId = this.generateConceptId(concept.name, depth);

      // Skip if we've already processed this concept
      if (this.processedConcepts.has(concept.name.toLowerCase())) {
        // Still create edge to existing node
        const existingNodeId = this.findNodeIdByName(concept.name);
        if (existingNodeId && existingNodeId !== conceptId) {
          this.edges.push({
            source: parentId,
            target: existingNodeId,
            type: 'requires',
          });
        }
        continue;
      }

      this.processedConcepts.add(concept.name.toLowerCase());

      // Create node for this concept
      const node = {
        id: conceptId,
        name: concept.name,
        type: 'concept',
        difficulty: concept.difficulty || 'undergraduate',
        description: concept.description || '',
        estimatedStudyHours: concept.estimatedStudyHours || 10,
        level: depth,
        isFoundational: concept.isFoundational || false,
      };
      this.nodes.set(conceptId, node);

      // Create edge from parent to this node
      this.edges.push({
        source: parentId,
        target: conceptId,
        type: 'requires',
      });

      // Process prerequisites recursively (but no API calls!)
      if (concept.prerequisites && concept.prerequisites.length > 0) {
        this.buildGraphFromHierarchy(
          { concepts: concept.prerequisites },
          conceptId,
          depth + 1
        );
      }
    }
  }

  generateConceptId(name, depth) {
    const sanitized = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    return `${sanitized}-${depth}`;
  }

  findNodeIdByName(name) {
    const nameLower = name.toLowerCase();
    for (const [id, node] of this.nodes.entries()) {
      if (node.name.toLowerCase() === nameLower) {
        return id;
      }
    }
    return null;
  }

  getGraph() {
    return {
      nodes: Array.from(this.nodes.values()),
      edges: this.edges,
    };
  }
}

export const buildKnowledgeGraph = async (paperTitle, paperAbstract) => {
  const builder = new KnowledgeGraphBuilder();
  return await builder.buildGraph(paperTitle, paperAbstract);
};
