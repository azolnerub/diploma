import { useState } from 'react';
import EmployeeForm from './EmployeeForm';
import { useAuth } from '../hooks/useAuth';
import IdealProfiles from './IdealProfiles';
import { useNavigate } from 'react-router-dom';

export default function HRPanel() {
  const [activeTab, setActiveTab] = useState<'create' | 'ideal'>('create');
  useAuth(); 
  const navigate = useNavigate();

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-screen bg-gray-50/50">
      {/* Шапка с кнопкой назад */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
            Панель управления <span className="text-indigo-600">HR</span>
          </h1>
          <p className="text-slate-500 mt-2">Управление штатом и квалификацией сотрудников</p>
        </div>
        
        <button
          onClick={() => navigate('/employees')}
          className="flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 px-6 py-3 rounded-2xl font-bold shadow-sm hover:bg-slate-50 hover:border-indigo-200 transition-all active:scale-95"
        >
          <span>👤</span> Перейти к списку сотрудников
        </button>
      </div>

      {/* Переключатель вкладок в стиле "Pills" */}
      <div className="inline-flex p-1.5 bg-slate-200/50 rounded-2xl mb-8 backdrop-blur-sm">
        <button 
          onClick={() => setActiveTab('create')} 
          className={`px-8 py-3 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'create' 
            ? 'bg-white text-indigo-600 shadow-md' 
            : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          ➕ Добавить сотрудника
        </button>
        <button 
          onClick={() => setActiveTab('ideal')} 
          className={`px-8 py-3 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'ideal' 
            ? 'bg-white text-indigo-600 shadow-md' 
            : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          🎯 Идеальные профили
        </button>
      </div>

      {/* Основной контент */}
      <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/60 p-10 border border-slate-100 ring-1 ring-slate-900/5">
        <div className="max-w-4xl mx-auto">
           {activeTab === 'create' && <EmployeeForm/>}
           {activeTab === 'ideal' && <IdealProfiles/>}
        </div>
      </div>
    </div>
  );
}