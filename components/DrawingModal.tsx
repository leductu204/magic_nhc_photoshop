
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { XMarkIcon, CheckIcon, ArrowPathIcon, PencilIcon, TrashIcon, ArrowUturnLeftIcon, EyeDropperIcon, SwatchIcon, MagnifyingGlassPlusIcon, MagnifyingGlassMinusIcon, ArrowsPointingOutIcon } from '@heroicons/react/24/outline';

interface DrawingModalProps {
    isOpen: boolean;
    onClose: () => void;
    imageFile: File | null;
    onSave: (drawnFile: File, previewUrl: string) => void;
}

const PRESET_COLORS = [
    '#ffffff', '#000000', '#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'
];

const DrawingModal: React.FC<DrawingModalProps> = ({ isOpen, onClose, imageFile, onSave }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [image, setImage] = useState<HTMLImageElement | null>(null);
    
    const [brushSize, setBrushSize] = useState(10);
    const [brushColor, setBrushColor] = useState('#ef4444');
    const [isDrawing, setIsDrawing] = useState(false);
    
    // Trạng thái Zoom & Pan
    const [scale, setScale] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const [panStart, setPanStart] = useState({ x: 0, y: 0 });

    // Lịch sử để Hoàn tác (Undo)
    const [history, setHistory] = useState<ImageData[]>([]);

    useEffect(() => {
        if (imageFile) {
            const img = new Image();
            img.src = URL.createObjectURL(imageFile);
            img.onload = () => {
                setImage(img);
                setHistory([]);
                // Đặt lại zoom/pan khi có ảnh mới
                setScale(1);
                setOffset({ x: 0, y: 0 });
            };
        }
    }, [imageFile]);

    useEffect(() => {
        if (image && canvasRef.current && containerRef.current) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            // Đặt kích thước canvas bằng độ phân giải tự nhiên của ảnh
            canvas.width = image.width;
            canvas.height = image.height;
            
            ctx.drawImage(image, 0, 0);
            
            // Tự động căn chỉnh ảnh vừa khung nhìn ban đầu
            const container = containerRef.current;
            const fitScale = Math.min(
                (container.clientWidth - 40) / image.width,
                (container.clientHeight - 40) / image.height,
                1
            );
            setScale(fitScale);

            // Lưu trạng thái ban đầu vào lịch sử
            const initialData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            setHistory([initialData]);
        }
    }, [image]);

    const saveToHistory = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        const currentData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        setHistory(prev => [...prev.slice(-19), currentData]); // Giữ tối đa 20 bước
    }, []);

    const handleUndo = () => {
        if (history.length <= 1) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const newHistory = [...history];
        newHistory.pop(); 
        const prevState = newHistory[newHistory.length - 1];
        
        ctx.putImageData(prevState, 0, 0);
        setHistory(newHistory);
    };

    const handleClear = () => {
        if (!image || !canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(image, 0, 0);
        saveToHistory();
    };

    const getMousePos = (e: React.MouseEvent | React.TouchEvent) => {
        if (!canvasRef.current) return { x: 0, y: 0 };
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
        
        // Chuyển đổi tọa độ màn hình sang tọa độ nội bộ của canvas (có tính đến Zoom/Pan)
        const x = (clientX - rect.left) * (canvas.width / rect.width);
        const y = (clientY - rect.top) * (canvas.height / rect.height);
        
        return { x, y };
    };

    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        const newScale = Math.min(Math.max(0.1, scale * delta), 10);
        setScale(newScale);
    };

    const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
        // Giữ phím Shift hoặc nhấn chuột giữa để di chuyển ảnh (Panning)
        const isSpacePressed = (e as any).shiftKey || (e as any).button === 1;
        
        if (isSpacePressed) {
            setIsPanning(true);
            const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
            const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
            setPanStart({ x: clientX - offset.x, y: clientY - offset.y });
            return;
        }

        const pos = getMousePos(e);
        const ctx = canvasRef.current?.getContext('2d');
        if (!ctx) return;
        
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
        ctx.lineWidth = brushSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = brushColor;
        setIsDrawing(true);
    };

    const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (isPanning) {
            const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
            const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
            setOffset({
                x: clientX - panStart.x,
                y: clientY - panStart.y
            });
            return;
        }

        if (!isDrawing) return;
        const pos = getMousePos(e);
        const ctx = canvasRef.current?.getContext('2d');
        if (!ctx) return;
        
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
    };

    const handleMouseUp = () => {
        if (isDrawing) {
            setIsDrawing(false);
            saveToHistory();
        }
        setIsPanning(false);
    };

    const handleEyeDropper = async () => {
        // @ts-ignore
        if (!window.EyeDropper) {
            alert("Trình duyệt của bạn không hỗ trợ công cụ lấy màu EyeDropper.");
            return;
        }
        try {
            // @ts-ignore
            const eyeDropper = new window.EyeDropper();
            const result = await eyeDropper.open();
            setBrushColor(result.sRGBHex);
        } catch (e) {
            console.log("EyeDropper cancelled");
        }
    };

    const handleResetView = () => {
        if (!image || !containerRef.current) return;
        const container = containerRef.current;
        const fitScale = Math.min(
            (container.clientWidth - 40) / image.width,
            (container.clientHeight - 40) / image.height,
            1
        );
        setScale(fitScale);
        setOffset({ x: 0, y: 0 });
    };

    const handleSave = () => {
        if (!canvasRef.current) return;
        canvasRef.current.toBlob((blob) => {
            if (blob) {
                const newFile = new File([blob], "drawn_image.jpg", { type: "image/jpeg" });
                onSave(newFile, URL.createObjectURL(newFile));
                onClose();
            }
        }, 'image/jpeg', 0.95);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[150] bg-black/95 flex flex-col items-center justify-center p-2 sm:p-4 backdrop-blur-sm">
            <div className="relative bg-[#1a1a1a] border border-gray-700 rounded-3xl p-4 sm:p-6 w-full max-w-7xl h-[98vh] flex flex-col gap-4 sm:gap-6 shadow-2xl animate-fade-in">
                 
                 <div className="flex justify-between items-center border-b border-gray-800 pb-4">
                    <div className="flex flex-col">
                        <h3 className="text-white font-black text-xl sm:text-2xl flex items-center gap-3 uppercase tracking-tighter">
                            <PencilIcon className="w-6 h-6 sm:w-7 h-7 text-red-500" />
                            CÔNG CỤ VẼ TỰ DO PRO
                        </h3>
                        <p className="text-[10px] sm:text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Sử dụng con lăn chuột để Zoom • Giữ Shift để di chuyển</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={handleResetView} className="p-2 sm:p-3 bg-zinc-800 hover:bg-zinc-700 text-sky-400 rounded-xl border border-zinc-700" title="Đặt lại khung nhìn">
                            <ArrowsPointingOutIcon className="w-5 h-5 sm:w-6 h-6" />
                        </button>
                        <button onClick={handleUndo} disabled={history.length <= 1} className="p-2 sm:p-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl border border-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed" title="Hoàn tác">
                            <ArrowUturnLeftIcon className="w-5 h-5 sm:w-6 h-6" />
                        </button>
                        <button onClick={handleClear} className="p-2 sm:p-3 bg-zinc-800 hover:bg-zinc-700 text-red-400 rounded-xl border border-zinc-700" title="Xóa tất cả nét vẽ">
                            <TrashIcon className="w-5 h-5 sm:w-6 h-6" />
                        </button>
                        <button onClick={onClose} className="p-2 ml-2 hover:bg-white/5 rounded-full transition-colors">
                            <XMarkIcon className="w-7 h-7 sm:w-8 h-8 text-gray-400 hover:text-white" />
                        </button>
                    </div>
                 </div>
                 
                 {/* Vùng làm việc Canvas */}
                 <div 
                    ref={containerRef} 
                    className="flex-1 bg-black rounded-2xl flex items-center justify-center overflow-hidden border border-gray-800 relative select-none"
                    onWheel={handleWheel}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onTouchMove={handleMouseMove}
                    onTouchEnd={handleMouseUp}
                 >
                     <canvas 
                        ref={canvasRef} 
                        className="shadow-2xl bg-white origin-center"
                        style={{ 
                            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
                            cursor: isPanning ? 'grabbing' : 'crosshair'
                        }}
                        onMouseDown={handleMouseDown}
                        onTouchStart={handleMouseDown}
                     />
                     
                     {/* Thông tin độ phóng đại */}
                     <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur px-3 py-1.5 rounded-full border border-white/10 text-[10px] font-bold text-white uppercase tracking-widest pointer-events-none">
                        Độ phóng đại: {Math.round(scale * 100)}%
                     </div>
                 </div>
                 
                 {/* Bảng điều khiển công cụ vẽ */}
                 <div className="p-4 sm:p-5 bg-[#111] rounded-2xl border border-gray-800 flex flex-col md:flex-row gap-4 sm:gap-6">
                     {/* Mục chọn màu */}
                     <div className="flex flex-col gap-2 min-w-[200px]">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-tighter">Màu Sắc</span>
                            <div className="w-5 h-5 sm:w-6 h-6 rounded-full border border-white/20" style={{ backgroundColor: brushColor }}></div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {PRESET_COLORS.map(c => (
                                <button key={c} onClick={() => setBrushColor(c)} className={`w-7 h-7 sm:w-8 h-8 rounded-full border-2 ${brushColor === c ? 'border-red-500 scale-110 shadow-lg' : 'border-transparent'}`} style={{ backgroundColor: c }} />
                            ))}
                            <button onClick={handleEyeDropper} className="w-7 h-7 sm:w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center hover:bg-zinc-700 transition-colors" title="Lấy màu từ ảnh">
                                <EyeDropperIcon className="w-4 h-4 text-white" />
                            </button>
                            <label className="w-7 h-7 sm:w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center hover:bg-zinc-700 transition-colors cursor-pointer relative overflow-hidden" title="Chọn màu tùy chỉnh">
                                <SwatchIcon className="w-4 h-4 text-white" />
                                <input type="color" value={brushColor} onChange={(e) => setBrushColor(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer" />
                            </label>
                        </div>
                     </div>

                     {/* Mục chỉnh kích thước cọ */}
                     <div className="flex-1 flex flex-col justify-center">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-tighter">Kích thước cọ</span>
                            <span className="text-xs sm:text-sm font-black text-white bg-red-600 px-3 py-1 rounded shadow-lg">{brushSize}px</span>
                        </div>
                        <input 
                            type="range" 
                            min="1" 
                            max="200" 
                            value={brushSize} 
                            onChange={(e) => setBrushSize(parseInt(e.target.value))}
                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-red-600"
                        />
                     </div>

                     {/* Các nút hành động */}
                     <div className="flex items-center gap-3">
                         <button onClick={onClose} className="px-6 sm:px-8 py-3 sm:py-4 bg-zinc-800 text-gray-400 rounded-xl font-black uppercase tracking-tighter hover:bg-zinc-700 hover:text-white transition-all border border-zinc-700 shadow-lg text-xs sm:text-base">Hủy</button>
                         <button onClick={handleSave} className="flex-1 px-8 sm:px-10 py-3 sm:py-4 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white rounded-xl font-black uppercase tracking-tighter flex items-center justify-center gap-3 shadow-[0_10px_40px_rgba(220,38,38,0.4)] transition-all transform active:scale-95 whitespace-nowrap text-xs sm:text-base">
                             <CheckIcon className="w-6 h-6 sm:w-7 h-7 stroke-[3px]" /> XÁC NHẬN
                         </button>
                     </div>
                 </div>
            </div>
        </div>
    );
};

export default DrawingModal;
