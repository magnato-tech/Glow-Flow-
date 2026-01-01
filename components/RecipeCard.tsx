import React, { useState } from 'react';
import { Recipe } from '../types';
import { Clock, Heart, Trash2, ChevronDown, Sparkles, Check, Share2, Edit3, X, Save } from 'lucide-react';
import { Button } from './Button';

interface RecipeCardProps {
  recipe: Recipe;
  onSave?: (recipe: Recipe) => void;
  onDelete?: (id: string) => void;
  onUpdate?: (id: string, updates: Partial<Recipe>) => void;
  isSaved?: boolean;
}

export const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, onSave, onDelete, onUpdate, isSaved }) => {
  const [showToast, setShowToast] = useState<{ active: boolean; message: string }>({ active: false, message: '' });
  const [isAnimating, setIsAnimating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Edit Form State
  const [editTitle, setEditTitle] = useState(recipe.title);
  const [editDesc, setEditDesc] = useState(recipe.description);
  const [editNotes, setEditNotes] = useState(recipe.notes || '');

  const triggerToast = (message: string) => {
    setShowToast({ active: true, message });
    setTimeout(() => setShowToast({ active: false, message: '' }), 2000);
  };

  const handleSave = () => {
    if (onSave && !isSaved) {
      setIsAnimating(true);
      onSave(recipe);
      triggerToast('Lagret! ✨');
      setTimeout(() => setIsAnimating(false), 600);
    }
  };

  const handleUpdate = () => {
    if (onUpdate) {
      onUpdate(recipe.id, {
        title: editTitle,
        description: editDesc,
        notes: editNotes
      });
      setIsEditing(false);
      triggerToast('Oppdatert! 💖');
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: `Glow & Flow: ${recipe.title} ✨`,
      text: `Sjekk ut denne deilige oppskriften: ${recipe.title}. ${recipe.description} - Laget med Glow & Flow!`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error('Feil ved deling:', err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(`${shareData.title}\n${shareData.text}\n${shareData.url}`);
        triggerToast('Kopiert! 🔗');
      } catch (err) {
        triggerToast('Kunne ikke kopiere 💔');
      }
    }
  };

  return (
    <div className="glass rounded-4xl overflow-hidden shadow-sm flex flex-col h-full transition-all hover:scale-[1.01] hover:shadow-md animate-fade-in-up relative">
      {/* Toast Overlay */}
      {showToast.active && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-mint-500/90 text-white px-6 py-3 rounded-full flex items-center gap-2 shadow-xl animate-pop pointer-events-none text-center">
          <Check className="w-5 h-5" />
          <span className="font-bold">{showToast.message}</span>
        </div>
      )}

      {/* Edit Modal Overlay */}
      {isEditing && (
        <div className="absolute inset-0 z-40 glass backdrop-blur-xl p-6 flex flex-col animate-pop">
          <div className="flex justify-between items-center mb-6">
            <h4 className="text-xl font-black text-pinky-400 flex items-center gap-2">
              <Sparkles className="w-5 h-5" /> Personlig vri
            </h4>
            <button onClick={() => setIsEditing(false)} className="p-2 text-slate-400 hover:text-pinky-400 transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <div className="flex-1 space-y-4 overflow-y-auto pr-1">
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-black text-slate-400 tracking-widest ml-1">Navn</label>
              <input 
                type="text" 
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl border-2 border-pinky-50 focus:border-pinky-200 focus:outline-none transition-colors text-slate-700 font-bold"
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-black text-slate-400 tracking-widest ml-1">Beskrivelse</label>
              <textarea 
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                rows={2}
                className="w-full px-4 py-2.5 rounded-2xl border-2 border-pinky-50 focus:border-pinky-200 focus:outline-none transition-colors text-slate-600 text-sm italic resize-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-black text-slate-400 tracking-widest ml-1">Egne kommentarer & tips</label>
              <textarea 
                placeholder="Legg til dine egne anbefalinger her... f.eks 'Ekstra god med chili!'"
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                rows={4}
                className="w-full px-4 py-2.5 rounded-2xl border-2 border-lavender-100 focus:border-lavender-200 focus:outline-none transition-colors text-slate-600 text-sm resize-none"
              />
            </div>
          </div>

          <div className="pt-4 mt-auto">
            <Button variant="gradient" className="w-full" onClick={handleUpdate}>
              <Save className="w-4 h-4 mr-2" /> Lagre endringer
            </Button>
          </div>
        </div>
      )}

      <div className="relative h-56 sm:h-72 bg-pinky-50 w-full overflow-hidden">
        {recipe.imageUrl ? (
          <img 
            src={recipe.imageUrl} 
            alt={recipe.title} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-pinky-300 gap-2">
             <Sparkles className="w-8 h-8 animate-pulse-soft" />
             <span className="text-sm font-medium">Lager magi...</span>
          </div>
        )}
        <div className="absolute top-4 right-4 flex gap-2">
           <button 
             onClick={handleShare}
             className="p-3 bg-white/80 backdrop-blur-md rounded-full text-lavender-500 shadow-sm hover:bg-lavender-50 transition-all hover:scale-110 active:scale-90"
             title="Del oppskrift"
           >
              <Share2 className="w-5 h-5" />
           </button>

           {onDelete ? (
             <>
               <button 
                 onClick={() => setIsEditing(true)} 
                 className="p-3 bg-white/80 backdrop-blur-md rounded-full text-pinky-400 shadow-sm hover:bg-pinky-50 transition-all hover:scale-110 active:scale-90" 
                 title="Rediger"
               >
                  <Edit3 className="w-5 h-5" />
               </button>
               <button onClick={() => onDelete(recipe.id)} className="p-3 bg-white/80 backdrop-blur-md rounded-full text-red-400 shadow-sm hover:bg-red-50 transition-all hover:scale-110 active:scale-90" title="Slett">
                  <Trash2 className="w-5 h-5" />
               </button>
             </>
           ) : (
             <button 
                onClick={handleSave} 
                className={`p-3 backdrop-blur-md rounded-full shadow-sm transition-all hover:scale-110 active:scale-90 ${isSaved ? 'bg-pinky-100 text-pinky-500' : 'bg-white/80 text-slate-300 hover:text-pinky-400'} ${isAnimating ? 'animate-heartbeat' : ''}`}
                title={isSaved ? "Allerede lagret" : "Lagre i favoritter"}
             >
                <Heart className={`w-5 h-5 transition-colors ${isSaved ? 'fill-current' : ''}`} />
             </button>
           )}
        </div>
      </div>

      <div className="p-7 flex flex-col flex-1">
        <h3 className="text-2xl font-bold text-slate-800 mb-3 leading-tight">{recipe.title}</h3>
        
        <div className="flex items-center gap-3 text-sm mb-5">
          <div className="flex items-center gap-1.5 bg-lavender-100 text-lavender-500 px-3 py-1.5 rounded-full font-medium">
            <Clock className="w-4 h-4" />
            <span>{recipe.prepTime}</span>
          </div>
        </div>

        <p className="text-slate-500 text-sm mb-6 italic">"{recipe.description}"</p>

        {recipe.notes && (
          <div className="mb-6 bg-lavender-50/50 p-4 rounded-3xl border-l-4 border-lavender-200 animate-pop">
            <p className="text-[10px] uppercase font-black text-lavender-400 tracking-widest mb-1 flex items-center gap-1">
               <Heart className="w-3 h-3 fill-current" /> Mine notater
            </p>
            <p className="text-sm text-slate-600 font-medium">{recipe.notes}</p>
          </div>
        )}

        <div className="space-y-4 mb-6">
          <div className="bg-white/50 p-4 rounded-3xl border border-pinky-50">
            <h4 className="font-bold text-pinky-400 text-xs mb-3 uppercase tracking-widest">Ingredienser ✨</h4>
            <ul className="text-sm text-slate-600 space-y-2">
              {recipe.ingredients.slice(0, 4).map((ing, i) => (
                <li key={i} className="flex justify-between items-center">
                  <span className="font-medium">{ing.item}</span>
                  <span className="text-xs bg-pinky-50 px-2 py-0.5 rounded-full text-pinky-400">{ing.amount}</span>
                </li>
              ))}
              {recipe.ingredients.length > 4 && (
                <li className="text-xs text-lavender-500 font-bold pt-1">
                  + {recipe.ingredients.length - 4} andre gode ting
                </li>
              )}
            </ul>
          </div>
        </div>
        
        <div className="mt-auto pt-4">
           <details className="group">
             <summary className="flex cursor-pointer items-center justify-between font-bold text-slate-700 text-sm hover:text-pinky-400 transition-colors">
               <span>Slik gjør du det</span>
               <ChevronDown className="w-5 h-5 transition-transform group-open:rotate-180 text-pinky-200" />
             </summary>
             <div className="text-slate-600 text-sm mt-4 space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {recipe.instructions.map((step, idx) => (
                  <div key={idx} className="flex gap-4 items-start">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-pinky-100 text-pinky-400 flex items-center justify-center text-[10px] font-black">
                      {idx + 1}
                    </span>
                    <p className="leading-relaxed">{step}</p>
                  </div>
                ))}
             </div>
           </details>
        </div>
      </div>
    </div>
  );
};