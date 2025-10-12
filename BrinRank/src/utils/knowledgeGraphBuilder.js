import { extractRequirements, extractSubRequirements } from '../services/geminiService';

export class KnowledgeGraphBuilder {
  constructor() {
    this.nodes = new Map();
    this.edges = [];
    this.maxDepth = 3; // Limit recursion depth
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

    // Extract top-level requirements
    console.log('Extracting requirements for paper...');
    const topLevelConcepts = await extractRequirements(paperTitle, paperAbstract);

    // Process each top-level concept recursively
    for (const concept of topLevelConcepts) {
      await this.processConceptRecursively(concept, 'paper-root', 1);
    }

    return {
      nodes: Array.from(this.nodes.values()),
      edges: this.edges,
    };
  }

  async processConceptRecursively(concept, parentId, depth) {
    // Stop if we've reached max depth
    if (depth > this.maxDepth) {
      return;
    }

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
      return;
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

    // If this is foundational, don't recurse further
    if (concept.isFoundational) {
      return;
    }

    // Extract prerequisites for this concept
    try {
      console.log(`Extracting prerequisites for: ${concept.name} (depth ${depth})`);
      const prerequisites = await extractSubRequirements(concept.name, concept.description);

      // Process each prerequisite recursively
      for (const prereq of prerequisites) {
        await this.processConceptRecursively(prereq, conceptId, depth + 1);
      }
    } catch (error) {
      console.error(`Error processing concept ${concept.name}:`, error);
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
