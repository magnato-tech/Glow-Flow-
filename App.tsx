import React, { useState, useEffect } from 'react';
import { ViewState, Task, Recipe } from './types';
import { generateRecipeData, generateRecipeImage } from './services/geminiService';
import { TaskCard } from './components/TaskCard';
import { RecipeCard } from './components/RecipeCard';
import { Button } from './components/Button';
import { CheckSquare, ChefHat, Heart, Plus, Search, Sparkles, AlertCircle, Stars, Check, BellRing, Sun, Moon, CalendarDays, Repeat } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

const App = () => {
  // --- State ---
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.TASKS);
  
  // Tasks State
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('dfs_tasks');
    return saved ? JSON.parse(saved) : [];
  });
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDate, setNewTaskDate] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceInterval, setRecurrenceInterval] = useState<'weekly' | 'biweekly'>('weekly');

  // Recipes State
  const [savedRecipes, setSavedRecipes] = useState<Recipe[]>(() => {
    const saved = localStorage.getItem('dfs_recipes');
    return saved ? JSON.parse(saved) : [];
  });
  const [generatedRecipe, setGeneratedRecipe] = useState<Recipe | null>(null);
  const [recipePrompt, setRecipePrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- Derived State ---
  const overdueTasksCount = tasks.filter(t => !t.completed && new Date(t.dueDate) < new Date()).length;
  const savedRecipesCount = savedRecipes.length;

  // Task filtering logic
  const getCategorizedTasks = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfterTomorrow = new Date(today);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

    const sortedTasks = [...tasks].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

    const todayTasks = sortedTasks.filter(t => {
      const d = new Date(t.dueDate);
      return d >= today && d < tomorrow;
    });

    const tomorrowTasks = sortedTasks.filter(t => {
      const d = new Date(t.dueDate);
      return d >= tomorrow && d < dayAfterTomorrow;
    });

    const laterTasks = sortedTasks.filter(t => {
      const d = new Date(t.dueDate);
      return d >= dayAfterTomorrow || d < today; 
    });

    return { todayTasks, tomorrowTasks, laterTasks };
  };

  const { todayTasks, tomorrowTasks, laterTasks } = getCategorizedTasks();

  // --- Effects ---
  useEffect(() => {
    localStorage.setItem('dfs_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('dfs_recipes', JSON.stringify(savedRecipes));
  }, [savedRecipes]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTasks(prev => [...prev]);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // --- Task Handlers ---
  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !newTaskDate) return;

    const task: Task = {
      id: uuidv4(),
      title: newTaskTitle,
      dueDate: newTaskDate,
      completed: false,
      createdAt: Date.now(),
      isRecurring,
      recurrenceInterval: isRecurring ? recurrenceInterval : undefined,
    };

    setTasks(prev => [task, ...prev].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()));
    setNewTaskTitle('');
    setNewTaskDate('');
    setIsRecurring(false);
  };

  const toggleTask = (id: string) => {
    setTasks(prev => {
      const newTasks = [...prev];
      const taskIndex = newTasks.findIndex(t => t.id === id);
      if (taskIndex === -1) return prev;

      const task = newTasks[taskIndex];
      const wasCompleted = task.completed;
      const isNowCompleted = !wasCompleted;

      newTasks[taskIndex] = { ...task, completed: isNowCompleted };

      if (isNowCompleted && task.isRecurring) {
        const currentDueDate = new Date(task.dueDate);
        const nextDueDate = new Date(currentDueDate);
        
        if (task.recurrenceInterval === 'weekly') {
          nextDueDate.setDate(nextDueDate.getDate() + 7);
        } else if (task.recurrenceInterval === 'biweekly') {
          nextDueDate.setDate(nextDueDate.getDate() + 14);
        }

        const exists = newTasks.some(t => 
          t.title === task.title && 
          new Date(t.dueDate).getTime() === nextDueDate.getTime() &&
          !t.completed
        );

        if (!exists) {
          const nextTask: Task = {
            ...task,
            id: uuidv4(),
            dueDate: nextDueDate.toISOString(),
            completed: false,
            createdAt: Date.now(),
          };
          newTasks.push(nextTask);
        }
      }

      return newTasks.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    });
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    setTasks(prev => {
      const newTasks = prev.map(t => t.id === id ? { ...t, ...updates } : t);
      return newTasks.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    });
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  // --- Recipe Handlers ---
  const handleGenerateRecipe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipePrompt.trim()) return;

    setIsGenerating(true);
    setError(null);
    setGeneratedRecipe(null);

    try {
      const data = await generateRecipeData(recipePrompt);
      const imagePromise = generateRecipeImage(data.title, data.description);
      const imageUrl = await imagePromise;

      const newRecipe: Recipe = {
        id: uuidv4(),
        ...data,
        imageUrl,
      };

      setGeneratedRecipe(newRecipe);
    } catch (err) {
      setError("Oida! Noe gikk galt i kjøkkenet. Prøv igjen? ✨");
    } finally {
      setIsGenerating(false);
    }
  };

  const saveRecipe = (recipe: Recipe) => {
    if (!savedRecipes.some(r => r.title === recipe.title)) {
      setSavedRecipes(prev => [recipe, ...prev]);
    }
  };

  const updateRecipe = (id: string, updates: Partial<Recipe>) => {
    setSavedRecipes(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const deleteRecipe = (id: string) => {
    setSavedRecipes(prev => prev.filter(r => r.id !== id));
  };

  // --- Views ---

  const renderTaskSection = (title: string, icon: React.ReactNode, taskList: Task[], colorClass: string) => (
    <div className="space-y-4">
      <div className={`flex items-center gap-2 px-2 ${colorClass}`}>
        {icon}
        <h3 className="text-xl font-bold">{title}</h3>
        <span className="text-xs bg-white/50 px-2 py-0.5 rounded-full border border-current opacity-70">
          {taskList.length}
        </span>
      </div>
      <div className="space-y-3">
        {taskList.length === 0 ? (
          <div className="text-center py-8 glass rounded-3xl border-2 border-dashed border-slate-200 text-slate-400 text-sm">
            Ingen oppgaver her ✨
          </div>
        ) : (
          taskList.map(task => (
            <TaskCard 
              key={task.id} 
              task={task} 
              onToggle={toggleTask} 
              onDelete={deleteTask} 
              onUpdate={updateTask}
            />
          ))
        )}
      </div>
    </div>
  );

  const renderTasksView = () => (
    <div className="max-w-2xl mx-auto space-y-10">
      <header className="mb-8 text-center sm:text-left animate-fade-in-up">
        <h2 className="text-4xl font-bold text-slate-800 mb-2">Mine Planer ✨</h2>
        <p className="text-slate-500 font-medium italic">Make today amazing, Queen!</p>
      </header>

      {overdueTasksCount > 0 && (
        <div className="bg-red-50 border border-red-100 rounded-3xl p-4 flex items-center gap-4 animate-pop shadow-sm">
          <div className="bg-red-400 p-2.5 rounded-2xl text-white animate-bounce shadow-md shadow-red-200">
            <BellRing className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="text-red-500 font-bold text-sm">Pst! Noe venter på deg...</p>
            <p className="text-red-400 text-xs">Du har {overdueTasksCount} {overdueTasksCount === 1 ? 'oppgave' : 'oppgaver'} som har forfalt. Ta en titt! ✨</p>
          </div>
        </div>
      )}

      <form onSubmit={addTask} className="glass p-6 rounded-4xl shadow-sm flex flex-col gap-4 border-2 border-pinky-100 animate-fade-in-up" style={{animationDelay: '0.1s'}}>
        <div className="flex flex-col sm:flex-row gap-3">
          <input 
            type="text" 
            placeholder="Hva står på agendaen?" 
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            className="flex-1 px-5 py-3 bg-white/50 border-none rounded-2xl focus:outline-none focus:ring-2 focus:ring-pinky-200 placeholder:text-slate-400"
          />
          <input 
            type="datetime-local" 
            value={newTaskDate}
            onChange={(e) => setNewTaskDate(e.target.value)}
            className="px-5 py-3 bg-white/50 border-none rounded-2xl focus:outline-none focus:ring-2 focus:ring-pinky-200 text-slate-500 font-medium"
          />
        </div>
        
        <div className="flex flex-wrap items-center gap-4 px-2">
          <label className="flex items-center gap-2 cursor-pointer group">
            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${isRecurring ? 'bg-lavender-400 border-lavender-400' : 'border-slate-300 group-hover:border-lavender-300'}`}>
              <input 
                type="checkbox" 
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="hidden"
              />
              {isRecurring && <Check className="w-3.5 h-3.5 text-white" />}
            </div>
            <span className={`text-sm font-medium ${isRecurring ? 'text-lavender-500' : 'text-slate-400'}`}>Gjenta oppgave?</span>
          </label>

          {isRecurring && (
            <div className="flex bg-lavender-50 p-1 rounded-xl border border-lavender-100 animate-pop">
              <button 
                type="button"
                onClick={() => setRecurrenceInterval('weekly')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${recurrenceInterval === 'weekly' ? 'bg-white text-lavender-500 shadow-sm' : 'text-lavender-300 hover:text-lavender-400'}`}
              >
                Hver uke
              </button>
              <button 
                type="button"
                onClick={() => setRecurrenceInterval('biweekly')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${recurrenceInterval === 'biweekly' ? 'bg-white text-lavender-500 shadow-sm' : 'text-lavender-300 hover:text-lavender-400'}`}
              >
                Hver 2. uke
              </button>
            </div>
          )}
        </div>

        <Button variant="gradient" type="submit" disabled={!newTaskTitle || !newTaskDate} className="w-full sm:w-auto self-end">
          <Plus className="w-5 h-5 mr-1" /> Legg til
        </Button>
      </form>

      <div className="space-y-12 staggered-entry">
        {tasks.length === 0 ? (
          <div className="text-center py-16 text-slate-400 glass rounded-4xl animate-pop">
            <Stars className="w-12 h-12 mx-auto mb-4 text-pinky-200 animate-float" />
            <p className="font-medium">Ingen planer akkurat nå...</p>
            <p className="text-sm">Slapp av og nyt dagen! 🎀</p>
          </div>
        ) : (
          <>
            {renderTaskSection("I dag ✨", <Sun className="w-6 h-6" />, todayTasks, "text-pinky-400")}
            {renderTaskSection("I morgen 🌙", <Moon className="w-6 h-6" />, tomorrowTasks, "text-lavender-400")}
            {laterTasks.length > 0 && renderTaskSection("Senere ☁️", <CalendarDays className="w-6 h-6" />, laterTasks, "text-slate-400")}
          </>
        )}
      </div>
    </div>
  );

  const renderRecipesView = () => (
    <div className="max-w-5xl mx-auto space-y-10">
       <header className="mb-8 text-center sm:text-left animate-fade-in-up">
        <h2 className="text-4xl font-bold text-slate-800 mb-2">Treat Yourself 🍰</h2>
        <p className="text-slate-500 font-medium italic">Hva har du lyst til å lage i dag?</p>
      </header>

      <div className="bg-gradient-to-br from-pinky-200 to-lavender-200 rounded-4xl p-8 sm:p-12 text-white shadow-xl relative overflow-hidden group animate-fade-in-up" style={{animationDelay: '0.1s'}}>
        <div className="absolute top-0 right-0 p-4 opacity-20 transform rotate-12 group-hover:rotate-45 transition-transform duration-700">
           <Sparkles className="w-32 h-32" />
        </div>
        <form onSubmit={handleGenerateRecipe} className="max-w-2xl mx-auto space-y-6 relative z-10 text-center">
          <div className="relative">
            <input 
              type="text" 
              value={recipePrompt}
              onChange={(e) => setRecipePrompt(e.target.value)}
              placeholder="F.eks. 'Super-tasty smoothie bowl' eller 'Pasta-party'"
              className="w-full px-7 py-5 pl-14 rounded-3xl text-slate-800 placeholder:text-slate-400 shadow-2xl focus:outline-none border-none text-lg"
            />
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-pinky-300 w-6 h-6" />
          </div>
          <Button 
            type="submit" 
            variant="secondary"
            isLoading={isGenerating} 
            disabled={!recipePrompt.trim()} 
            className="px-10 py-4 bg-white text-pinky-500 hover:text-white hover:bg-pinky-500 border-none font-black text-lg tracking-wide rounded-full"
          >
            <Sparkles className="w-5 h-5 mr-2" />
            VIS MEG MAGI!
          </Button>
        </form>
      </div>

      {error && (
        <div className="bg-red-50/80 backdrop-blur border border-red-100 text-red-500 px-6 py-4 rounded-3xl flex items-center gap-3 font-medium animate-pop">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {generatedRecipe && (
        <div className="space-y-6 animate-fade-in-up">
          <div className="flex items-center gap-2">
            <h3 className="text-2xl font-bold text-slate-700">Dagens inspo ✨</h3>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <RecipeCard 
                recipe={generatedRecipe} 
                onSave={saveRecipe} 
                isSaved={savedRecipes.some(r => r.title === generatedRecipe.title)}
              />
            </div>
             <div className="glass rounded-4xl p-8 flex flex-col justify-center items-center text-center space-y-6 border-2 border-dashed border-pinky-200">
                <div className="bg-pinky-100 p-5 rounded-full transition-transform hover:scale-110">
                  <Heart className={`w-10 h-10 ${savedRecipes.some(r => r.title === generatedRecipe.title) ? 'fill-pinky-400 text-pinky-400 animate-pop' : 'text-pinky-300'}`} />
                </div>
                <h4 className="text-xl font-bold text-slate-700">Vibes?</h4>
                <p className="text-slate-500 text-sm italic">Lagre denne i favorittene dine så du finner den igjen senere!</p>
                <Button 
                  onClick={() => saveRecipe(generatedRecipe)} 
                  variant={savedRecipes.some(r => r.title === generatedRecipe.title) ? "secondary" : "gradient"} 
                  disabled={savedRecipes.some(r => r.title === generatedRecipe.title)}
                  className="w-full relative overflow-hidden"
                >
                  {savedRecipes.some(r => r.title === generatedRecipe.title) ? (
                    <span className="flex items-center gap-2"><Check className="w-4 h-4" /> Lagret!</span>
                  ) : 'LAGRE ✨'}
                </Button>
             </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderFavoritesView = () => (
    <div className="max-w-6xl mx-auto space-y-10">
      <header className="mb-8 text-center sm:text-left animate-fade-in-up">
        <h2 className="text-4xl font-bold text-slate-800 mb-2">Favoritter ❤️</h2>
        <p className="text-slate-500 font-medium italic">Din personlige samling av alt som er godt.</p>
      </header>

      {savedRecipes.length === 0 ? (
        <div className="text-center py-24 glass rounded-4xl border-2 border-dashed border-pinky-100 animate-pop">
          <Heart className="w-20 h-20 mx-auto mb-6 text-pinky-100" />
          <h3 className="text-2xl font-bold text-slate-600 mb-2">Tomt her ennå...</h3>
          <p className="text-slate-400 mb-8 max-w-xs mx-auto">Begynn å utforske og finn dine nye favoritter! ✨</p>
          <Button variant="gradient" onClick={() => setCurrentView(ViewState.RECIPES)}>
            Finn inspirasjon
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 staggered-entry">
          {savedRecipes.map(recipe => (
            <RecipeCard 
              key={recipe.id} 
              recipe={recipe} 
              onDelete={deleteRecipe} 
              onUpdate={updateRecipe}
            />
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="flex h-screen text-slate-800 overflow-hidden font-sans">
      
      <nav className="fixed bottom-0 w-full glass border-t border-pinky-100 z-50 sm:relative sm:w-72 sm:h-full sm:border-t-0 sm:border-r sm:flex sm:flex-col justify-between">
        <div className="p-10 hidden sm:block text-center">
          <h1 className="text-3xl font-black gradient-text tracking-tighter italic">
            GLOW & FLOW
          </h1>
          <div className="mt-1 h-1 w-12 bg-pinky-200 mx-auto rounded-full"></div>
        </div>

        <div className="flex justify-around sm:flex-col sm:justify-start sm:px-6 sm:gap-4 h-20 sm:h-auto items-center sm:items-stretch">
          <button 
            onClick={() => setCurrentView(ViewState.TASKS)}
            className={`p-4 rounded-3xl flex flex-col sm:flex-row items-center gap-3 transition-all ${currentView === ViewState.TASKS ? 'bg-pinky-100 text-pinky-500 shadow-inner' : 'text-slate-400 hover:text-pinky-300'}`}
          >
            <div className="relative">
              <CheckSquare className="w-6 h-6 sm:w-5 sm:h-5" />
              {overdueTasksCount > 0 && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-400 rounded-full border-2 border-white sm:w-2 sm:h-2"></span>
              )}
            </div>
            <span className="text-[10px] sm:text-base font-bold">Planer</span>
          </button>
          
          <button 
            onClick={() => setCurrentView(ViewState.RECIPES)}
            className={`p-4 rounded-3xl flex flex-col sm:flex-row items-center gap-3 transition-all ${currentView === ViewState.RECIPES ? 'bg-pinky-100 text-pinky-500 shadow-inner' : 'text-slate-400 hover:text-pinky-300'}`}
          >
            <div className="relative">
              <ChefHat className="w-6 h-6 sm:w-5 sm:h-5" />
              {savedRecipesCount > 0 && (
                <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[16px] h-4 bg-lavender-400 text-white text-[9px] font-bold rounded-full px-1 border-2 border-white animate-pop">
                  {savedRecipesCount}
                </span>
              )}
            </div>
            <span className="text-[10px] sm:text-base font-bold">Inspo</span>
          </button>

          <button 
            onClick={() => setCurrentView(ViewState.FAVORITES)}
            className={`p-4 rounded-3xl flex flex-col sm:flex-row items-center gap-3 transition-all ${currentView === ViewState.FAVORITES ? 'bg-pinky-100 text-pinky-500 shadow-inner' : 'text-slate-400 hover:text-pinky-300'}`}
          >
            <div className="relative">
              <Heart className="w-6 h-6 sm:w-5 sm:h-5" />
              {savedRecipesCount > 0 && (
                <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[16px] h-4 bg-pinky-400 text-white text-[9px] font-bold rounded-full px-1 border-2 border-white animate-pop">
                  {savedRecipesCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] sm:text-base font-bold">Loves</span>
              {savedRecipesCount > 0 && (
                <span className="text-[10px] sm:text-xs bg-pinky-200 text-pinky-500 px-1.5 py-0.5 rounded-full font-black animate-pop">
                  {savedRecipesCount}
                </span>
              )}
            </div>
          </button>
        </div>

        <div className="p-6 hidden sm:block">
          <div className="bg-white/40 border border-pinky-50 rounded-3xl p-5 text-xs text-pinky-400 shadow-sm animate-pulse-soft">
            <p className="font-bold mb-2 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Daily Reminder:
            </p>
            <p className="italic leading-relaxed">Du er fantastisk akkurat som du er! Husk å drikke vann og være snill mot deg selv. 💖</p>
          </div>
        </div>
      </nav>

      <main className="flex-1 h-full overflow-y-auto overflow-x-hidden p-6 sm:p-12 pb-32 sm:pb-12 scroll-smooth">
        {currentView === ViewState.TASKS && renderTasksView()}
        {currentView === ViewState.RECIPES && renderRecipesView()}
        {currentView === ViewState.FAVORITES && renderFavoritesView()}
      </main>

    </div>
  );
};

export default App;