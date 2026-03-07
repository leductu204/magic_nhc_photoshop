
import React, { useState } from 'react';
import { ProcessedImage } from '../types';
import { ArrowPathIcon, TrashIcon, ArrowDownTrayIcon, CheckIcon, ScissorsIcon, PencilIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface ImageCardProps {
  item: ProcessedImage;
  onToggleSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onRegenerate: (item: ProcessedImage) => void;
  isFullHeight?: boolean;
  onDoubleClick?: () => void;
  onCrop?: (item: ProcessedImage) => void;
  onDraw?: (item: ProcessedImage) => void; // New prop for draw action
}

const ImageCard: React.FC<ImageCardProps> = ({ item, onToggleSelect, onDelete, onRegenerate, isFullHeight, onDoubleClick, onCrop, onDraw }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false); // State for right-click comparison
  
  const isCompleted = item.status === 'completed' && item.generatedImageUrl;
  const isGenerating = item.status === 'generating';
  
  // Logic: Show original if strictly holding right click OR hovering (if completed), otherwise show generated if available.
  const displayImage = (isCompleted && (showOriginal || isHovered)) 
    ? item.originalPreviewUrl 
    : (isCompleted ? item.generatedImageUrl : item.originalPreviewUrl);

  const handleMouseDown = (e: React.MouseEvent) => {
      // Button 2 is Right Click
      if (e.button === 2 && isCompleted) {
          setShowOriginal(true);
      }
  };

  const handleMouseUp = () => {
      setShowOriginal(false);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
      // Prevent default context menu if the image is completed (to allow comparison view)
      if (isCompleted) {
          e.preventDefault();
      }
  };

  return (
    <div 
        className={`relative group border rounded-3xl overflow-hidden bg-[#151515] flex flex-col w-full transition-all duration-500 hover:shadow-2xl hover:shadow-black/50 ${item.isSelected ? 'border-sky-500 ring-2 ring-sky-500/30 shadow-xl shadow-sky-900/20' : 'border-white/5'} ${isFullHeight ? 'h-full' : ''}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => { setIsHovered(false); setShowOriginal(false); }}
        onDoubleClick={onDoubleClick}
        onContextMenu={handleContextMenu}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
    >
      
      {/* Image Area - FIXED ASPECT RATIO DISPLAY */}
      <div className={`relative w-full bg-black overflow-hidden flex items-center justify-center ${isFullHeight ? 'flex-1 min-h-0' : 'min-h-[400px]'}`}>
        <img 
            src={displayImage} 
            alt="Content" 
            className={`${isFullHeight ? 'max-w-full max-h-full' : 'w-full h-full'} object-contain block transition-all duration-700 ${isGenerating ? 'opacity-40 scale-105 blur-sm' : 'opacity-100 group-hover:scale-105'} cursor-zoom-in`}
        />
        
        {/* Checkbox (Top Left) */}
        <div 
            onClick={(e) => { e.stopPropagation(); onToggleSelect(item.id); }}
            className={`absolute top-4 left-4 w-9 h-9 rounded-xl border-2 cursor-pointer flex items-center justify-center transition-all z-30 backdrop-blur-md
                ${item.isSelected ? 'bg-sky-600 border-sky-400 scale-110 shadow-lg shadow-sky-900/40' : 'bg-black/40 border-white/20 hover:border-white hover:bg-black/60'}
            `}
        >
            {item.isSelected && <CheckIcon className="w-6 h-6 text-white stroke-[3px]" />}
        </div>

        {/* Delete Button (Floating on Hover) */}
        <button 
            onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
            className="absolute top-4 right-4 bg-black/40 hover:bg-red-600 text-white p-2.5 rounded-xl opacity-0 group-hover:opacity-100 transition-all z-30 shadow-xl backdrop-blur-md border border-white/10 hover:border-red-400"
            title="Xóa ảnh"
        >
            <TrashIcon className="w-5 h-5" />
        </button>

        {/* Status Loading Overlay */}
        {isGenerating && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-black/40 backdrop-blur-sm">
                <div className="relative w-16 h-16">
                  <div className="absolute inset-0 border-4 border-sky-500/20 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
                <span className="mt-4 text-[10px] font-black text-sky-400 uppercase tracking-[0.3em] animate-pulse">Đang xử lý...</span>
            </div>
        )}
        
        {/* Error Overlay */}
        {item.status === 'error' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-20 p-6 backdrop-blur-md">
                 <div className="text-center">
                    <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/30">
                      <XMarkIcon className="w-6 h-6 text-red-500" />
                    </div>
                    <span className="text-red-500 text-xs font-black block mb-2 uppercase tracking-widest">LỖI HỆ THỐNG</span>
                    <span className="text-gray-500 text-[10px] font-medium leading-relaxed">{item.error || 'Vui lòng thử lại sau giây lát'}</span>
                 </div>
            </div>
        )}

        {/* Badge 'Final' */}
        {isCompleted && (
            <div className={`absolute top-16 right-4 text-[9px] font-black px-3 py-1.5 rounded-lg shadow-xl pointer-events-none z-10 uppercase tracking-widest transition-all backdrop-blur-md border ${ (showOriginal || isHovered) ? 'bg-blue-600/90 text-white border-blue-400' : 'bg-white/90 text-black border-white'}`}>
                {(showOriginal || isHovered) ? "Ảnh gốc" : "Kết quả AI"}
            </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-white/5 bg-[#1a1a1a] flex flex-col gap-3">
        <div className="flex items-center gap-2">
          {/* 1. Create Button */}
          <button 
              onClick={(e) => { e.stopPropagation(); onRegenerate(item); }}
              className={`flex-1 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white transition-all py-3 rounded-2xl shadow-lg flex items-center justify-center text-[10px] font-black uppercase tracking-widest active:scale-95 ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={isGenerating}
          >
              {isGenerating ? <ArrowPathIcon className="w-5 h-5 animate-spin" /> : "Tạo lại ảnh"}
          </button>

          {/* 2. Crop Button */}
          {onCrop && (
              <button 
                  onClick={(e) => { e.stopPropagation(); onCrop(item); }}
                  className="w-12 h-11 bg-zinc-800 hover:bg-zinc-700 text-gray-300 transition-all rounded-2xl shadow-lg flex items-center justify-center border border-white/5 active:scale-90"
                  title="Cắt & Xoay Ảnh"
                  disabled={isGenerating}
              >
                  <ScissorsIcon className="w-5 h-5" />
              </button>
          )}

          {/* 3. Draw Button */}
          {onDraw && (
              <button 
                  onClick={(e) => { e.stopPropagation(); onDraw(item); }}
                  className="w-12 h-11 bg-zinc-800 hover:bg-zinc-700 text-gray-300 transition-all rounded-2xl shadow-lg flex items-center justify-center border border-white/5 active:scale-90"
                  title="Vẽ lên ảnh"
                  disabled={isGenerating}
              >
                  <PencilIcon className="w-5 h-5" />
              </button>
          )}
        </div>

        {/* 4. Download Button */}
        <div className="w-full">
            {isCompleted ? (
                <a 
                    href={item.generatedImageUrl} 
                    download={`nhc_ai_result_${item.id}.png`}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full flex items-center justify-center gap-3 bg-sky-600 hover:bg-sky-500 text-white transition-all rounded-2xl py-3 shadow-xl text-[10px] font-black uppercase tracking-widest active:scale-95"
                >
                    <ArrowDownTrayIcon className="w-5 h-5 stroke-[2px]" />
                    Tải về tác phẩm
                </a>
            ) : (
                <div className="w-full py-3 flex items-center justify-center gap-3 bg-white/5 rounded-2xl cursor-not-allowed opacity-20 border border-white/5">
                    <ArrowDownTrayIcon className="w-5 h-5" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Đang chuẩn bị...</span>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default ImageCard;
