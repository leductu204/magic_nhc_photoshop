
import React, { useState, useRef, useEffect } from 'react';
import { XMarkIcon, CheckIcon, ArrowPathIcon, ScissorsIcon } from '@heroicons/react/24/outline';

interface CropperModalProps {
    isOpen: boolean;
    onClose: () => void;
    imageFile: File | null;
    onSave: (croppedFile: File, previewUrl: string) => void;
    fixedAspectRatio?: number; // width / height (e.g., 10/15 = 0.666)
}

type DragType = 'none' | 'move' | 'nw' | 'ne' | 'sw' | 'se';

const CropperModal: React.FC<CropperModalProps> = ({ isOpen, onClose, imageFile, onSave, fixedAspectRatio = 0.666 }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [image, setImage] = useState<HTMLImageElement | null>(null);
    const [rotation, setRotation] = useState(0); 
    
    // Tọa độ vùng chọn (theo pixel canvas)
    const [selection, setSelection] = useState<{x: number, y: number, w: number, h: number} | null>(null);
    const [dragType, setDragType] = useState<DragType>('none');
    const [dragStart, setDragStart] = useState<{x: number, y: number, sx: number, sy: number, sw: number, sh: number} | null>(null);

    const HANDLE_SIZE = 12;

    // Tải ảnh
    useEffect(() => {
        if (imageFile) {
            const img = new Image();
            img.src = URL.createObjectURL(imageFile);
            img.onload = () => {
                setImage(img);
                setRotation(0);
                setSelection(null);
            };
        }
    }, [imageFile]);

    // Khởi tạo vùng chọn mặc định khi ảnh đã tải
    useEffect(() => {
        if (image && !selection && canvasRef.current) {
            const canvas = canvasRef.current;
            const diagonal = Math.sqrt(image.width ** 2 + image.height ** 2);
            const scale = Math.min(1200 / diagonal, 1);
            const canvasW = diagonal * scale;
            const canvasH = diagonal * scale;

            let h = canvasH * 0.8;
            let w = h * fixedAspectRatio;

            if (w > canvasW * 0.8) {
                w = canvasW * 0.8;
                h = w / fixedAspectRatio;
            }

            setSelection({
                x: (canvasW - w) / 2,
                y: (canvasH - h) / 2,
                w: w,
                h: h
            });
        }
    }, [image, fixedAspectRatio]);

    // Vẽ Canvas
    useEffect(() => {
        if (!image || !canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const diagonal = Math.sqrt(image.width ** 2 + image.height ** 2);
        const scale = Math.min(1200 / diagonal, 1);
        const canvasW = diagonal * scale;
        const canvasH = diagonal * scale;

        if (canvas.width !== canvasW || canvas.height !== canvasH) {
            canvas.width = canvasW;
            canvas.height = canvasH;
        }
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#0a0a0a";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        const drawW = image.width * scale;
        const drawH = image.height * scale;
        ctx.drawImage(image, -drawW / 2, -drawH / 2, drawW, drawH);
        ctx.restore();

        // Vẽ lớp phủ tối bên ngoài vùng chọn
        if (selection) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            // Top
            ctx.fillRect(0, 0, canvas.width, selection.y);
            // Bottom
            ctx.fillRect(0, selection.y + selection.h, canvas.width, canvas.height - (selection.y + selection.h));
            // Left
            ctx.fillRect(0, selection.y, selection.x, selection.h);
            // Right
            ctx.fillRect(selection.x + selection.w, selection.y, canvas.width - (selection.x + selection.w), selection.h);

            // Vẽ viền vùng chọn
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 2;
            ctx.strokeRect(selection.x, selection.y, selection.w, selection.h);
            
            // Lưới 1/3
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.lineWidth = 1;
            for (let i = 1; i < 3; i++) {
                ctx.beginPath(); ctx.moveTo(selection.x + (selection.w * i) / 3, selection.y); ctx.lineTo(selection.x + (selection.w * i) / 3, selection.y + selection.h); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(selection.x, selection.y + (selection.h * i) / 3); ctx.lineTo(selection.x + selection.w, selection.y + (selection.h * i) / 3); ctx.stroke();
            }

            // Vẽ các điểm neo (handles)
            ctx.fillStyle = '#ef4444';
            const hs = HANDLE_SIZE;
            ctx.fillRect(selection.x - hs/2, selection.y - hs/2, hs, hs); // NW
            ctx.fillRect(selection.x + selection.w - hs/2, selection.y - hs/2, hs, hs); // NE
            ctx.fillRect(selection.x - hs/2, selection.y + selection.h - hs/2, hs, hs); // SW
            ctx.fillRect(selection.x + selection.w - hs/2, selection.y + selection.h - hs/2, hs, hs); // SE
        }

    }, [image, rotation, selection]);

    const getMousePos = (e: React.MouseEvent | React.TouchEvent) => {
        if (!canvasRef.current) return { x: 0, y: 0 };
        const rect = canvasRef.current.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
        const scaleX = canvasRef.current.width / rect.width;
        const scaleY = canvasRef.current.height / rect.height;
        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
        };
    };

    const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
        if (!selection) return;
        const pos = getMousePos(e);
        const hs = HANDLE_SIZE + 10; // Tăng vùng chạm cho handle

        // Kiểm tra xem click vào đâu
        let type: DragType = 'none';
        if (pos.x >= selection.x - hs && pos.x <= selection.x + hs && pos.y >= selection.y - hs && pos.y <= selection.y + hs) type = 'nw';
        else if (pos.x >= selection.x + selection.w - hs && pos.x <= selection.x + selection.w + hs && pos.y >= selection.y - hs && pos.y <= selection.y + hs) type = 'ne';
        else if (pos.x >= selection.x - hs && pos.x <= selection.x + hs && pos.y >= selection.y + selection.h - hs && pos.y <= selection.y + selection.h + hs) type = 'sw';
        else if (pos.x >= selection.x + selection.w - hs && pos.x <= selection.x + selection.w + hs && pos.y >= selection.y + selection.h - hs && pos.y <= selection.y + selection.h + hs) type = 'se';
        else if (pos.x >= selection.x && pos.x <= selection.x + selection.w && pos.y >= selection.y && pos.y <= selection.y + selection.h) type = 'move';

        if (type !== 'none') {
            setDragType(type);
            setDragStart({ x: pos.x, y: pos.y, sx: selection.x, sy: selection.y, sw: selection.w, sh: selection.h });
        }
    };

    const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (dragType === 'none' || !dragStart || !selection) return;
        const pos = getMousePos(e);
        const dx = pos.x - dragStart.x;
        const dy = pos.y - dragStart.y;

        let nx = selection.x, ny = selection.y, nw = selection.w, nh = selection.h;

        if (dragType === 'move') {
            nx = dragStart.sx + dx;
            ny = dragStart.sy + dy;
        } else {
            // Logic thay đổi kích thước giữ tỷ lệ
            if (dragType === 'se') {
                nw = Math.max(50, dragStart.sw + dx);
                nh = nw / fixedAspectRatio;
            } else if (dragType === 'sw') {
                nw = Math.max(50, dragStart.sw - dx);
                nh = nw / fixedAspectRatio;
                nx = dragStart.sx + (dragStart.sw - nw);
            } else if (dragType === 'ne') {
                nw = Math.max(50, dragStart.sw + dx);
                nh = nw / fixedAspectRatio;
                ny = dragStart.sy + (dragStart.sh - nh);
            } else if (dragType === 'nw') {
                nw = Math.max(50, dragStart.sw - dx);
                nh = nw / fixedAspectRatio;
                nx = dragStart.sx + (dragStart.sw - nw);
                ny = dragStart.sy + (dragStart.sh - nh);
            }
        }

        setSelection({ x: nx, y: ny, w: nw, h: nh });
    };

    const handleMouseUp = () => {
        setDragType('none');
        setDragStart(null);
    };

    const handleSave = () => {
        if (!image || !canvasRef.current || !selection) return;
        
        // Tạo canvas tạm để xoay ảnh
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvasRef.current.width;
        tempCanvas.height = canvasRef.current.height;
        const ctx = tempCanvas.getContext('2d');
        if (!ctx) return;

        const diagonal = Math.sqrt(image.width ** 2 + image.height ** 2);
        const scale = Math.min(1200 / diagonal, 1);
        
        ctx.translate(tempCanvas.width / 2, tempCanvas.height / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        const drawW = image.width * scale;
        const drawH = image.height * scale;
        ctx.drawImage(image, -drawW / 2, -drawH / 2, drawW, drawH);

        // Cắt theo vùng chọn
        const finalCanvas = document.createElement('canvas');
        finalCanvas.width = selection.w;
        finalCanvas.height = selection.h;
        const fCtx = finalCanvas.getContext('2d');
        if (!fCtx) return;
        fCtx.drawImage(tempCanvas, selection.x, selection.y, selection.w, selection.h, 0, 0, selection.w, selection.h);

        finalCanvas.toBlob((blob) => {
            if (blob) {
                const newFile = new File([blob], "cropped_image.jpg", { type: "image/jpeg" });
                onSave(newFile, URL.createObjectURL(newFile));
                onClose();
            }
        }, 'image/jpeg', 0.95);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[150] bg-black/95 flex flex-col items-center justify-center p-4 backdrop-blur-sm">
            <div className="relative bg-[#1a1a1a] border border-gray-700 rounded-3xl p-6 w-full max-w-5xl h-[90vh] flex flex-col gap-6 shadow-2xl animate-fade-in">
                 
                 <div className="flex justify-between items-center border-b border-gray-800 pb-4">
                    <div className="flex flex-col">
                        <h3 className="text-white font-black text-2xl flex items-center gap-3 uppercase tracking-tighter">
                            <ScissorsIcon className="w-7 h-7 text-red-500" />
                            Cắt & Xoay Ảnh Chuyên Nghiệp
                        </h3>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Tỷ lệ cố định: 10x15 (Portrait)</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                        <XMarkIcon className="w-8 h-8 text-gray-400 hover:text-white" />
                    </button>
                 </div>
                 
                 <div 
                    ref={containerRef} 
                    className="flex-1 bg-black rounded-2xl flex items-center justify-center overflow-hidden border border-gray-800 relative cursor-move select-none"
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onTouchMove={handleMouseMove}
                    onTouchEnd={handleMouseUp}
                 >
                     <canvas 
                        ref={canvasRef} 
                        className="max-w-full max-h-full transition-opacity duration-300 shadow-2xl"
                        onMouseDown={handleMouseDown}
                        onTouchStart={handleMouseDown}
                     />
                     <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md px-6 py-2 rounded-full border border-white/10 text-white/80 text-xs font-black uppercase tracking-widest pointer-events-none select-none">
                        Kéo vùng chọn để chỉnh bố cục • Kéo góc để Zoom
                     </div>
                 </div>
                 
                 <div className="p-5 bg-[#111] rounded-2xl border border-gray-800">
                     <div className="flex items-center gap-6">
                         <div className="w-12 h-12 flex items-center justify-center bg-gray-800 rounded-full border border-gray-700">
                            <ArrowPathIcon className="w-6 h-6 text-red-500" />
                         </div>
                         <div className="flex-1 flex flex-col">
                             <div className="flex justify-between items-center mb-2">
                                 <span className="text-xs font-black text-gray-400 uppercase tracking-tighter">Góc Xoay Ảnh</span>
                                 <span className="text-sm font-black text-white bg-red-600 px-3 py-1 rounded shadow-lg">{rotation}°</span>
                             </div>
                             <input 
                                type="range" 
                                min="-180" 
                                max="180" 
                                value={rotation} 
                                onChange={(e) => setRotation(parseInt(e.target.value))}
                                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-red-600"
                             />
                         </div>
                         <button 
                            onClick={() => setRotation(0)} 
                            className="px-5 py-3 bg-zinc-800 hover:bg-zinc-700 text-xs font-black text-white rounded-xl border border-zinc-700 transition-all uppercase tracking-widest"
                         >
                             Mặc định
                         </button>
                     </div>
                 </div>
                 
                 <div className="flex gap-4">
                     <button onClick={onClose} className="flex-1 bg-zinc-800 text-gray-400 py-5 rounded-2xl font-black uppercase tracking-tighter hover:bg-zinc-700 hover:text-white transition-all border border-zinc-700 shadow-lg">Hủy bỏ</button>
                     <button onClick={handleSave} className="flex-[2] bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white py-5 rounded-2xl font-black uppercase tracking-tighter flex items-center justify-center gap-3 shadow-[0_10px_40px_rgba(220,38,38,0.4)] transition-all transform active:scale-95">
                         <CheckIcon className="w-7 h-7 stroke-[3px]" /> XÁC NHẬN CẮT ẢNH
                     </button>
                 </div>
            </div>
        </div>
    );
};

export default CropperModal;
