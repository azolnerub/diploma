import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import HRPanel from './pages/HRPanel';
import EmployeeForm from './pages/EmployeeForm';
import EvaluateEmployee from './pages/EvaluateEmployee';
import EvaluateList from './pages/EvaluateList';
import Reserve from './pages/Reserve';
import PositionMatch from './pages/PositionMatch';
import RoleMatch from './pages/RoleMatch';
import RoleBuilder from './pages/RoleBuilder';
import ReservePositionCandidates from './pages/ReservePositionCandidates';
import ReservePositionsList from './pages/ReservePositionsList';
import UserProfile from './pages/UserProfile';
import ChangePassword from './pages/ChangePassword';


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login/>}/>
        <Route path="/profile" element={<UserProfile/>}/>
        <Route path="/change-password" element={<ChangePassword/>}/>
        <Route path="/dashboard" element={<Dashboard/>}/>
        <Route path="/" element={<Navigate to="/profile" replace/>}/>
        <Route path="/employees" element={<Employees/>}/>
        <Route path="/hr" element={<HRPanel/>}/>
        <Route path="/hr/edit/:id" element={<EmployeeForm/>}/>
        <Route path="/hr/evaluate/:id" element={<EvaluateEmployee/>}/>
        <Route path="/hr/evaluate" element={<EvaluateList/>}/>
        <Route path="/reserve" element={<Reserve/>}/>
        <Route path="/hr/match/role/:employee_id/:role_id" element={<RoleMatch/>}/>
        <Route path="/hr/match/:employee_id/:position_id" element={<PositionMatch/>}/>
        <Route path="/hr/roles" element={<RoleBuilder/>}/>
        <Route path="/hr/reserve/positions" element={<ReservePositionsList/>}/>
        <Route path="/hr/reserve/position/:position_id" element={<ReservePositionCandidates/>}/>
        <Route path="*" element={<Navigate to="/login" replace/>}/>
      </Routes>
    </Router>
  );
}

export default App;
