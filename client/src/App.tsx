
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Inbox } from './pages/Inbox';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Inbox />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
