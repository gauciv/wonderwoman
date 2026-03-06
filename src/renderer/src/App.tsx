import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

function App(): JSX.Element {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<div className="flex items-center justify-center h-screen bg-navy-950 text-white text-2xl font-bold">Login Page Coming Soon</div>} />
        <Route path="/dashboard/*" element={<div className="flex items-center justify-center h-screen bg-gray-100 text-gray-800 text-2xl font-bold">Dashboard Coming Soon</div>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
