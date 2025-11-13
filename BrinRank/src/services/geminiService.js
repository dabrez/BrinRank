// Ollama API configuration
const OLLAMA_HOST = import.meta.env.VITE_OLLAMA_HOST || 'http://localhost:11434';
const OLLAMA_MODEL = import.meta.env.VITE_OLLAMA_MODEL || 'llama3.2';

// Helper function to call Ollama API
const callOllama = async (prompt) => {
  try {
    const response = await fetch(`${OLLAMA_HOST}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt: prompt,
        stream: false,
        format: 'json',
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.response;
  } catch (error) {
    console.error('Error calling Ollama:', error);
    throw error;
  }
};

export const extractRequirements = async (paperTitle, paperAbstract) => {
  try {
    console.log('Ollama API: Extracting requirements for paper:', paperTitle);

    const prompt = `You are an expert at analyzing academic research papers and identifying prerequisite knowledge.

Given the following research paper:
Title: ${paperTitle}
Abstract: ${paperAbstract}

Please identify the key prerequisite concepts and knowledge areas that an undergraduate student would need to understand this paper.

Return your response as a JSON object with the following structure:
{
  "concepts": [
    {
      "name": "Concept Name",
      "difficulty": "undergraduate" | "graduate" | "advanced",
      "description": "Brief description of why this is needed",
      "estimatedStudyHours": number
    }
  ]
}

Focus on fundamental concepts that would be prerequisites, not the advanced concepts introduced in the paper itself. Include mathematical foundations, domain knowledge, and methodological understanding needed.

IMPORTANT: Return ONLY valid JSON, no markdown formatting or code blocks.`;

    console.log('Ollama API: Sending request...');
    const text = await callOllama(prompt);
    console.log('Ollama API: Received response, length:', text.length);

    console.log('Ollama API: Parsing JSON...');
    const data = JSON.parse(text.trim());
    console.log('Ollama API: Extracted', data.concepts?.length, 'concepts');
    return data.concepts || [];
  } catch (error) {
    console.error('Error extracting requirements with Ollama:', error);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      stack: error.stack
    });
    throw error;
  }
};

export const extractSubRequirements = async (conceptName, conceptDescription) => {
  try {
    const prompt = `You are an expert at breaking down complex concepts into prerequisite knowledge.

Given the concept:
Name: ${conceptName}
Description: ${conceptDescription}

What are the fundamental prerequisites an undergraduate student needs to understand this concept?

Return your response as a JSON object with the following structure:
{
  "prerequisites": [
    {
      "name": "Prerequisite Name",
      "difficulty": "undergraduate" | "graduate" | "advanced",
      "description": "Brief description",
      "estimatedStudyHours": number,
      "isFoundational": boolean
    }
  ]
}

Mark "isFoundational" as true if this is a basic concept that doesn't need further breakdown (like basic algebra, calculus, etc.).
If the concept is already foundational, return an empty prerequisites array.

IMPORTANT: Return ONLY valid JSON, no markdown formatting or code blocks.`;

    const text = await callOllama(prompt);
    const data = JSON.parse(text.trim());
    return data.prerequisites || [];
  } catch (error) {
    console.error('Error extracting sub-requirements with Ollama:', error);
    throw error;
  }
};

// NEW OPTIMIZED FUNCTION: Extract full concept hierarchy in ONE API call
export const extractFullConceptHierarchy = async (paperTitle, paperAbstract) => {
  try {
    console.log('Ollama API: Extracting FULL concept hierarchy for paper:', paperTitle);

    const prompt = `You are an expert at analyzing academic research papers and creating comprehensive prerequisite knowledge maps.

Given the following research paper:
Title: ${paperTitle}
Abstract: ${paperAbstract}

Create a COMPLETE hierarchical prerequisite knowledge graph for an undergraduate student to understand this paper.

IMPORTANT INSTRUCTIONS:
1. Focus on the MOST IMPORTANT concepts - aim for 8-15 total concepts maximum
2. Organize concepts into a clear hierarchy with 2-3 levels maximum
3. Mark foundational concepts (basic math, programming, etc.) as "isFoundational": true
4. Each concept should have clear prerequisites listed within it
5. Avoid overly granular breakdown - group related ideas together

Return your response as a JSON object with this NESTED structure:
{
  "concepts": [
    {
      "name": "High-level Concept",
      "difficulty": "graduate",
      "description": "Why this is needed",
      "estimatedStudyHours": 20,
      "isFoundational": false,
      "prerequisites": [
        {
          "name": "Mid-level Prerequisite",
          "difficulty": "undergraduate",
          "description": "Foundation needed",
          "estimatedStudyHours": 15,
          "isFoundational": false,
          "prerequisites": [
            {
              "name": "Foundational Concept",
              "difficulty": "undergraduate",
              "description": "Basic knowledge",
              "estimatedStudyHours": 10,
              "isFoundational": true,
              "prerequisites": []
            }
          ]
        }
      ]
    }
  ]
}

Keep the graph focused and conceptual. Prioritize breadth of important topics over depth of minor details.

IMPORTANT: Return ONLY valid JSON, no markdown formatting or code blocks.`;

    console.log('Ollama API: Sending request for full hierarchy...');
    const text = await callOllama(prompt);
    console.log('Ollama API: Received hierarchy response, length:', text.length);

    console.log('Ollama API: Parsing hierarchy JSON...');
    const data = JSON.parse(text.trim());
    console.log('Ollama API: Extracted hierarchy with', data.concepts?.length, 'top-level concepts');
    return data;
  } catch (error) {
    console.error('Error extracting full concept hierarchy with Ollama:', error);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      stack: error.stack
    });
    throw error;
  }
};

export const generateSyllabus = async (paperTitle, knowledgeGraph) => {
  try {
    const conceptsList = knowledgeGraph.nodes
      .map(node => `- ${node.name} (${node.difficulty}, ${node.estimatedStudyHours}h)`)
      .join('\n');

    const prompt = `You are an expert educator designing a comprehensive learning syllabus.

Create a detailed syllabus to prepare undergraduate students to understand this research paper:
Title: ${paperTitle}

The prerequisite knowledge graph includes these concepts:
${conceptsList}

Create a structured syllabus with:
1. A learning path ordered from foundational to advanced concepts
2. Week-by-week breakdown
3. Recommended resources (textbooks, online courses, papers)
4. Practice problems and projects
5. Milestones and assessments

Format your response as a detailed markdown document that would be suitable for student onboarding into a research group.

Return the syllabus in markdown format.`;

    // For syllabus generation, we don't need JSON format
    const response = await fetch(`${OLLAMA_HOST}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt: prompt,
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.response;
  } catch (error) {
    console.error('Error generating syllabus with Ollama:', error);
    throw error;
  }
};
