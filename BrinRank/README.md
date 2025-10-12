# BrinRank

**BrinRank** is an intelligent research paper analysis tool that helps undergraduate students understand the prerequisite knowledge needed to comprehend complex research papers. It generates interactive knowledge graphs and personalized learning syllabi to create the shortest path for students to get interested in research.

## Features

### 1. Interactive Knowledge Graph
- Visualizes prerequisite concepts recursively using ArXiv and Gemini APIs
- Color-coded nodes by difficulty level (foundational, undergraduate, graduate, advanced)
- Highlights the shortest learning path from foundational concepts to the research paper
- Interactive hover tooltips with concept details

### 2. Shortest Path Algorithm
- Calculates the optimal learning trajectory using Dijkstra's algorithm
- Estimates total study hours required
- Shows concept dependencies and relationships
- Identifies foundational concepts that require no further prerequisites

### 3. Syllabus Generation
- Creates comprehensive learning syllabi for student onboarding
- Week-by-week breakdown of concepts
- Recommended resources and practice problems
- Downloadable as markdown files

## Technology Stack

- **React 18** - Frontend framework
- **Vite** - Build tool and dev server
- **Google Gemini API** - AI-powered prerequisite extraction and syllabus generation
- **ArXiv API** - Research paper search and metadata
- **React Force Graph** - Interactive graph visualization
- **React Router** - Client-side routing

## Getting Started

### Prerequisites

- Node.js 16+ installed
- Google Gemini API key ([Get one here](https://makersuite.google.com/app/apikey))

### Installation

1. Clone the repository:
```bash
cd BrinRank
```

2. Install dependencies:
```bash
npm install
```

3. Your `.env` file should already contain your Gemini API key:
```
VITE_GEMINI_API_KEY=your_api_key_here
```

4. Start the development server:
```bash
npm run dev
```

5. Open your browser and navigate to `http://localhost:3000`

## Usage

### Knowledge Graph View

1. Enter a research topic or paper title in the search bar
2. Select a paper from the search results
3. Wait while the app recursively analyzes prerequisites (this may take 1-2 minutes)
4. Explore the interactive knowledge graph:
   - Zoom and pan to navigate
   - Hover over nodes for details
   - View the highlighted shortest learning path

### Syllabus Generation

1. Navigate to "Generate Syllabus" page
2. Search for a research paper
3. Click "Generate Syllabus" on your selected paper
4. Review the comprehensive learning plan
5. Download the syllabus as a markdown file

## How It Works

### Recursive Knowledge Extraction

1. **Paper Analysis**: Gemini analyzes the paper's title and abstract to identify top-level prerequisite concepts
2. **Recursive Breakdown**: For each concept, the system recursively extracts prerequisites until reaching foundational concepts
3. **Graph Construction**: Builds a directed acyclic graph (DAG) with concepts as nodes and dependencies as edges
4. **Path Optimization**: Applies Dijkstra's algorithm to find the shortest learning path weighted by estimated study hours

### Architecture

```
src/
├── components/         # React components
│   └── KnowledgeGraph.jsx
├── pages/             # Page components
│   ├── HomePage.jsx
│   └── SyllabusPage.jsx
├── services/          # API integrations
│   ├── arxivService.js
│   └── geminiService.js
└── utils/             # Algorithms and helpers
    ├── knowledgeGraphBuilder.js
    └── pathFinder.js
```

## API Limitations

- **Gemini API**: Rate limited based on your API key tier
- **ArXiv API**: Public API with fair use policy (max 1 request per 3 seconds recommended)

## Troubleshooting

### "Failed to search papers" Error

This error was caused by CORS (Cross-Origin Resource Sharing) restrictions when calling the ArXiv API directly from the browser. The fix involved:

1. **Proxy Configuration** (vite.config.js:8-20): Added a Vite proxy to route ArXiv requests through the dev server, bypassing CORS restrictions
2. **API URL Update** (src/services/arxivService.js:4-6): Changed to use the proxy endpoint `/api/arxiv` in development
3. **HTTPS Upgrade**: Updated proxy target from `http://` to `https://export.arxiv.org` to handle ArXiv's redirect

If you encounter this error:
- Ensure the dev server is running: `npm run dev`
- Check the browser console for detailed error messages
- Verify the proxy is configured correctly in `vite.config.js`

### Gemini API Errors

If you see errors related to the Gemini API:
- Verify your API key in `.env` is correct
- Check your API quota at https://makersuite.google.com
- Ensure your key has access to the `gemini-pro` model

### Dev Server Won't Start

If port 3000 is already in use:
```bash
# Find and kill the process using port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port by updating vite.config.js
```

## Future Enhancements

- [ ] Add support for PDF paper uploads
- [ ] Integrate more academic databases (IEEE, Springer, etc.)
- [ ] User accounts to save and track learning progress
- [ ] Community-contributed concept explanations
- [ ] Learning resource recommendations (courses, textbooks, videos)
- [ ] Multi-paper comparison view

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this project for educational purposes.

## Acknowledgments

- ArXiv for providing open access to research papers
- Google Gemini for powerful AI capabilities
- The open-source community for the amazing libraries used in this project
