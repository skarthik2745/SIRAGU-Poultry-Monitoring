import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  Flame,
  ShieldAlert,
  Wind,
  Thermometer,
  Layers,
  MapPin,
  Compass,
  AlertOctagon,
  CheckCircle2,
  Activity,
  Maximize2
} from 'lucide-react';

interface ZoneSafetyTwin3DProps {
  selectedZoneId: string;
  onSelectZone: (zoneId: string) => void;
  zonesData: {
    id: string;
    name: string;
    sector: string;
    flameDetected: boolean;
    irIntrusion: boolean;
    temp: number;
    humidity: number;
    gasPpm: number;
    status: 'NORMAL' | 'WARNING' | 'CRITICAL';
    fanActive: boolean;
  }[];
}

export const ZoneSafetyTwin3D: React.FC<ZoneSafetyTwin3DProps> = ({
  selectedZoneId,
  onSelectZone,
  zonesData,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);

  const [overlayMode, setOverlayMode] = useState<'all' | 'thermal' | 'hazard' | 'security'>('all');
  const [cameraView, setCameraView] = useState<'perspective' | 'top' | 'focused'>('perspective');

  const threeRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    zoneMeshes: { [id: string]: THREE.Mesh };
    zoneBorders: { [id: string]: THREE.LineSegments };
    zonePillars: { [id: string]: THREE.Group };
    heatPlanes: { [id: string]: THREE.Mesh };
    fanBlades: THREE.Mesh[];
    alarmBeacons: { [id: string]: THREE.Mesh };
  } | null>(null);

  const orbitAngleRef = useRef({ theta: Math.PI / 4, phi: Math.PI / 3.2, radius: 26 });
  const orbitTargetRef = useRef(new THREE.Vector3(0, 0.8, 0));
  const isDraggingRef = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });

  // Zone 3D Bounds on floor [-7..+7] x [-4.5..+4.5]
  // Z1: NW (x: -3.8, z: -2.4)
  // Z2: NE (x: 3.8, z: -2.4)
  // Z3: SW (x: -3.8, z: 2.4)
  // Z4: SE (x: 3.8, z: 2.4)
  const zoneCoords: { [id: string]: [number, number] } = {
    'zone-1': [-3.8, -2.4],
    'zone-2': [3.8, -2.4],
    'zone-3': [-3.8, 2.4],
    'zone-4': [3.8, 2.4],
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 700;
    const height = container.clientHeight || 420;

    // 1. Scene with dark cyan security command room backdrop
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x040812);
    scene.fog = new THREE.Fog(0x040812, 20, 60);

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(48, width / height, 0.1, 100);
    camera.position.set(14, 16, 18);
    camera.lookAt(0, 0.5, 0);

    // 3. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0x1e293b, 1.8);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x38bdf8, 1.8);
    dirLight.position.set(10, 20, 10);
    scene.add(dirLight);

    // 5. Floor Technical Grid & Boundary
    const gridHelper = new THREE.GridHelper(20, 20, 0x06b6d4, 0x0f172a);
    gridHelper.position.y = 0.01;
    scene.add(gridHelper);

    // Perimeter holographic boundary wall
    const boundaryGeo = new THREE.BoxGeometry(16.4, 2.0, 10.4);
    const boundaryMat = new THREE.MeshBasicMaterial({
      color: 0x0284c7,
      wireframe: true,
      transparent: true,
      opacity: 0.25,
    });
    const boundary = new THREE.Mesh(boundaryGeo, boundaryMat);
    boundary.position.set(0, 1.0, 0);
    scene.add(boundary);

    // Central Security Dividing Cross (Splits shed into 4 quadrants)
    const crossMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.6 });
    // Horizontal divider
    const divH = new THREE.Mesh(new THREE.BoxGeometry(16.2, 0.6, 0.1), crossMat);
    divH.position.set(0, 0.3, 0);
    scene.add(divH);
    // Vertical divider
    const divV = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.6, 10.2), crossMat);
    divV.position.set(0, 0.3, 0);
    scene.add(divV);

    // 6. 4 Zone Interactive Floating Hologram Platforms
    const zoneMeshes: { [id: string]: THREE.Mesh } = {};
    const zoneBorders: { [id: string]: THREE.LineSegments } = {};
    const zonePillars: { [id: string]: THREE.Group } = {};
    const heatPlanes: { [id: string]: THREE.Mesh } = {};
    const alarmBeacons: { [id: string]: THREE.Mesh } = {};
    const fanBlades: THREE.Mesh[] = [];

    zonesData.forEach((zd) => {
      const [zx, zz] = zoneCoords[zd.id];
      const zGroup = new THREE.Group();
      zGroup.position.set(zx, 0, zz);

      // Floor quadrant pad
      const padGeo = new THREE.PlaneGeometry(7.4, 4.6);
      const padMat = new THREE.MeshStandardMaterial({
        color: zd.status === 'CRITICAL' ? 0xef4444 : zd.status === 'WARNING' ? 0xf59e0b : 0x0284c7,
        roughness: 0.6,
        metalness: 0.3,
        transparent: true,
        opacity: zd.id === selectedZoneId ? 0.45 : 0.2,
      });
      const padMesh = new THREE.Mesh(padGeo, padMat);
      padMesh.rotation.x = -Math.PI / 2;
      padMesh.position.y = 0.03;
      padMesh.name = zd.id;
      scene.add(padMesh);
      zoneMeshes[zd.id] = padMesh;

      // Glowing quadrant wire border
      const edges = new THREE.EdgesGeometry(padGeo);
      const lineMat = new THREE.LineBasicMaterial({
        color: zd.id === selectedZoneId ? 0x38bdf8 : 0x0284c7,
        linewidth: 2,
      });
      const border = new THREE.LineSegments(edges, lineMat);
      border.rotation.x = -Math.PI / 2;
      border.position.set(zx, 0.04, zz);
      scene.add(border);
      zoneBorders[zd.id] = border;

      // Central Sensor Pod Tower for this zone
      const podGroup = new THREE.Group();
      podGroup.position.set(zx, 0, zz);

      // Pedestal
      const pedGeo = new THREE.CylinderGeometry(0.3, 0.45, 0.4, 16);
      const pedMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8 });
      const ped = new THREE.Mesh(pedGeo, pedMat);
      ped.position.y = 0.2;
      podGroup.add(ped);

      // Mast
      const mastGeo = new THREE.CylinderGeometry(0.06, 0.06, 1.8, 8);
      const mastMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.9 });
      const mast = new THREE.Mesh(mastGeo, mastMat);
      mast.position.y = 1.1;
      podGroup.add(mast);

      // Sensor Head with dynamic beacon
      const beaconGeo = new THREE.OctahedronGeometry(0.28, 0);
      const beaconMat = new THREE.MeshBasicMaterial({
        color: zd.status === 'CRITICAL' ? 0xef4444 : zd.status === 'WARNING' ? 0xf59e0b : 0x10b981,
        wireframe: false,
      });
      const beacon = new THREE.Mesh(beaconGeo, beaconMat);
      beacon.position.y = 2.1;
      podGroup.add(beacon);
      alarmBeacons[zd.id] = beacon;

      // Pulsing radar ring
      const radarGeo = new THREE.RingGeometry(0.5, 0.65, 24);
      const radarMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.7,
      });
      const radar = new THREE.Mesh(radarGeo, radarMat);
      radar.rotation.x = Math.PI / 2;
      radar.position.y = 2.1;
      radar.name = 'radar';
      podGroup.add(radar);

      // Zone Label text floating in 3D
      const labelCanvas = document.createElement('canvas');
      labelCanvas.width = 512;
      labelCanvas.height = 128;
      const ctx = labelCanvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, 512, 128);
        ctx.strokeStyle = zd.status === 'CRITICAL' ? '#ef4444' : '#06b6d4';
        ctx.lineWidth = 6;
        ctx.strokeRect(6, 6, 500, 116);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 42px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${zd.name.split('—')[0].trim()} (${zd.sector})`, 256, 75);
      }
      const labelTex = new THREE.CanvasTexture(labelCanvas);
      const labelMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(2.4, 0.6),
        new THREE.MeshBasicMaterial({ map: labelTex, transparent: true })
      );
      labelMesh.position.set(0, 2.7, 0);
      podGroup.add(labelMesh);

      scene.add(podGroup);
      zonePillars[zd.id] = podGroup;
    });

    threeRef.current = {
      scene,
      camera,
      renderer,
      zoneMeshes,
      zoneBorders,
      zonePillars,
      heatPlanes,
      fanBlades,
      alarmBeacons,
    };

    // Resize
    const handleResize = () => {
      if (!container || !threeRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      threeRef.current.camera.aspect = w / h;
      threeRef.current.camera.updateProjectionMatrix();
      threeRef.current.renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Animation Loop
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      if (!threeRef.current) return;
      const { camera, zonePillars, alarmBeacons } = threeRef.current;

      // Rotate Sensor Pod heads & pulse radar rings
      Object.entries(zonePillars).forEach(([zid, grp]) => {
        const beacon = alarmBeacons[zid];
        if (beacon) {
          beacon.rotation.y += delta * 3;
          beacon.rotation.x = Math.sin(time * 2) * 0.2;
        }
        const radar = grp.getObjectByName('radar');
        if (radar) {
          const s = 1 + Math.sin(time * 4 + zid.charCodeAt(4)) * 0.3;
          radar.scale.set(s, s, s);
        }
      });

      // Camera views
      if (cameraView === 'top') {
        camera.position.lerp(new THREE.Vector3(0, 22, 0.01), 0.08);
        camera.lookAt(0, 0, 0);
      } else if (cameraView === 'focused') {
        const [fx, fz] = zoneCoords[selectedZoneId] || [0, 0];
        const target = new THREE.Vector3(fx, 0.5, fz);
        const camPos = new THREE.Vector3(fx + 6, 6, fz + 8);
        camera.position.lerp(camPos, 0.08);
        camera.lookAt(target);
      } else {
        // Perspective Orbit
        const { theta, phi, radius } = orbitAngleRef.current;
        const target = orbitTargetRef.current;
        const x = target.x + radius * Math.sin(phi) * Math.sin(theta);
        const y = target.y + radius * Math.cos(phi);
        const z = target.z + radius * Math.sin(phi) * Math.cos(theta);
        camera.position.lerp(new THREE.Vector3(x, y, z), 0.1);
        camera.lookAt(target);
      }

      threeRef.current.renderer.render(threeRef.current.scene, threeRef.current.camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, []);

  // Update selection & hazard styling
  useEffect(() => {
    if (!threeRef.current) return;
    const { zoneMeshes, alarmBeacons } = threeRef.current;

    zonesData.forEach((zd) => {
      const mesh = zoneMeshes[zd.id];
      if (mesh) {
        const mat = mesh.material as THREE.MeshStandardMaterial;
        const isSelected = zd.id === selectedZoneId;
        mat.opacity = isSelected ? 0.55 : 0.2;

        if (zd.status === 'CRITICAL') {
          mat.color.setHex(0xef4444);
        } else if (zd.status === 'WARNING') {
          mat.color.setHex(0xf59e0b);
        } else {
          mat.color.setHex(isSelected ? 0x0284c7 : 0x0369a1);
        }
      }

      const beacon = alarmBeacons[zd.id];
      if (beacon) {
        const bMat = beacon.material as THREE.MeshBasicMaterial;
        if (zd.status === 'CRITICAL') {
          bMat.color.setHex(0xef4444);
        } else if (zd.status === 'WARNING') {
          bMat.color.setHex(0xf59e0b);
        } else {
          bMat.color.setHex(0x10b981);
        }
      }
    });
  }, [selectedZoneId, zonesData]);

  // Mouse drag orbit handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    lastMouseRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - lastMouseRef.current.x;
    const dy = e.clientY - lastMouseRef.current.y;
    lastMouseRef.current = { x: e.clientX, y: e.clientY };

    if (cameraView === 'perspective') {
      orbitAngleRef.current.theta -= dx * 0.007;
      orbitAngleRef.current.phi -= dy * 0.007;
      orbitAngleRef.current.phi = Math.max(0.1, Math.min(Math.PI / 2 - 0.05, orbitAngleRef.current.phi));
    }
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (cameraView === 'perspective') {
      orbitAngleRef.current.radius += e.deltaY * 0.015;
      orbitAngleRef.current.radius = Math.max(10, Math.min(40, orbitAngleRef.current.radius));
    }
  };

  // Click Raycaster for selecting Zone in 3D
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (!threeRef.current || !mountRef.current) return;
    const rect = mountRef.current.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), threeRef.current.camera);

    const intersects = raycaster.intersectObjects(Object.values(threeRef.current.zoneMeshes));
    if (intersects.length > 0) {
      const hitName = intersects[0].object.name;
      if (hitName && zoneCoords[hitName]) {
        onSelectZone(hitName);
      }
    }
  };

  const activeZone = zonesData.find((z) => z.id === selectedZoneId) || zonesData[0];

  return (
    <div className="flex flex-col w-full rounded-2xl overflow-hidden border-2 border-cyan-500/30 bg-slate-950 shadow-2xl">
      {/* Top Controls Header */}
      <div className="bg-slate-900/90 border-b border-slate-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 select-none">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-black text-white uppercase tracking-wider block">
              Multi-Zone Safety Command Twin (3D Holographic Matrix)
            </span>
            <span className="text-[10px] text-slate-400">
              Interactive 4-Quadrant Spatial Telemetry & Actuator Grid
            </span>
          </div>
        </div>

        {/* Camera Perspective Switches */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs">
          <button
            onClick={() => setCameraView('perspective')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
              cameraView === 'perspective' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            3D Orbit
          </button>
          <button
            onClick={() => setCameraView('top')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
              cameraView === 'top' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            Top Matrix
          </button>
          <button
            onClick={() => setCameraView('focused')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
              cameraView === 'focused' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            Focus Selected Zone
          </button>
        </div>
      </div>

      {/* 3D WebGL Canvas */}
      <div className="relative w-full">
        <div
          ref={mountRef}
          className="w-full h-[380px] md:h-[440px] cursor-grab active:cursor-grabbing outline-none"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onWheel={handleWheel}
          onClick={handleCanvasClick}
        />

        {/* Floating Quick Selector Buttons for 4 Zones directly inside the 3D canvas */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 max-w-sm pointer-events-auto">
          {zonesData.map((z, idx) => (
            <button
              key={z.id}
              onClick={() => onSelectZone(z.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 backdrop-blur-md shadow-lg border ${
                selectedZoneId === z.id
                  ? 'bg-cyan-500 text-slate-950 border-cyan-300 ring-2 ring-cyan-400/50'
                  : 'bg-slate-900/85 text-slate-300 border-slate-700 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  z.status === 'CRITICAL'
                    ? 'bg-rose-500 animate-ping'
                    : z.status === 'WARNING'
                    ? 'bg-amber-400'
                    : 'bg-emerald-400'
                }`}
              />
              <span>Zone {idx + 1} ({z.sector})</span>
            </button>
          ))}
        </div>

        {/* Selected Zone Quick HUD Overlay */}
        <div className="absolute bottom-3 right-3 pointer-events-none p-3.5 rounded-xl bg-slate-900/90 backdrop-blur-md border border-cyan-500/40 shadow-2xl min-w-[210px]">
          <div className="text-[10px] text-cyan-400 uppercase font-bold tracking-wider mb-1">
            Active Quadrant Inspection
          </div>
          <div className="text-sm font-black text-white">{activeZone.name.split('—')[0]}</div>
          <div className="text-xs font-mono text-slate-300 mt-1 flex items-center justify-between">
            <span>Temp: {activeZone.temp}°C</span>
            <span>NH3: {activeZone.gasPpm} ppm</span>
          </div>
          <div className="text-[11px] font-mono mt-1.5 flex items-center justify-between">
            <span className="text-slate-400">Flame / IR:</span>
            <span className={activeZone.flameDetected ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
              {activeZone.flameDetected ? '🔥 FIRE' : '🟢 SAFE'} / {activeZone.irIntrusion ? '🚨 BREACH' : 'SECURE'}
            </span>
          </div>
        </div>

        {/* Helper guide */}
        <div className="absolute bottom-3 left-3 pointer-events-none px-2.5 py-1 rounded-lg bg-slate-900/80 backdrop-blur-md border border-slate-800 text-[10px] font-mono text-slate-400">
          Click any 3D floor quadrant to select zone
        </div>
      </div>
    </div>
  );
};
