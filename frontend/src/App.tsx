import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { LiveMeeting } from './components/meeting/LiveMeeting'
import { PostMeetingReport } from './components/report/PostMeetingReport'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LiveMeeting />} />
        <Route path="/reports/:meetingId" element={<PostMeetingReport />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
