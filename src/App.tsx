import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Login from './Login';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Pipelines from './components/Pipelines';
import PipelineRuns from './components/PipelineRuns';
import PipelineSchedules from './components/PipelineSchedules';
import Blocks from './components/Blocks';
import CreateEditTrigger from './components/CreateEditTrigger';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route index element={<Navigate to="/pipelines" replace />} />
            <Route path="pipelines" element={<Pipelines />} />
            <Route path="pipelines/:id/schedules" element={<PipelineSchedules />} />
            <Route path="pipelines/:id/schedules/create" element={<CreateEditTrigger />} />
            <Route path="pipelines/:scheduleId/runs/:name/:token/:status" element={<PipelineRuns />} />
            <Route path="pipelines/blocks" element={<Blocks />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/pipelines" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
