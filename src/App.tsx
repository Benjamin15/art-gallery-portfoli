import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { GalleryPage } from '@/pages/GalleryPage'
import { AdminPage } from '@/pages/AdminPage'
import { Toaster } from '@/components/ui/sonner'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<GalleryPage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
      <Toaster />
    </Router>
  )
}

export default App