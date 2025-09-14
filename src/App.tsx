import React from 'react'
import { HashRouter as Router, Routes, Route } from 'react-router-dom'
import { GalleryPage } from '@/pages/GalleryPage'
import { Toaster } from '@/components/ui/sonner'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<GalleryPage />} />
  {/* Admin retiré */}
      </Routes>
      <Toaster />
    </Router>
  )
}

export default App