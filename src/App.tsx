import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { HeaderProvider } from './contexts/HeaderContext';
import { UserProvider } from './contexts/UserContext';
import Login from './Login';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Pipelines from './components/Pipelines';
import PipelineRuns from './components/PipelineRuns';
import PipelineSchedules from './components/PipelineSchedules';
import Blocks from './components/Blocks';
import CreateEditTrigger from './components/CreateEditTrigger';
import Dashboard from './components/Dashboard';
import { App as AntApp } from 'antd';

function App() {
  return (
    <AntApp>
      <Router>
        <UserProvider>
          <HeaderProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<ProtectedRoute />}>
                <Route element={<Layout />}>
                  <Route index element={<Navigate to="/dashboard" replace />} />
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="pipelines" element={<Pipelines />} />
                  <Route path="pipelines/:id/schedules" element={<PipelineSchedules />} />
                  <Route path="pipelines/:id/schedules/create" element={<CreateEditTrigger />} />
                  <Route path="pipelines/:id/schedules/edit/:scheduleId" element={<CreateEditTrigger />} />
                  <Route path="pipelines/:id/runs/:scheduleId/:name/:token/:status" element={<PipelineRuns />} />
                  <Route path="pipelines/blocks" element={<Blocks />} />
                </Route>
              </Route>
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </HeaderProvider>
        </UserProvider>
      </Router>
    </AntApp>
  );
}

export default App;
