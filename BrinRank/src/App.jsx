import React from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import HomePage from './pages/HomePage'
import SyllabusPage from './pages/SyllabusPage'
import './App.css'

function App() {
  return (
    <Router>
      <div className="App">
        <nav className="navbar">
          <div className="nav-container">
            <Link to="/" className="nav-logo">
              BrinRank
            </Link>
            <div className="nav-links">
              <Link to="/" className="nav-link">Knowledge Graph</Link>
              <Link to="/syllabus" className="nav-link">Generate Syllabus</Link>
            </div>
          </div>
        </nav>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/syllabus" element={<SyllabusPage />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
