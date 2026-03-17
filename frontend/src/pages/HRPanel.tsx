import { useState } from 'react';
import Employees from './Employees';
import EmployeeForm from './EmployeeForm';
import IdealProfiles from './IdealProfiles';

export default function HRPanel() {
  const [activeTab, setActiveTab] = useState<'list' | 'create' | 'ideal'>('list');

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-4xl font-bold text-indigo-800 mb-8">Панель HR-специалиста</h1>

      <div className="flex border-b mb-8">
        <button onClick={() => setActiveTab('list')} className={`px-8 py-4 font-medium ${activeTab === 'list' ? 'border-b-4 border-indigo-600 text-indigo-700' : 'text-gray-600'}`}>
          Список сотрудников
        </button>
        <button onClick={() => setActiveTab('create')} className={`px-8 py-4 font-medium ${activeTab === 'create' ? 'border-b-4 border-indigo-600 text-indigo-700' : 'text-gray-600'}`}>
          Добавить сотрудника
        </button>
        <button onClick={() => setActiveTab('ideal')} className={`px-8 py-4 font-medium ${activeTab === 'ideal' ? 'border-b-4 border-indigo-600 text-indigo-700' : 'text-gray-600'}`}>
          Идеальные профили
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-xl p-8 min-h-[600px]">
        {activeTab === 'list' && <Employees />}
        {activeTab === 'create' && <EmployeeForm />}
        {activeTab === 'ideal' && <IdealProfiles />}
      </div>
    </div>
  );
}