import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';  // Add Routes import
import Timeline from './components/timeline/Timeline';
import Replayline from './components/replayline/Replayline';
import EditTimeEvent from './components/timeline/EditTimeEvent';
import EditReplayEvent from './components/replayline/EditReplayEvent';
import OldOrNewGame from './components/oon/OldOrNewGame';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/timeline" />} />
        <Route path="/timeline" element={<Timeline />} />
        <Route path="/replayline" element={<Replayline />} />
        <Route path="/edit_time/:id" element={<EditTimeEvent />} />
        <Route path="/edit_replay/:id" element={<EditReplayEvent />} />
        <Route path="/oldornew" element={<OldOrNewGame />} />
      </Routes>
    </Router>
  );
}

export default App;