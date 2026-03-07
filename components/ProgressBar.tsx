
import React from 'react';

interface ProgressBarProps {
  progress: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ progress }) => {
  const roundedProgress = Math.round(Math.min(progress, 100));
  const isComplete = roundedProgress >= 100;

  return (
    <div className="w-full flex flex-col gap-2 animate-fade-in">
      <div className="flex justify-between items-end px-1">
        <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">Processing Audio</span>
        <span className="text-sm font-black text-white tabular-nums">{roundedProgress}%</span>
      </div>
      
      <div className="relative w-full bg-zinc-900 rounded-full h-5 overflow-hidden border border-zinc-800 shadow-inner">
        {/* Progress Fill */}
        <div
          className={`h-full rounded-full bg-red-600 transition-all duration-700 ease-out relative shadow-[0_0_15px_rgba(220,38,38,0.5)] ${isComplete ? 'bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.5)]' : ''}`}
          style={{ width: `${roundedProgress}%` }}
        >
          {/* Shimmer Effect */}
          {!isComplete && (
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_2s_infinite]"></div>
          )}
        </div>
        
        {/* Percentage Text Overlay (Alternative position for better visibility) */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-[10px] font-black text-white mix-blend-difference tracking-tighter uppercase">
                {isComplete ? 'Hoàn tất' : `Đang tạo: ${roundedProgress}%`}
            </span>
        </div>
      </div>
      
      <style>{`
        @keyframes shimmer {
          100% {
            transform: translateX(100%);
          }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
};

export default ProgressBar;
