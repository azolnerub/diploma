import { useState } from 'react';
import { UserPlus, Settings, Target,  Users, ArrowRight} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import EmployeeForm from './EmployeeForm';
import IdealProfiles from './RoleBuilder';
import PositionCompetencies from './PositionCompetencies';

type TabType = 'create' | 'ideal' | 'position_comp';

export default function HRPanel() {
  const [activeTab, setActiveTab] = useState<TabType>('create');
  const navigate = useNavigate();

  const tabs = [
    { id: 'create', label: 'Добавить сотрудника', icon: UserPlus },
    { id: 'position_comp', label: 'Компетенции должностей', icon: Settings },
    { id: 'ideal', label: 'Идеальные профили', icon: Target },
  ] as const;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20 selection:bg-indigo-100">
      <div className="max-w-7xl mx-auto p-6 md:p-10">
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-12">
          <div className="space-y-2">
            <h1 className="text-5xl font-black text-slate-900 tracking-tight">
              Панель <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">управления HR</span>
            </h1>
            <p className="text-slate-500 text-lg font-medium">
              Конфигурация штата, матрицы компетенций и стандартов эффективности.
            </p>
          </div>
          
          <button
            onClick={() => navigate('/employees')}
            className="group flex items-center gap-3 bg-white border border-slate-200 text-slate-700 px-8 py-4 rounded-[1.5rem] font-bold shadow-sm hover:shadow-md hover:border-indigo-200 transition-all active:scale-[0.98]"
          >
            <Users size={20} className="text-slate-400 group-hover:text-indigo-600 transition-colors" />
            Список сотрудников
            <ArrowRight size={18} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        <div className="flex justify-center mb-10">
          <div className="inline-flex p-2 bg-slate-200/40 backdrop-blur-xl rounded-[2rem] border border-white/50 shadow-inner">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-3 px-8 py-4 rounded-[1.5rem] text-sm font-black transition-all duration-300
                    ${isActive 
                      ? 'bg-white text-indigo-600 shadow-xl shadow-indigo-500/10 scale-100' 
                      : 'text-slate-500 hover:text-slate-900 hover:bg-white/50 scale-95 opacity-70'
                    }
                  `}
                >
                  <Icon size={18} className={isActive ? 'text-indigo-600' : 'text-slate-400'} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-[3rem] blur opacity-[0.03] group-hover:opacity-[0.06] transition duration-1000"></div>
          
          <div className="relative bg-white rounded-[3rem] border border-slate-100 shadow-2xl shadow-slate-200/50 p-8 md:p-16">
            <div className="max-w-4xl mx-auto">
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                {activeTab === 'create' && <EmployeeForm />}
                {activeTab === 'position_comp' && <PositionCompetencies />}
                {activeTab === 'ideal' && <IdealProfiles />}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
