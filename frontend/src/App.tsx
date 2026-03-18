import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import HRPanel from './pages/HRPanel';
import EmployeeForm from './pages/EmployeeForm';
import EmployeeProfile from './pages/EmployeeProfile';
import EvaluateEmployee from './pages/EvaluateEmployee';
import EvaluateList from './pages/EvaluateList';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login/>}/>
        <Route path="/dashboard" element={<Dashboard/>}/>
        <Route path="/employees" element={<Employees/>}/>
        <Route path="/hr" element={<HRPanel/>}/>
        <Route path="/hr/edit/:id" element={<EmployeeForm />}/>
        <Route path="/hr/profile/:id" element={<EmployeeProfile/>}/>
        <Route path="/hr/evaluate/:id" element={<EvaluateEmployee/>}/>
        <Route path="/hr/evaluate" element={<EvaluateList/>}/>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;