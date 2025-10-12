import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export const extractRequirements = async (paperTitle, paperAbstract) => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

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
    return data.concepts || [];
  } catch (error) {
    console.error('Error extracting requirements with Gemini:', error);
    throw error;
  }
};

export const extractSubRequirements = async (conceptName, conceptDescription) => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

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

export const generateSyllabus = async (paperTitle, knowledgeGraph) => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

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
