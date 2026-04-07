import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import WikiPage from './pages/WikiPage'
import LogPage from './pages/LogPage'
import IngestPage from './pages/IngestPage'
import LintPage from './pages/LintPage'
import QueryPage from './pages/QueryPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="wiki/:slug" element={<WikiPage />} />
          <Route path="log" element={<LogPage />} />
          <Route path="ingest" element={<IngestPage />} />
          <Route path="lint" element={<LintPage />} />
          <Route path="query" element={<QueryPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
