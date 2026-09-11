import React, { useEffect, useRef, useState, useCallback } from 'react';
import { PoultryState } from '../../services/iotDataService';
import { iotDataService } from '../../services/iotDataService';
import {
  Layers,
  Eye,
  Maximize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sparkles,
  Play,
  Flame,
  ShieldAlert,
  Wind,
  Thermometer,
  Cpu,
  Camera,
  RotateCw
} from 'lucide-react';

interface DigitalTwinCanvasProps {
  state: PoultryState;
  onSelectSensor: (sensorId: string) => void;
}

interface Chicken {
  id: number;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  speed: number;
  state: 'idle' | 'walking' | 'pecking';
  stateTimer: number;
  facingLeft: boolean;
  color: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
}

export const DigitalTwinCanvas: React.FC<DigitalTwinCanvasProps> = ({
  state,
  onSelectSensor,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [viewMode, setViewMode] = useState<'isometric' | 'topdown'>('isometric');
  const [showSensors, setShowSensors] = useState(true);
  const [showAirflow, setShowAirflow] = useState(true);
  const [showActivityHeatmap, setShowActivityHeatmap] = useState(false);
  const [hoveredSensor, setHoveredSensor] = useState<string | null>(null);

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  // Chickens state ref for animation
  const chickensRef = useRef<Chicken[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const fanAngleRef = useRef(0);
  const flameTimerRef = useRef(0);
  const animFrameRef = useRef<number | null>(null);

  // Initialize chickens
  useEffect(() => {
    const chickenList: Chicken[] = [];
    const colors = ['#f8fafc', '#fef08a', '#ffedd5', '#f1f5f9', '#fef9c3'];
    for (let i = 0; i < 14; i++) {
      chickenList.push({
        id: i,
        x: 120 + Math.random() * 400,
        y: 100 + Math.random() * 260,
        targetX: 120 + Math.random() * 400,
        targetY: 100 + Math.random() * 260,
        speed: 0.4 + Math.random() * 0.4,
        state: 'idle',
        stateTimer: Math.random() * 60,
        facingLeft: Math.random() > 0.5,
        color: colors[i % colors.length],
      });
    }
    chickensRef.current = chickenList;
  }, []);

  // Sensor node definition on the poultry shed grid
  const sensors = [
    {
      id: 'dht11',
      name: 'DHT11 Climate',
      type: 'temp_hum',
      gridX: 420,
      gridY: 70,
      icon: Thermometer,
      value: `${state.dht11.temperature}°C / ${state.dht11.humidity}%`,
      status: state.dht11.tempStatus,
      pinColor: state.dht11.tempStatus === 'CRITICAL' ? '#f43f5e' : state.dht11.tempStatus === 'WARNING' ? '#f59e0b' : '#10b981',
    },
    {
      id: 'mq2',
      name: 'MQ-2 Gas Sensor',
      type: 'gas',
      gridX: 160,
      gridY: 130,
      icon: Wind,
      value: `${state.mq2.gasPpm} ppm`,
      status: state.mq2.status,
      pinColor: state.mq2.status === 'CRITICAL' ? '#f43f5e' : state.mq2.status === 'WARNING' ? '#f59e0b' : '#10b981',
    },
    {
      id: 'flame',
      name: 'Flame Detector',
      type: 'fire',
      gridX: 380,
      gridY: 210,
      icon: Flame,
      value: state.flame.detected ? 'DETECTED' : 'SAFE',
      status: state.flame.detected ? 'CRITICAL' : 'SAFE',
      pinColor: state.flame.detected ? '#f43f5e' : '#10b981',
    },
    {
      id: 'ir',
      name: 'IR Intrusion Barrier',
      type: 'security',
      gridX: 110,
      gridY: 330,
      icon: ShieldAlert,
      value: state.ir.intrusionDetected ? 'BREACH' : 'SECURE',
      status: state.ir.intrusionDetected ? 'CRITICAL' : 'SECURE',
      pinColor: state.ir.intrusionDetected ? '#f43f5e' : '#10b981',
    },
    {
      id: 'servo',
      name: 'Automatic Feeder',
      type: 'feeder',
      gridX: 430,
      gridY: 310,
      icon: RotateCw,
      value: state.feeder.status === 'DISPENSING' ? 'DISPENSING' : `${state.feeder.servoAngle}°`,
      status: state.feeder.status === 'DISPENSING' ? 'WARNING' : 'NORMAL',
      pinColor: state.feeder.status === 'DISPENSING' ? '#06b6d4' : '#10b981',
    },
    {
      id: 'esp32',
      name: 'ESP32 Gateway',
      type: 'controller',
      gridX: 290,
      gridY: 40,
      icon: Cpu,
      value: 'ONLINE',
      status: 'NORMAL',
      pinColor: '#06b6d4',
    },
    {
      id: 'camera',
      name: 'AI Vision Cam',
      type: 'camera',
      gridX: 280,
      gridY: 180,
      icon: Camera,
      value: 'AI TRACKING',
      status: 'NORMAL',
      pinColor: '#06b6d4',
    },
  ];

  // Helper coordinate converter
  const toScreen = useCallback(
    (x: number, y: number, z: number = 0) => {
      if (viewMode === 'topdown') {
        return {
          x: 140 + x * 0.95,
          y: 70 + y * 0.95 - z * 0.5,
        };
      }
      // 2.5D Isometric projection: origin centered around (340, 140)
      const originX = 350;
      const originY = 130;
      const tileWidthHalf = 0.82;
      const tileHeightHalf = 0.44;

      const screenX = originX + (x - y) * tileWidthHalf;
      const screenY = originY + (x + y) * tileHeightHalf - z;
      return { x: screenX, y: screenY };
    },
    [viewMode]
  );

  // Interactive Click detection on canvas
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left - pan.x) / zoom;
    const mouseY = (e.clientY - rect.top - pan.y) / zoom;

    // Check collision with sensor nodes
    for (const sensor of sensors) {
      const { x: sx, y: sy } = toScreen(sensor.gridX, sensor.gridY, 30);
      const dist = Math.hypot(mouseX - sx, mouseY - sy);
      if (dist < 26) {
        onSelectSensor(sensor.id);
        return;
      }
    }

    // Check collision with feeder hopper zone
    const { x: fx, y: fy } = toScreen(430, 310, 0);
    if (Math.hypot(mouseX - fx, mouseY - fy) < 40) {
      onSelectSensor('servo');
    }
  };

  // Canvas Mouse Move for Hover Tooltip
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDraggingRef.current) {
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      setPan((p) => ({ x: p.x + dx, y: dy }));
      dragStartRef.current = { x: e.clientX, y: e.clientY };
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left - pan.x) / zoom;
    const mouseY = (e.clientY - rect.top - pan.y) / zoom;

    let found: string | null = null;
    for (const sensor of sensors) {
      const { x: sx, y: sy } = toScreen(sensor.gridX, sensor.gridY, 30);
      if (Math.hypot(mouseX - sx, mouseY - sy) < 26) {
        found = sensor.id;
        break;
      }
    }
    setHoveredSensor(found);
  };

  // Main Canvas Rendering Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let running = true;

    const render = () => {
      if (!running) return;

      // Clear Canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      // Apply Pan & Zoom
      ctx.translate(pan.x, pan.y);
      ctx.scale(zoom, zoom);

      // 1. Render Background grid & ambient shed floor
      renderShedArchitecture(ctx);

      // 2. Render Heatmap if toggled
      if (showActivityHeatmap) {
        renderFlockHeatmap(ctx);
      }

      // 3. Render Equipment & Fixtures
      renderEquipment(ctx);

      // 4. Render Dynamic Hazards & Environmental Effects
      renderHazardEffects(ctx);

      // 5. Update and Render Chickens
      renderChickens(ctx);

      // 6. Airflow Vectors
      if (showAirflow) {
        renderAirflowVectors(ctx);
      }

      // 7. Sensor Nodes & Glowing Halos
      if (showSensors) {
        renderSensorNodes(ctx);
      }

      ctx.restore();

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      running = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [state, viewMode, showSensors, showAirflow, showActivityHeatmap, hoveredSensor, zoom, pan, toScreen]);

  // --- Sub-renderers ---

  const renderShedArchitecture = (ctx: CanvasRenderingContext2D) => {
    // Shed base coordinates on grid: (40, 40) to (540, 420)
    const p1 = toScreen(40, 40, 0);
    const p2 = toScreen(540, 40, 0);
    const p3 = toScreen(540, 420, 0);
    const p4 = toScreen(40, 420, 0);

    // Shed Floor Fill (Wood shavings / straw texture)
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.lineTo(p3.x, p3.y);
    ctx.lineTo(p4.x, p4.y);
    ctx.closePath();

    const floorGrad = ctx.createLinearGradient(p1.x, p1.y, p3.x, p3.y);
    floorGrad.addColorStop(0, '#151f2e');
    floorGrad.addColorStop(0.5, '#1e293b');
    floorGrad.addColorStop(1, '#0f172a');
    ctx.fillStyle = floorGrad;
    ctx.fill();

    // Floor outline
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Floor Grid lines
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
    ctx.lineWidth = 1;
    for (let x = 90; x < 540; x += 50) {
      const a = toScreen(x, 40, 0);
      const b = toScreen(x, 420, 0);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
    for (let y = 90; y < 420; y += 50) {
      const a = toScreen(40, y, 0);
      const b = toScreen(540, y, 0);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }

    if (viewMode === 'isometric') {
      // Rear Wall (p1 to p2) extruded up z = 85
      const p1Top = toScreen(40, 40, 85);
      const p2Top = toScreen(540, 40, 85);
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.lineTo(p2Top.x, p2Top.y);
      ctx.lineTo(p1Top.x, p1Top.y);
      ctx.closePath();
      ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
      ctx.stroke();

      // Left Wall (p1 to p4) extruded up z = 85
      const p4Top = toScreen(40, 420, 85);
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p4.x, p4.y);
      ctx.lineTo(p4Top.x, p4Top.y);
      ctx.lineTo(p1Top.x, p1Top.y);
      ctx.closePath();
      ctx.fillStyle = 'rgba(30, 41, 59, 0.65)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
      ctx.stroke();

      // Translucent roof trusses
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.2)';
      ctx.lineWidth = 1.5;
      const roofPeak1 = toScreen(290, 40, 115);
      const roofPeak2 = toScreen(290, 420, 115);
      ctx.moveTo(p1Top.x, p1Top.y);
      ctx.lineTo(roofPeak1.x, roofPeak1.y);
      ctx.lineTo(p2Top.x, p2Top.y);
      ctx.moveTo(roofPeak1.x, roofPeak1.y);
      ctx.lineTo(roofPeak2.x, roofPeak2.y);
      ctx.stroke();
    }
  };

  const renderEquipment = (ctx: CanvasRenderingContext2D) => {
    // 1. Water Drinker Line across shed at y = 190
    const w1 = toScreen(70, 190, 15);
    const w2 = toScreen(510, 190, 15);
    ctx.beginPath();
    ctx.moveTo(w1.x, w1.y);
    ctx.lineTo(w2.x, w2.y);
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Water Droplet nipples
    for (let x = 110; x <= 470; x += 60) {
      const nip = toScreen(x, 190, 15);
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(nip.x, nip.y + 4, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. Automatic Feeder Hopper at (430, 310)
    const hopperBase = toScreen(430, 310, 0);
    const hopperTop = toScreen(430, 310, 45);

    // Pan plate
    ctx.beginPath();
    ctx.ellipse(hopperBase.x, hopperBase.y, 22, 11, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#334155';
    ctx.fill();
    ctx.strokeStyle = state.feeder.status === 'DISPENSING' ? '#38bdf8' : '#64748b';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Feed grains inside pan
    ctx.beginPath();
    ctx.ellipse(hopperBase.x, hopperBase.y - 2, 16, 7, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#d97706';
    ctx.fill();

    // Conical Feeder Tube
    ctx.beginPath();
    ctx.moveTo(hopperBase.x - 12, hopperBase.y - 6);
    ctx.lineTo(hopperTop.x - 20, hopperTop.y);
    ctx.lineTo(hopperTop.x + 20, hopperTop.y);
    ctx.lineTo(hopperBase.x + 12, hopperBase.y - 6);
    ctx.closePath();
    const hopperGrad = ctx.createLinearGradient(hopperTop.x - 20, hopperTop.y, hopperTop.x + 20, hopperTop.y);
    hopperGrad.addColorStop(0, '#0f766e');
    hopperGrad.addColorStop(0.5, '#14b8a6');
    hopperGrad.addColorStop(1, '#0d9488');
    ctx.fillStyle = hopperGrad;
    ctx.fill();
    ctx.strokeStyle = '#2dd4bf';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Servo Arm Indicator
    const servoAngleRad = (state.feeder.servoAngle * Math.PI) / 180;
    const servoPivotX = hopperBase.x;
    const servoPivotY = hopperBase.y - 8;
    const armEndX = servoPivotX + Math.cos(servoAngleRad) * 14;
    const armEndY = servoPivotY - Math.sin(servoAngleRad) * 7;

    ctx.beginPath();
    ctx.moveTo(servoPivotX, servoPivotY);
    ctx.lineTo(armEndX, armEndY);
    ctx.strokeStyle = state.feeder.status === 'DISPENSING' ? '#38bdf8' : '#f59e0b';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Dispensing Particles animation
    if (state.feeder.status === 'DISPENSING') {
      for (let p = 0; p < 4; p++) {
        const px = hopperBase.x + (Math.random() * 16 - 8);
        const py = hopperBase.y - (Math.random() * 20);
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(px, py, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 3. Wall Exhaust Fans at (540, 160) and (540, 290)
    fanAngleRef.current += state.dht11.tempStatus === 'CRITICAL' ? 0.35 : state.dht11.tempStatus === 'WARNING' ? 0.22 : 0.1;
    [160, 290].forEach((fanY) => {
      const fPos = toScreen(540, fanY, 40);
      // Fan housing
      ctx.beginPath();
      ctx.arc(fPos.x, fPos.y, 14, 0, Math.PI * 2);
      ctx.fillStyle = '#0f172a';
      ctx.fill();
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Spinning blades
      ctx.save();
      ctx.translate(fPos.x, fPos.y);
      ctx.rotate(fanAngleRef.current);
      for (let b = 0; b < 3; b++) {
        ctx.rotate((Math.PI * 2) / 3);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(4, -11);
        ctx.lineTo(-4, -11);
        ctx.closePath();
        ctx.fillStyle = '#38bdf8';
        ctx.fill();
      }
      ctx.restore();
    });

    // 4. North Entryway with Door Barrier Frame at (40, 330)
    const doorBottom = toScreen(40, 330, 0);
    const doorTop = toScreen(40, 330, 60);
    ctx.beginPath();
    ctx.moveTo(doorBottom.x, doorBottom.y);
    ctx.lineTo(doorTop.x, doorTop.y);
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 3;
    ctx.stroke();
  };

  const renderHazardEffects = (ctx: CanvasRenderingContext2D) => {
    // A. FIRE EMERGENCY ANIMATION
    if (state.flame.detected || state.activeScenario === 'FIRE') {
      flameTimerRef.current += 0.2;
      const fireOrigin = toScreen(380, 210, 0);

      // Flashing shed emergency beacon
      const flashAlpha = Math.abs(Math.sin(flameTimerRef.current * 2));
      ctx.fillStyle = `rgba(244, 63, 94, ${0.18 * flashAlpha})`;
      ctx.fillRect(0, 0, 1000, 800);

      // Flickering flame particles
      for (let i = 0; i < 22; i++) {
        const spread = (i - 11) * 3;
        const flameHeight = 25 + Math.sin(flameTimerRef.current + i) * 18;
        const fx = fireOrigin.x + spread + (Math.random() * 8 - 4);
        const fy = fireOrigin.y - (Math.random() * flameHeight);

        ctx.beginPath();
        ctx.arc(fx, fy, 4 + Math.random() * 6, 0, Math.PI * 2);
        ctx.fillStyle = i % 3 === 0 ? '#ef4444' : i % 3 === 1 ? '#f97316' : '#facc15';
        ctx.globalAlpha = 0.8;
        ctx.fill();
      }
      ctx.globalAlpha = 1.0;

      // Emergency text banner on shed
      ctx.fillStyle = '#f43f5e';
      ctx.font = 'bold 12px monospace';
      ctx.fillText('🚨 CRITICAL FIRE ALARM: ZONE 2', fireOrigin.x - 90, fireOrigin.y - 45);
    }

    // B. GAS / TOXIC NH3 BUILDUP
    if (state.mq2.status !== 'SAFE' || state.activeScenario === 'HIGH_GAS') {
      const gasOrigin = toScreen(160, 130, 20);
      const isCritical = state.mq2.status === 'CRITICAL' || state.activeScenario === 'HIGH_GAS';
      const radius = isCritical ? 65 : 45;

      const grad = ctx.createRadialGradient(gasOrigin.x, gasOrigin.y, 5, gasOrigin.x, gasOrigin.y, radius);
      grad.addColorStop(0, isCritical ? 'rgba(239, 68, 68, 0.45)' : 'rgba(234, 179, 8, 0.35)');
      grad.addColorStop(0.6, isCritical ? 'rgba(249, 115, 22, 0.25)' : 'rgba(163, 230, 53, 0.2)');
      grad.addColorStop(1, 'transparent');

      ctx.beginPath();
      ctx.arc(gasOrigin.x, gasOrigin.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      // Gas warning label
      ctx.fillStyle = isCritical ? '#f87171' : '#fde047';
      ctx.font = 'bold 10px monospace';
      ctx.fillText(`💨 NH3 GAS: ${state.mq2.gasPpm} ppm`, gasOrigin.x - 45, gasOrigin.y - radius - 6);
    }

    // C. INTRUSION LASER PERIMETER TRIPWIRE
    const beamStart = toScreen(40, 290, 12);
    const beamEnd = toScreen(150, 370, 12);

    ctx.beginPath();
    ctx.moveTo(beamStart.x, beamStart.y);
    ctx.lineTo(beamEnd.x, beamEnd.y);
    const isBreached = state.ir.intrusionDetected || state.activeScenario === 'INTRUSION';

    if (isBreached) {
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 3.5;
      ctx.stroke();

      // Pulse glow
      ctx.strokeStyle = 'rgba(244, 63, 94, 0.4)';
      ctx.lineWidth = 10;
      ctx.stroke();

      // Warning marker
      const midX = (beamStart.x + beamEnd.x) / 2;
      const midY = (beamStart.y + beamEnd.y) / 2;
      ctx.fillStyle = '#f43f5e';
      ctx.font = 'bold 11px monospace';
      ctx.fillText('🚨 PERIMETER BREACH!', midX - 50, midY - 14);
    } else {
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // D. HIGH TEMPERATURE HEATWAVE DISTORTION
    if (state.dht11.tempStatus !== 'NORMAL' || state.activeScenario === 'HIGH_TEMP') {
      ctx.strokeStyle = state.dht11.tempStatus === 'CRITICAL' ? 'rgba(239, 68, 68, 0.35)' : 'rgba(245, 158, 11, 0.25)';
      ctx.lineWidth = 1.5;
      const t = Date.now() * 0.003;
      for (let i = 0; i < 6; i++) {
        const xOffset = 180 + i * 50;
        const base = toScreen(xOffset, 200, 0);
        ctx.beginPath();
        ctx.moveTo(base.x, base.y);
        ctx.bezierCurveTo(
          base.x + Math.sin(t + i) * 12,
          base.y - 20,
          base.x - Math.sin(t + i) * 12,
          base.y - 45,
          base.x,
          base.y - 70
        );
        ctx.stroke();
      }
    }
  };

  const renderChickens = (ctx: CanvasRenderingContext2D) => {
    const isEmergency = state.flame.detected || state.activeScenario === 'FIRE';
    const isIntrusion = state.ir.intrusionDetected || state.activeScenario === 'INTRUSION';
    const isFeeding = state.feeder.status === 'DISPENSING';
    const isSluggish = state.poultryActivity.status === 'ABNORMAL_INACTIVE';

    chickensRef.current.forEach((chk) => {
      // Emergency behavior modifiers
      if (isEmergency) {
        chk.targetX = 100 + Math.random() * 80;
        chk.targetY = 100 + Math.random() * 80;
        chk.speed = 1.6;
      } else if (isIntrusion) {
        chk.targetX = 350 + Math.random() * 150;
        chk.targetY = 100 + Math.random() * 150;
        chk.speed = 1.4;
      } else if (isFeeding) {
        chk.targetX = 400 + Math.random() * 60;
        chk.targetY = 280 + Math.random() * 60;
        chk.speed = 1.1;
      } else if (isSluggish) {
        chk.speed = 0.08;
      }

      // Movement logic towards target
      const dx = chk.targetX - chk.x;
      const dy = chk.targetY - chk.y;
      const dist = Math.hypot(dx, dy);

      if (dist > 4) {
        chk.x += (dx / dist) * chk.speed;
        chk.y += (dy / dist) * chk.speed;
        chk.facingLeft = dx < 0;
        chk.state = 'walking';
      } else {
        chk.stateTimer -= 1;
        if (chk.stateTimer <= 0) {
          chk.state = Math.random() > 0.5 ? 'pecking' : 'idle';
          chk.stateTimer = 40 + Math.random() * 80;
          chk.targetX = 100 + Math.random() * 410;
          chk.targetY = 90 + Math.random() * 300;
        }
      }

      // Project chicken to screen
      const screenPos = toScreen(chk.x, chk.y, 0);

      // Render realistic miniature broiler silhouette
      ctx.save();
      ctx.translate(screenPos.x, screenPos.y);
      if (chk.facingLeft) ctx.scale(-1, 1);

      // Shadow
      ctx.beginPath();
      ctx.ellipse(0, 0, 7, 3, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.fill();

      // Body
      ctx.beginPath();
      ctx.ellipse(0, -6, 7, 5, 0, 0, Math.PI * 2);
      ctx.fillStyle = chk.color;
      ctx.fill();
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 0.8;
      ctx.stroke();

      // Head & Red Comb
      const headY = chk.state === 'pecking' ? -3 : -10;
      ctx.beginPath();
      ctx.arc(6, headY, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = chk.color;
      ctx.fill();

      // Beak
      ctx.beginPath();
      ctx.moveTo(9, headY);
      ctx.lineTo(12, headY + 1);
      ctx.lineTo(9, headY + 2);
      ctx.fillStyle = '#f97316';
      ctx.fill();

      // Comb
      ctx.beginPath();
      ctx.arc(6, headY - 3, 1.8, 0, Math.PI * 2);
      ctx.fillStyle = '#ef4444';
      ctx.fill();

      ctx.restore();
    });
  };

  const renderFlockHeatmap = (ctx: CanvasRenderingContext2D) => {
    chickensRef.current.forEach((chk) => {
      const pos = toScreen(chk.x, chk.y, 0);
      const radGrad = ctx.createRadialGradient(pos.x, pos.y, 2, pos.x, pos.y, 36);
      radGrad.addColorStop(0, 'rgba(6, 182, 212, 0.45)');
      radGrad.addColorStop(0.5, 'rgba(16, 185, 129, 0.2)');
      radGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = radGrad;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 36, 0, Math.PI * 2);
      ctx.fill();
    });
  };

  const renderAirflowVectors = (ctx: CanvasRenderingContext2D) => {
    const t = Date.now() * 0.002;
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 8]);
    ctx.lineDashOffset = -t * 20;

    for (let y = 120; y <= 360; y += 80) {
      const start = toScreen(60, y, 20);
      const end = toScreen(530, y, 20);
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
    }
    ctx.setLineDash([]);
  };

  const renderSensorNodes = (ctx: CanvasRenderingContext2D) => {
    sensors.forEach((sensor) => {
      const { x: sx, y: sy } = toScreen(sensor.gridX, sensor.gridY, 30);
      const isHovered = hoveredSensor === sensor.id;
      const isCritical = sensor.status === 'CRITICAL' || sensor.status === 'DETECTED' || sensor.status === 'BREACH';
      const isWarning = sensor.status === 'WARNING';

      // Stem line to floor
      const floorPos = toScreen(sensor.gridX, sensor.gridY, 0);
      ctx.beginPath();
      ctx.moveTo(floorPos.x, floorPos.y);
      ctx.lineTo(sx, sy);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Outer pulsing ring
      const pulseSize = (Date.now() % 2000) / 2000;
      ctx.beginPath();
      ctx.arc(sx, sy, 14 + pulseSize * 10, 0, Math.PI * 2);
      ctx.strokeStyle = sensor.pinColor;
      ctx.globalAlpha = 0.7 * (1 - pulseSize);
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.globalAlpha = 1.0;

      // Base Node circle
      ctx.beginPath();
      ctx.arc(sx, sy, isHovered ? 15 : 12, 0, Math.PI * 2);
      ctx.fillStyle = '#0f172a';
      ctx.fill();
      ctx.strokeStyle = sensor.pinColor;
      ctx.lineWidth = isCritical ? 3 : 2;
      ctx.stroke();

      // Inner glowing core
      ctx.beginPath();
      ctx.arc(sx, sy, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = sensor.pinColor;
      ctx.fill();

      // Floating Sensor Tag Label
      ctx.font = '600 10px sans-serif';
      const labelText = `${sensor.name}: ${sensor.value}`;
      const textWidth = ctx.measureText(labelText).width;

      const tagX = sx - textWidth / 2 - 6;
      const tagY = sy - (isHovered ? 28 : 22);

      // Label background pill
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.beginPath();
      ctx.roundRect(tagX, tagY - 10, textWidth + 12, 18, 4);
      ctx.fill();
      ctx.strokeStyle = isHovered ? '#38bdf8' : 'rgba(56, 189, 248, 0.3)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Label text
      ctx.fillStyle = isCritical ? '#f43f5e' : isWarning ? '#fbbf24' : '#e2e8f0';
      ctx.fillText(labelText, tagX + 6, tagY + 3);
    });
  };

  return (
    <div className="relative w-full rounded-2xl glass-panel border border-cyan-500/20 overflow-hidden shadow-2xl">
      {/* Top HUD Controls Bar */}
      <div className="absolute top-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 p-2 rounded-xl bg-slate-950/75 backdrop-blur-md border border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-cyan-400 flex items-center gap-1.5 px-2 py-1 rounded bg-cyan-950/40 border border-cyan-500/30">
            <Sparkles className="w-3.5 h-3.5" /> LIVE DIGITAL TWIN
          </span>
          <span className="text-slate-400 hidden sm:inline">Broiler Shed #04 Virtual Replica</span>
        </div>

        {/* View Controls & Toggles */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* View Perspective */}
          <div className="flex rounded-lg bg-slate-900 border border-slate-800 p-0.5">
            <button
              onClick={() => setViewMode('isometric')}
              className={`px-2.5 py-1 rounded-md transition-all font-medium ${
                viewMode === 'isometric' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Isometric 3D
            </button>
            <button
              onClick={() => setViewMode('topdown')}
              className={`px-2.5 py-1 rounded-md transition-all font-medium ${
                viewMode === 'topdown' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Top-Down Plan
            </button>
          </div>

          {/* Layer toggles */}
          <button
            onClick={() => setShowSensors((v) => !v)}
            className={`px-2 py-1 rounded-md border text-[11px] transition-all flex items-center gap-1 ${
              showSensors ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300' : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}
          >
            <Layers className="w-3 h-3" /> Sensors
          </button>

          <button
            onClick={() => setShowAirflow((v) => !v)}
            className={`px-2 py-1 rounded-md border text-[11px] transition-all flex items-center gap-1 ${
              showAirflow ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300' : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}
          >
            <Wind className="w-3 h-3" /> Airflow
          </button>

          <button
            onClick={() => setShowActivityHeatmap((v) => !v)}
            className={`px-2 py-1 rounded-md border text-[11px] transition-all flex items-center gap-1 ${
              showActivityHeatmap ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300' : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}
          >
            <Eye className="w-3 h-3" /> Heatmap
          </button>

          {/* Zoom controls */}
          <div className="flex items-center gap-1 pl-1 border-l border-slate-800">
            <button
              onClick={() => setZoom((z) => Math.min(1.8, z + 0.15))}
              className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoom((z) => Math.max(0.7, z - 0.15))}
              className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                setZoom(1);
                setPan({ x: 0, y: 0 });
              }}
              className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300"
              title="Reset View"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Canvas */}
      <div
        ref={containerRef}
        className="w-full h-[480px] md:h-[540px] bg-gradient-to-b from-[#05080e] via-[#090e18] to-[#060a12] cursor-crosshair relative flex items-center justify-center overflow-hidden"
      >
        <canvas
          ref={canvasRef}
          width={840}
          height={520}
          onClick={handleCanvasClick}
          onMouseMove={handleMouseMove}
          className="w-full h-full object-contain"
        />

        {/* Quick Click-to-Inspect Helper Tag */}
        <div className="absolute bottom-3 left-3 z-10 px-3 py-1.5 rounded-lg bg-black/65 backdrop-blur-sm border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
          <span>Click any sensor node or feeder to inspect real-time diagnostics & controls.</span>
        </div>

        {/* Quick Feeder Trigger Button on Canvas */}
        <div className="absolute bottom-3 right-3 z-10">
          <button
            onClick={() => iotDataService.dispenseFeeder(2000, 'Digital Twin Quick Dispense')}
            disabled={state.feeder.status === 'DISPENSING'}
            className="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/25 transition-all disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5" />
            {state.feeder.status === 'DISPENSING' ? 'Dispensing Mash...' : 'Trigger Feeder Cycle'}
          </button>
        </div>
      </div>
    </div>
  );
};
