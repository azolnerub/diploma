import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import HRPanel from './pages/HRPanel';
import EmployeeForm from './pages/EmployeeForm';
import EvaluateEmployee from './pages/EvaluateEmployee';
import EvaluateList from './pages/EvaluateList';
import Reserve from './pages/Reserve';
import RoleMatch from './pages/RoleMatch';
import RoleBuilder from './pages/RoleBuilder';
import ReservePositionCandidates from './pages/ReservePositionCandidates';
import ReservePositionsList from './pages/ReservePositionsList';
import UserProfile from './pages/UserProfile';
import ChangePassword from './pages/ChangePassword';
import { ProtectedRoute } from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        {/* Авторизация */}
        <Route path="/login" element={<Login/>}/>
        {/* Общие страницы - профиль и смена пароля*/}
        <Route path="/profile" element={<ProtectedRoute><UserProfile/></ProtectedRoute>}/>
        <Route path="/profile/change-password" element={<ProtectedRoute><ChangePassword/></ProtectedRoute>}/>
        {/* Страницы для HR и Руководителя - панель управления, список сотрудников, резерв, анализ соответствия, список вакансий, список кандидатов*/}
        <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['hr', 'manager', 'director']}><Dashboard/></ProtectedRoute>}/>
        <Route path="/employees" element={<ProtectedRoute allowedRoles={['hr', 'manager', 'director']}><Employees/></ProtectedRoute>}/>
        <Route path="/reserve" element={<ProtectedRoute allowedRoles={['hr', 'manager', 'director']}><Reserve/></ProtectedRoute>}/>
        <Route path="/reserve/match/role/:employee_id/:role_id" element={<ProtectedRoute allowedRoles={['hr', 'manager', 'director']}><RoleMatch/></ProtectedRoute>}/>
        <Route path="/reserve/positions" element={<ProtectedRoute allowedRoles={['hr', 'manager', 'director']}><ReservePositionsList/></ProtectedRoute>}/>
        <Route path="/reserve/position/:position_id" element={<ProtectedRoute allowedRoles={['hr', 'manager', 'director']}><ReservePositionCandidates/></ProtectedRoute>}/>
        {/* Страницы для HR - HR-панель, редактирование сотрудника, создание ролей, создание идеальных профилей*/}
        <Route path="/hr" element={<ProtectedRoute allowedRoles={['hr']}><HRPanel/></ProtectedRoute>}/>
        <Route path="/hr/edit/:id" element={<ProtectedRoute allowedRoles={['hr']}><EmployeeForm/></ProtectedRoute>}/>
        <Route path="/hr/roles" element={<ProtectedRoute allowedRoles={['hr']}><RoleBuilder/></ProtectedRoute>}/>
        {/* Страницы для Руководителя и Директора - список сотрудников на оценку, оценка сотрудников*/}
        <Route path="/evaluate" element={<ProtectedRoute allowedRoles={['manager', 'director']}><EvaluateList/></ProtectedRoute>}/>
        <Route path="/evaluate/:id" element={<ProtectedRoute allowedRoles={['manager', 'director']}><EvaluateEmployee/></ProtectedRoute>}/>
        {/* Редирект с главной */}
        <Route path="/" element={<Navigate to="/profile" replace/>}/>
        {/* Обработка несуществующих страниц */}
        <Route path="*" element={<Navigate to="/login" replace/>}/>
      </Routes>
    </Router>
  );
}

export default App;
