import axios from 'axios';

// Use the proxy endpoint in development, direct URL in production
const ARXIV_API_URL = import.meta.env.DEV
  ? '/api/arxiv'
  : 'https://export.arxiv.org/api/query';

export const searchArxivPaper = async (query) => {
  try {
    const response = await axios.get(ARXIV_API_URL, {
      params: {
        search_query: `all:${query}`,
        start: 0,
        max_results: 10,
      },
    });

    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(response.data, 'text/xml');

    // Check for parsing errors
    const parserError = xmlDoc.getElementsByTagName('parsererror');
    if (parserError.length > 0) {
      console.error('XML parsing error:', parserError[0].textContent);
      throw new Error('Failed to parse ArXiv response');
    }

    const entries = xmlDoc.getElementsByTagName('entry');

    if (entries.length === 0) {
      console.log('No papers found for query:', query);
      return [];
    }

    const papers = [];
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];

      const title = entry.getElementsByTagName('title')[0]?.textContent?.trim();
      const summary = entry.getElementsByTagName('summary')[0]?.textContent?.trim();
      const id = entry.getElementsByTagName('id')[0]?.textContent?.trim();
      const published = entry.getElementsByTagName('published')[0]?.textContent?.trim();

      const authors = [];
      const authorElements = entry.getElementsByTagName('author');
      for (let j = 0; j < authorElements.length; j++) {
        const name = authorElements[j].getElementsByTagName('name')[0]?.textContent?.trim();
        if (name) authors.push(name);
      }

      papers.push({
        id,
        title,
        summary,
        authors,
        published,
        arxivId: id.split('/abs/')[1],
      });
    }

    console.log(`Found ${papers.length} papers for query: ${query}`);
    return papers;
  } catch (error) {
    console.error('Error fetching from ArXiv:', error);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    throw new Error(error.message || 'Failed to fetch papers from ArXiv');
  }
};

export const getArxivPaperById = async (arxivId) => {
  try {
    const response = await axios.get(ARXIV_API_URL, {
      params: {
        id_list: arxivId,
      },
    });

    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(response.data, 'text/xml');

    // Check for parsing errors
    const parserError = xmlDoc.getElementsByTagName('parsererror');
    if (parserError.length > 0) {
      console.error('XML parsing error:', parserError[0].textContent);
      throw new Error('Failed to parse ArXiv response');
    }

    const entry = xmlDoc.getElementsByTagName('entry')[0];

    if (!entry) {
      throw new Error('Paper not found');
    }

    const title = entry.getElementsByTagName('title')[0]?.textContent?.trim();
    const summary = entry.getElementsByTagName('summary')[0]?.textContent?.trim();
    const id = entry.getElementsByTagName('id')[0]?.textContent?.trim();
    const published = entry.getElementsByTagName('published')[0]?.textContent?.trim();

    const authors = [];
    const authorElements = entry.getElementsByTagName('author');
    for (let j = 0; j < authorElements.length; j++) {
      const name = authorElements[j].getElementsByTagName('name')[0]?.textContent?.trim();
      if (name) authors.push(name);
    }

    return {
      id,
      title,
      summary,
      authors,
      published,
      arxivId: id.split('/abs/')[1],
    };
  } catch (error) {
    console.error('Error fetching paper from ArXiv:', error);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    throw new Error(error.message || 'Failed to fetch paper from ArXiv');
  }
};
