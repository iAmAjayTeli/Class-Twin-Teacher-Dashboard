import { useEffect, useRef, useState, useCallback } from 'react';

const GRID_COLS = 20;
const GRID_ROWS = 12;

// Color gradient for heatmap (cold → hot)
function heatColor(value) {
  // value: 0 (cold) to 1 (hot)
  const v = Math.max(0, Math.min(1, value));
  if (v < 0.25) {

    // Transparent → Blue
    const t = v / 0.25;
    return `rgba(99, 102, 241, ${t * 0.4})`;
  } else if (v < 0.5) {
    // Blue → Cyan/Green
    const t = (v - 0.25) / 0.25;
    const r = Math.round(99 * (1 - t) + 74 * t);
    const g = Math.round(102 * (1 - t) + 225 * t);
    const b = Math.round(241 * (1 - t) + 118 * t);
    return `rgba(${r}, ${g}, ${b}, ${0.4 + t * 0.2})`;
  } else if (v < 0.75) {
    // Green → Yellow/Orange
    const t = (v - 0.5) / 0.25;
    const r = Math.round(74 * (1 - t) + 255 * t);
    const g = Math.round(225 * (1 - t) + 185 * t);
    const b = Math.round(118 * (1 - t) + 95 * t);
    return `rgba(${r}, ${g}, ${b}, ${0.6 + t * 0.15})`;
  } else {
    // Orange → Red
    const t = (v - 0.75) / 0.25;
    const r = Math.round(255 * (1 - t) + 255 * t);
    const g = Math.round(185 * (1 - t) + 80 * t);
    const b = Math.round(95 * (1 - t) + 80 * t);
    return `rgba(${r}, ${g}, ${b}, ${0.75 + t * 0.25})`;
  }
}

// Generate demo gaze patterns
function generateDemoData() {
  const grid = Array.from({ length: GRID_ROWS }, () => Array(GRID_COLS).fill(0));

  // Create hotspots that simulate realistic viewing patterns
  const hotspots = [
    { x: 10, y: 4, intensity: 1.0, spread: 3 },   // Center-top (main content)
    { x: 5, y: 6, intensity: 0.7, spread: 2 },     // Left-center (diagram)
    { x: 15, y: 3, intensity: 0.5, spread: 2 },    // Right-top (title)
    { x: 10, y: 8, intensity: 0.3, spread: 2 },    // Center-bottom (footer)
  ];

  // Apply gaussian-like distribution from each hotspot
  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      let val = 0;
      for (const hs of hotspots) {
        const dx = col - hs.x;
        const dy = row - hs.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        val += hs.intensity * Math.exp(-(dist * dist) / (2 * hs.spread * hs.spread));
      }
      // Add some noise
      val += (Math.random() * 0.05);
      grid[row][col] = Math.min(1, val);
    }
  }
  return grid;
}

export default function AttentionHeatmap({
  heatmapData,
  activeTrackers = 0,
  hotspots = [],
  deadZones = [],
  demoMode = false,
}) {
  const canvasRef = useRef(null);
  const [displayGrid, setDisplayGrid] = useState(null);
  const [hoveredCell, setHoveredCell] = useState(null);
  const demoIntervalRef = useRef(null);

  // Demo mode: generate data periodically
  useEffect(() => {
    if (demoMode) {
      setDisplayGrid(generateDemoData());
      demoIntervalRef.current = setInterval(() => {
        setDisplayGrid(prev => {
          const newGrid = generateDemoData();
          // Smooth interpolation with previous
          if (prev) {
            return newGrid.map((row, r) =>
              row.map((val, c) => prev[r][c] * 0.7 + val * 0.3)
            );
          }
          return newGrid;
        });
      }, 1500);

      return () => clearInterval(demoIntervalRef.current);
    } else {
      clearInterval(demoIntervalRef.current);
    }
  }, [demoMode]);

  // Use real data when available
  useEffect(() => {
    if (!demoMode && heatmapData) {
      setDisplayGrid(prev => {
        if (prev) {
          // Smooth transition
          return heatmapData.map((row, r) =>
            row.map((val, c) => (prev[r]?.[c] || 0) * 0.6 + val * 0.4)
          );
        }
        return heatmapData;
      });
    }
  }, [heatmapData, demoMode]);

  // Render heatmap on canvas
  useEffect(() => {
    if (!displayGrid || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const cellW = width / GRID_COLS;
    const cellH = height / GRID_ROWS;

    ctx.clearRect(0, 0, width, height);

    // Draw board background
    ctx.fillStyle = 'rgba(16, 20, 25, 0.95)';
    ctx.fillRect(0, 0, width, height);

    // Draw grid lines (faint)
    ctx.strokeStyle = 'rgba(192, 193, 255, 0.04)';
    ctx.lineWidth = 0.5;
    for (let c = 0; c <= GRID_COLS; c++) {
      ctx.beginPath();
      ctx.moveTo(c * cellW, 0);
      ctx.lineTo(c * cellW, height);
      ctx.stroke();
    }
    for (let r = 0; r <= GRID_ROWS; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * cellH);
      ctx.lineTo(width, r * cellH);
      ctx.stroke();
    }

    // Draw heatmap cells with gaussian blur effect
    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        const val = displayGrid[row]?.[col] || 0;
        if (val > 0.02) {
          // Draw a radial gradient for each cell for a smooth look
          const cx = col * cellW + cellW / 2;
          const cy = row * cellH + cellH / 2;
          const radius = Math.max(cellW, cellH) * 1.2;

          const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
          gradient.addColorStop(0, heatColor(val));
          gradient.addColorStop(1, 'rgba(0,0,0,0)');

          ctx.fillStyle = gradient;
          ctx.fillRect(col * cellW - cellW * 0.3, row * cellH - cellH * 0.3, cellW * 1.6, cellH * 1.6);
        }
      }
    }

    // Draw board content labels
    ctx.fillStyle = 'rgba(224, 226, 234, 0.12)';
    ctx.font = '12px Inter, sans-serif';
    ctx.textAlign = 'center';

    // Simulated board areas
    const boardAreas = [
      { label: 'Title / Header', x: width / 2, y: 30 },
      { label: 'Main Content Area', x: width / 2, y: height * 0.4 },
      { label: 'Diagram / Visual', x: width * 0.25, y: height * 0.55 },
      { label: 'Code / Formula', x: width * 0.75, y: height * 0.55 },
      { label: 'Summary / Notes', x: width / 2, y: height * 0.85 },
    ];

    boardAreas.forEach(area => {
      ctx.fillText(area.label, area.x, area.y);
    });

    // Draw hovered cell highlight
    if (hoveredCell) {
      ctx.strokeStyle = 'rgba(192, 193, 255, 0.5)';
      ctx.lineWidth = 2;
      ctx.strokeRect(
        hoveredCell.col * cellW,
        hoveredCell.row * cellH,
        cellW,
        cellH
      );
    }
  }, [displayGrid, hoveredCell]);

  const handleMouseMove = useCallback((e) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    const col = Math.floor((x * scaleX) / (canvasRef.current.width / GRID_COLS));
    const row = Math.floor((y * scaleY) / (canvasRef.current.height / GRID_ROWS));
    if (col >= 0 && col < GRID_COLS && row >= 0 && row < GRID_ROWS) {
      setHoveredCell({ row, col });
    }
  }, []);

  // Find max attention area
  let maxVal = 0, maxPos = { row: 0, col: 0 };
  let minVal = 1, minPos = { row: 0, col: 0 };
  if (displayGrid) {
    displayGrid.forEach((row, r) => {
      row.forEach((val, c) => {
        if (val > maxVal) { maxVal = val; maxPos = { row: r, col: c }; }
        if (val < minVal) { minVal = val; minPos = { row: r, col: c }; }
      });
    });
  }

  const trackerCount = demoMode ? 8 : activeTrackers;

  return (
    <div style={{
      backgroundColor: 'var(--surface-container)',
      borderRadius: '20px',
      border: '1px solid rgba(255,255,255,0.04)',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span className="material-symbols-outlined filled" style={{ color: '#c0c1ff', fontSize: '20px' }}>visibility</span>
          <span style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '-0.01em' }}>Attention Heatmap</span>
          {demoMode && (
            <span style={{
              padding: '2px 8px', borderRadius: '6px', fontSize: '9px',
              fontWeight: 700, letterSpacing: '0.05em',
              background: 'rgba(255, 185, 95, 0.12)', color: '#ffb95f',
              border: '1px solid rgba(255, 185, 95, 0.2)',
            }}>DEMO</span>
          )}
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: '4px 10px', borderRadius: '20px',
          background: 'rgba(74, 225, 118, 0.08)',
          border: '1px solid rgba(74, 225, 118, 0.15)',
        }}>
          <span style={{
            width: '6px', height: '6px', borderRadius: '50%',
            backgroundColor: '#4ae176',
            animation: 'pulse-glow 2s infinite',
          }} />
          <span style={{ fontSize: '11px', color: '#4ae176', fontWeight: 600 }}>
            {trackerCount} trackers
          </span>
        </div>
      </div>

      {/* Canvas */}
      <div style={{ position: 'relative', padding: '12px' }}>
        <canvas
          ref={canvasRef}
          width={800}
          height={480}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoveredCell(null)}
          style={{
            width: '100%',
            borderRadius: '12px',
            cursor: 'crosshair',
          }}
        />

        {/* Hovered cell tooltip */}
        {hoveredCell && displayGrid && (
          <div style={{
            position: 'absolute',
            bottom: '24px', left: '50%', transform: 'translateX(-50%)',
            padding: '6px 14px', borderRadius: '8px',
            backgroundColor: 'rgba(0,0,0,0.8)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(192, 193, 255, 0.15)',
            fontSize: '11px', fontFamily: 'monospace',
            color: '#e0e2ea',
            display: 'flex', gap: '12px',
            pointerEvents: 'none',
          }}>
            <span>Cell ({hoveredCell.col}, {hoveredCell.row})</span>
            <span style={{ color: '#c0c1ff' }}>
              Attention: {((displayGrid[hoveredCell.row]?.[hoveredCell.col] || 0) * 100).toFixed(0)}%
            </span>
          </div>
        )}
      </div>

      {/* Stats Row */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
        gap: '1px', backgroundColor: 'rgba(255,255,255,0.03)',
        borderTop: '1px solid rgba(255,255,255,0.04)',
      }}>
        <div style={{
          padding: '14px 16px',
          backgroundColor: 'var(--surface-container)',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--on-surface-variant)', marginBottom: '4px' }}>
            Hottest Zone
          </div>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#ff6b6b' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '14px', verticalAlign: 'middle', marginRight: '4px' }}>local_fire_department</span>
            ({maxPos.col}, {maxPos.row})
          </div>
        </div>
        <div style={{
          padding: '14px 16px',
          backgroundColor: 'var(--surface-container)',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--on-surface-variant)', marginBottom: '4px' }}>
            Dead Zone
          </div>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#6366f1' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '14px', verticalAlign: 'middle', marginRight: '4px' }}>visibility_off</span>
            ({minPos.col}, {minPos.row})
          </div>
        </div>
        <div style={{
          padding: '14px 16px',
          backgroundColor: 'var(--surface-container)',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--on-surface-variant)', marginBottom: '4px' }}>
            Focus Score
          </div>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#4ae176' }}>
            {displayGrid ? Math.round(maxVal * 100) : 0}%
          </div>
        </div>
      </div>

      {/* Color Legend */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: '8px', padding: '10px 16px',
        borderTop: '1px solid rgba(255,255,255,0.04)',
      }}>
        <span style={{ fontSize: '10px', color: 'var(--on-surface-variant)' }}>Low</span>
        <div style={{
          width: '120px', height: '6px', borderRadius: '3px',
          background: 'linear-gradient(to right, rgba(99, 102, 241, 0.3), #4ae176, #ffb95f, #ff6b6b)',
        }} />
        <span style={{ fontSize: '10px', color: 'var(--on-surface-variant)' }}>High</span>
      </div>
    </div>
  );
}
