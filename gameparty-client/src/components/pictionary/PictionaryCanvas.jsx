// client/src/components/pictionary/PictionaryCanvas.jsx
import React, { useRef, useEffect, useState } from "react";
import { RotateCcw, Trash2, Eraser, Brush, Palette } from "lucide-react";

const COLORS = [
  { name: "Negro", hex: "#000000" },
  { name: "Rojo", hex: "#ef4444" },
  { name: "Naranja", hex: "#f97316" },
  { name: "Amarillo", hex: "#eab308" },
  { name: "Verde", hex: "#22c55e" },
  { name: "Azul", hex: "#3b82f6" },
  { name: "Púrpura", hex: "#a855f7" },
  { name: "Rosa", hex: "#ec4899" },
  { name: "Marrón", hex: "#78350f" },
  { name: "Borrador", hex: "#ffffff", isEraser: true }
];

const BRUSH_SIZES = [
  { label: "Fino", size: 4 },
  { label: "Medio", size: 8 },
  { label: "Grueso", size: 16 },
  { label: "Extra", size: 28 }
];

export default function PictionaryCanvas({
  isArtist,
  strokes = [],
  onSendStroke,
  onClearCanvas,
  onUndoStroke
}) {
  const canvasRef = useRef(null);
  const [selectedColor, setSelectedColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(8);
  const [isDrawing, setIsDrawing] = useState(false);
  const currentStrokeRef = useRef(null);

  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 520;

  // Redibujar todos los trazos en el canvas
  const redrawCanvas = (allStrokes) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    // Fondo blanco limpio
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    for (const stroke of allStrokes) {
      if (!stroke.points || stroke.points.length === 0) continue;

      ctx.beginPath();
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.size;

      const first = stroke.points[0];
      ctx.moveTo(first.x * CANVAS_WIDTH, first.y * CANVAS_HEIGHT);

      if (stroke.points.length === 1) {
        ctx.lineTo(first.x * CANVAS_WIDTH + 0.5, first.y * CANVAS_HEIGHT + 0.5);
      } else {
        for (let i = 1; i < stroke.points.length; i++) {
          const pt = stroke.points[i];
          ctx.lineTo(pt.x * CANVAS_WIDTH, pt.y * CANVAS_HEIGHT);
        }
      }
      ctx.stroke();
    }
  };

  useEffect(() => {
    redrawCanvas(strokes);
  }, [strokes]);

  // Obtener coordenadas relativas normalizadas (0 a 1)
  const getCanvasCoords = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0]?.clientX);
    const clientY = e.clientY || (e.touches && e.touches[0]?.clientY);

    const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));

    return { x, y };
  };

  const handlePointerDown = (e) => {
    if (!isArtist) return;
    e.preventDefault();

    const pt = getCanvasCoords(e);
    setIsDrawing(true);

    const newStroke = {
      color: selectedColor,
      size: brushSize,
      points: [pt]
    };

    currentStrokeRef.current = newStroke;

    // Pintar trazo preliminar en el canvas local
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = selectedColor;
    ctx.lineWidth = brushSize;
    ctx.beginPath();
    ctx.moveTo(pt.x * CANVAS_WIDTH, pt.y * CANVAS_HEIGHT);
    ctx.lineTo(pt.x * CANVAS_WIDTH + 0.1, pt.y * CANVAS_HEIGHT + 0.1);
    ctx.stroke();
  };

  const handlePointerMove = (e) => {
    if (!isArtist || !isDrawing || !currentStrokeRef.current) return;
    e.preventDefault();

    const pt = getCanvasCoords(e);
    currentStrokeRef.current.points.push(pt);

    // Pintar segmento en el canvas local inmediatamente
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const points = currentStrokeRef.current.points;
    const prevPt = points[points.length - 2];

    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = selectedColor;
    ctx.lineWidth = brushSize;
    ctx.beginPath();
    ctx.moveTo(prevPt.x * CANVAS_WIDTH, prevPt.y * CANVAS_HEIGHT);
    ctx.lineTo(pt.x * CANVAS_WIDTH, pt.y * CANVAS_HEIGHT);
    ctx.stroke();
  };

  const handlePointerUp = (e) => {
    if (!isArtist || !isDrawing || !currentStrokeRef.current) return;
    e.preventDefault();

    setIsDrawing(false);
    onSendStroke(currentStrokeRef.current);
    currentStrokeRef.current = null;
  };

  return (
    <div className="w-full flex flex-col items-center select-none">
      {/* Marco del Lienzo */}
      <div className="relative w-full max-w-2xl aspect-[16/11] bg-white rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden border-4 border-slate-800 touch-none">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className={`w-full h-full block ${isArtist ? "cursor-crosshair" : "cursor-default"}`}
        />

        {/* Mensaje de espera si no es el artista */}
        {!isArtist && (
          <div className="absolute top-2 left-3 px-3 py-1 rounded-full bg-slate-900/75 backdrop-blur-sm text-slate-300 text-xs font-semibold flex items-center gap-1.5 shadow pointer-events-none">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>El artista está dibujando...</span>
          </div>
        )}
      </div>

      {/* Barra de Herramientas de Dibujo (Solo para el artista) */}
      {isArtist && (
        <div className="w-full max-w-2xl mt-3 bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-2xl p-2.5 sm:p-3 shadow-xl flex flex-wrap items-center justify-between gap-2.5">
          
          {/* Paleta de Colores */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1">
            {COLORS.map((c) => {
              const isSelected = selectedColor === c.hex;
              return (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => setSelectedColor(c.hex)}
                  title={c.name}
                  style={{ backgroundColor: c.hex }}
                  className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full transition-all shrink-0 border-2 ${
                    c.isEraser ? "border-slate-400 flex items-center justify-center text-slate-700" : "border-slate-800"
                  } ${
                    isSelected ? "ring-2 ring-indigo-400 ring-offset-2 ring-offset-slate-950 scale-125 z-10" : "hover:scale-110 opacity-90"
                  }`}
                >
                  {c.isEraser && <Eraser className="w-3.5 h-3.5" />}
                </button>
              );
            })}
          </div>

          {/* Selector de Tamaño de Pincel */}
          <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
            {BRUSH_SIZES.map((b) => (
              <button
                key={b.label}
                type="button"
                onClick={() => setBrushSize(b.size)}
                title={`Pincel ${b.label}`}
                className={`w-7 h-7 rounded-lg flex items-center justify-center transition ${
                  brushSize === b.size
                    ? "bg-indigo-600 text-white shadow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <div
                  style={{
                    width: `${Math.min(18, b.size + 4)}px`,
                    height: `${Math.min(18, b.size + 4)}px`
                  }}
                  className="rounded-full bg-current"
                />
              </button>
            ))}
          </div>

          {/* Acciones de Lienzo (Deshacer y Limpiar) */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onUndoStroke}
              title="Deshacer último trazo"
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1 transition active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Deshacer</span>
            </button>
            <button
              type="button"
              onClick={onClearCanvas}
              title="Borrar todo el lienzo"
              className="px-2.5 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 hover:text-white text-xs font-semibold flex items-center gap-1 transition active:scale-95"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Limpiar</span>
            </button>
          </div>

        </div>
      )}
    </div>
  );
}
