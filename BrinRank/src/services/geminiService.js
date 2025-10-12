import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export const extractRequirements = async (paperTitle, paperAbstract) => {
  try {
    console.log('Gemini API: Extracting requirements for paper:', paperTitle);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `
You are an expert at analyzing academic research papers and identifying prerequisite knowledge.

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
`;

    console.log('Gemini API: Sending request...');
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    console.log('Gemini API: Received response, length:', text.length);

    // Extract JSON from markdown code blocks if present
    let jsonText = text;
    const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1];
    } else {
      const codeMatch = text.match(/```\n?([\s\S]*?)\n?```/);
      if (codeMatch) {
        jsonText = codeMatch[1];
      }
    }

    console.log('Gemini API: Parsing JSON...');
    const data = JSON.parse(jsonText.trim());
    console.log('Gemini API: Extracted', data.concepts?.length, 'concepts');
    return data.concepts || [];
  } catch (error) {
    console.error('Error extracting requirements with Gemini:', error);
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
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `
You are an expert at breaking down complex concepts into prerequisite knowledge.

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
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Extract JSON from markdown code blocks if present
    let jsonText = text;
    const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1];
    } else {
      const codeMatch = text.match(/```\n?([\s\S]*?)\n?```/);
      if (codeMatch) {
        jsonText = codeMatch[1];
      }
    }

    const data = JSON.parse(jsonText.trim());
    return data.prerequisites || [];
  } catch (error) {
    console.error('Error extracting sub-requirements with Gemini:', error);
    throw error;
  }
};

// NEW OPTIMIZED FUNCTION: Extract full concept hierarchy in ONE API call
export const extractFullConceptHierarchy = async (paperTitle, paperAbstract) => {
  try {
    console.log('Gemini API: Extracting FULL concept hierarchy for paper:', paperTitle);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `
You are an expert at analyzing academic research papers and creating comprehensive prerequisite knowledge maps.

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
`;

    console.log('Gemini API: Sending request for full hierarchy...');
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    console.log('Gemini API: Received hierarchy response, length:', text.length);

    // Extract JSON from markdown code blocks if present
    let jsonText = text;
    const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1];
    } else {
      const codeMatch = text.match(/```\n?([\s\S]*?)\n?```/);
      if (codeMatch) {
        jsonText = codeMatch[1];
      }
    }

    console.log('Gemini API: Parsing hierarchy JSON...');
    const data = JSON.parse(jsonText.trim());
    console.log('Gemini API: Extracted hierarchy with', data.concepts?.length, 'top-level concepts');
    return data;
  } catch (error) {
    console.error('Error extracting full concept hierarchy with Gemini:', error);
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
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const conceptsList = knowledgeGraph.nodes
      .map(node => `- ${node.name} (${node.difficulty}, ${node.estimatedStudyHours}h)`)
      .join('\n');

    const prompt = `
You are an expert educator designing a comprehensive learning syllabus.

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
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error generating syllabus with Gemini:', error);
    throw error;
  }
};
