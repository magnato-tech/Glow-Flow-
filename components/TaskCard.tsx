import React, { useState } from 'react';
import { Task } from '../types';
import { CheckCircle, Circle, Trash2, Calendar, Sparkles, AlertCircle, Repeat, Edit3, X, Save } from 'lucide-react';
import { Button } from './Button';

interface TaskCardProps {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdate?: (id: string, updates: Partial<Task>) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onToggle, onDelete, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDate, setEditDate] = useState(task.dueDate);

  const isOverdue = !task.completed && new Date(task.dueDate) < new Date();
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('no-NO', { 
      day: 'numeric', 
      month: 'short', 
      hour: '2-digit', 
      minute: '2-digit' 
    }).format(date);
  };

  const handleUpdate = () => {
    if (onUpdate && editTitle.trim()) {
      onUpdate(task.id, {
        title: editTitle,
        dueDate: editDate
      });
      setIsEditing(false);
    }
  };

  return (
    <div className={`group glass relative flex items-center justify-between p-5 rounded-3xl transition-all hover:-translate-y-1 overflow-hidden
      ${task.completed 
        ? 'opacity-60 bg-mint-100/50 border-mint-200' 
        : isOverdue 
          ? 'border-red-200 shadow-lg shadow-red-100/50 bg-red-50/30' 
          : 'border-pinky-100 shadow-sm'
      }`}
    >
      {/* Edit Overlay */}
      {isEditing && (
        <div className="absolute inset-0 z-20 glass backdrop-blur-xl p-4 flex flex-col gap-3 animate-pop">
          <div className="flex justify-between items-center">
            <span className="text-[10px] uppercase font-black text-pinky-400 tracking-widest">Rediger oppgave</span>
            <button onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-pinky-400">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex flex-col gap-2">
            <input 
              type="text" 
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-pinky-100 focus:outline-none focus:ring-2 focus:ring-pinky-200 text-sm font-medium"
            />
            <input 
              type="datetime-local" 
              value={editDate}
              onChange={(e) => setEditDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-pinky-100 focus:outline-none focus:ring-2 focus:ring-pinky-200 text-xs text-slate-500"
            />
          </div>
          <Button variant="gradient" className="py-1.5 text-xs h-9" onClick={handleUpdate}>
            <Save className="w-3.5 h-3.5 mr-1.5" /> Lagre
          </Button>
        </div>
      )}

      <div className="flex items-start gap-4 flex-1">
        <button 
          onClick={() => onToggle(task.id)}
          className="mt-0.5 transition-transform active:scale-125"
        >
          {task.completed ? (
            <div className="bg-white rounded-full p-1 shadow-inner">
               <CheckCircle className="w-6 h-6 text-pinky-400 fill-pinky-50" />
            </div>
          ) : (
            <div className={`bg-white rounded-full p-1 shadow-sm border ${isOverdue ? 'border-red-200' : 'border-pinky-100'}`}>
               <Circle className={`w-6 h-6 ${isOverdue ? 'text-red-300' : 'text-pinky-200'}`} />
            </div>
          )}
        </button>
        
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className={`text-lg font-medium text-slate-700 ${task.completed ? 'line-through text-slate-400' : ''}`}>
              {task.title} 
            </span>
            {task.isRecurring && <Repeat className="w-4 h-4 text-lavender-400" title={`Gjentas ${task.recurrenceInterval === 'weekly' ? 'hver uke' : 'hver 2. uke'}`} />}
            {task.completed && <Sparkles className="w-4 h-4 text-pinky-300" />}
            {isOverdue && !task.completed && (
              <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-red-400 bg-red-100 px-2 py-0.5 rounded-full animate-pulse">
                <AlertCircle className="w-3 h-3" /> Forfalt
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full transition-colors 
              ${isOverdue && !task.completed 
                ? 'bg-red-100 text-red-500 font-bold' 
                : 'bg-lavender-100 text-lavender-500'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              {formatDate(task.dueDate)}
            </span>
            {task.isRecurring && !task.completed && (
              <span className="bg-lavender-50 text-lavender-400 px-2 py-1 rounded-full text-[10px] font-bold uppercase">
                {task.recurrenceInterval === 'weekly' ? 'Hver uke' : 'Hver 2. uke'}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button 
          onClick={() => setIsEditing(true)}
          className="text-pinky-200 hover:text-lavender-400 transition-colors p-2 opacity-0 group-hover:opacity-100"
          aria-label="Rediger oppgave"
        >
          <Edit3 className="w-5 h-5" />
        </button>
        <button 
          onClick={() => onDelete(task.id)}
          className="text-pinky-200 hover:text-red-400 transition-colors p-2 opacity-0 group-hover:opacity-100"
          aria-label="Slett oppgave"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};