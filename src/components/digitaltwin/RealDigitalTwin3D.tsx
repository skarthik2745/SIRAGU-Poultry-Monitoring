import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { PoultryState, iotDataService } from '../../services/iotDataService';
import {
  Compass,
  Footprints,
  Flame,
  ShieldAlert,
  Wind,
  Thermometer,
  Cpu,
  Camera,
  RotateCw,
  Eye,
  Activity,
  Layers,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Utensils,
  Power
} from 'lucide-react';

interface RealDigitalTwin3DProps {
  state: PoultryState;
  onSelectSensor: (sensorId: string) => void;
}

interface Sensor3DDef {
  id: string;
  name: string;
  type: string;
  pos: [number, number, number];
  icon: any;
  value: string;
  status: string;
  color: string;
}

export const RealDigitalTwin3D: React.FC<RealDigitalTwin3DProps> = ({
  state,
  onSelectSensor,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);

  // Active view: 'orbit' | 'walk' | 'top' | 'front' | 'side' | 'interior'
  const [activeView, setActiveView] = useState<'orbit' | 'walk' | 'top' | 'front' | 'side' | 'interior'>('orbit');

  const [showSensors, setShowSensors] = useState(true);
  const [showAirflow, setShowAirflow] = useState(true);
  const [showRoof, setShowRoof] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [hoveredSensor, setHoveredSensor] = useState<Sensor3DDef | null>(null);

  // Walk position & look orientation
  const walkPosRef = useRef(new THREE.Vector3(0, 1.5, 4));
  const walkYawRef = useRef(0);
  const walkPitchRef = useRef(0);
  const keysPressedRef = useRef<{ [key: string]: boolean }>({});

  // Orbit state
  const orbitAngleRef = useRef({ theta: Math.PI / 4.2, phi: Math.PI / 3.4, radius: 28 });
  const orbitTargetRef = useRef(new THREE.Vector3(0, 1.6, 0));
  const isDraggingOrbitRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });

  // Three.js instances ref
  const threeRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    chickens: { group: THREE.Group; vx: number; vz: number; speed: number; pecking: number }[];
    fans: THREE.Mesh[];
    particles: THREE.Points;
    particlePositions: Float32Array;
    sensorObjects: { [id: string]: THREE.Group };
    heatPlanes: THREE.Mesh[];
    feederMesh: THREE.Group | null;
    roofMesh: THREE.Group | null;
    flameLight: THREE.PointLight | null;
    raycaster: THREE.Raycaster;
    mouse: THREE.Vector2;
    ambientLight: THREE.AmbientLight;
    dirLight: THREE.DirectionalLight;
  } | null>(null);

  // Sensors definitions with 3D positions inside the farm unit
  const sensors: Sensor3DDef[] = [
    {
      id: 'dht11',
      name: 'DHT11 Climate Sensor',
      type: 'temp_hum',
      pos: [6.8, 2.2, -3.2],
      icon: Thermometer,
      value: `${state.dht11.temperature}°C / ${state.dht11.humidity}%`,
      status: state.dht11.tempStatus,
      color: state.dht11.tempStatus === 'CRITICAL' ? '#ef4444' : state.dht11.tempStatus === 'WARNING' ? '#f59e0b' : '#10b981',
    },
    {
      id: 'mq2',
      name: 'MQ-2 Gas / Ammonia Sensor',
      type: 'gas',
      pos: [-6.8, 2.2, -2.5],
      icon: Wind,
      value: `${state.mq2.gasPpm} ppm`,
      status: state.mq2.status,
      color: state.mq2.status === 'CRITICAL' ? '#ef4444' : state.mq2.status === 'WARNING' ? '#f59e0b' : '#10b981',
    },
    {
      id: 'flame',
      name: 'YG1006 Flame Detector',
      type: 'fire',
      pos: [0, 3.8, 0],
      icon: Flame,
      value: state.flame.detected ? '🔥 FIRE DETECTED' : 'SAFE',
      status: state.flame.detected ? 'CRITICAL' : 'SAFE',
      color: state.flame.detected ? '#ef4444' : '#10b981',
    },
    {
      id: 'ir',
      name: 'IR Intrusion Barrier',
      type: 'security',
      pos: [-8.2, 1.2, 5.0],
      icon: ShieldAlert,
      value: state.ir.intrusionDetected ? 'BREACH' : 'SECURE',
      status: state.ir.intrusionDetected ? 'CRITICAL' : 'SECURE',
      color: state.ir.intrusionDetected ? '#ef4444' : '#10b981',
    },
    {
      id: 'servo',
      name: 'Automated Red Bell Feeders',
      type: 'feeder',
      pos: [3.2, 1.0, 1.8],
      icon: RotateCw,
      value: state.feeder.status === 'DISPENSING' ? 'DISPENSING (90°)' : `IDLE (${state.feeder.servoAngle}°)`,
      status: state.feeder.status === 'DISPENSING' ? 'WARNING' : 'NORMAL',
      color: state.feeder.status === 'DISPENSING' ? '#ef4444' : '#10b981',
    },
    {
      id: 'esp32',
      name: 'Control Room Gateway',
      type: 'controller',
      pos: [11.2, 1.8, -2.0],
      icon: Cpu,
      value: state.isHardwareConnected ? 'LIVE ESP32' : 'SIMULATION',
      status: 'NORMAL',
      color: '#0284c7',
    },
    {
      id: 'camera',
      name: 'AI Flock Vision Camera',
      type: 'camera',
      pos: [0, 3.8, -4.8],
      icon: Camera,
      value: 'AI CV TRACKING',
      status: 'NORMAL',
      color: '#0284c7',
    },
  ];

  // Helper to create chicken model (White broiler breed matching image)
  const createChickenModel = () => {
    const chickenGroup = new THREE.Group();
    // Body
    const bodyGeo = new THREE.BoxGeometry(0.38, 0.3, 0.46);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.8,
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.22;
    body.castShadow = true;
    chickenGroup.add(body);

    // Head
    const headGeo = new THREE.BoxGeometry(0.18, 0.2, 0.18);
    const headMat = new THREE.MeshStandardMaterial({ color: 0xfafafa, roughness: 0.7 });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.set(0, 0.38, 0.2);
    head.castShadow = true;
    chickenGroup.add(head);

    // Comb
    const combGeo = new THREE.BoxGeometry(0.05, 0.1, 0.14);
    const combMat = new THREE.MeshStandardMaterial({ color: 0xdc2626 });
    const comb = new THREE.Mesh(combGeo, combMat);
    comb.position.set(0, 0.5, 0.2);
    chickenGroup.add(comb);

    // Yellow beak
    const beakGeo = new THREE.ConeGeometry(0.045, 0.1, 4);
    const beakMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b });
    const beak = new THREE.Mesh(beakGeo, beakMat);
    beak.rotation.x = Math.PI / 2;
    beak.position.set(0, 0.36, 0.31);
    chickenGroup.add(beak);

    return chickenGroup;
  };

  // Helper to create Sensor beacon
  const createSensorBeacon = (sensor: Sensor3DDef) => {
    const group = new THREE.Group();
    group.name = sensor.id;
    group.position.set(...sensor.pos);

    // Mount rod
    const mountGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.5, 8);
    const mountMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.8 });
    const mount = new THREE.Mesh(mountGeo, mountMat);
    mount.position.y = -0.25;
    group.add(mount);

    // Floating Sensor Sphere
    const headGeo = new THREE.SphereGeometry(0.18, 16, 16);
    const headMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(sensor.color),
      emissive: new THREE.Color(sensor.color),
      emissiveIntensity: 0.5,
      metalness: 0.2,
      roughness: 0.2,
    });
    const head = new THREE.Mesh(headGeo, headMat);
    head.name = `sensor_${sensor.id}`;
    group.add(head);

    // Pulsing Ring
    const ringGeo = new THREE.RingGeometry(0.24, 0.32, 24);
    const ringMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(sensor.color),
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.name = 'ring';
    group.add(ring);

    return group;
  };

  // Helper to build a Tree for outdoor farm landscape
  const createTree = (x: number, z: number, scale: number = 1) => {
    const tree = new THREE.Group();
    // Trunk
    const trunkGeo = new THREE.CylinderGeometry(0.25 * scale, 0.35 * scale, 2.2 * scale, 8);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = (2.2 * scale) / 2;
    trunk.castShadow = true;
    tree.add(trunk);

    // Foliage (fluffy green canopies)
    const folGeo = new THREE.DodecahedronGeometry(1.6 * scale, 1);
    const folMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.8 });
    const fol = new THREE.Mesh(folGeo, folMat);
    fol.position.y = 2.4 * scale;
    fol.castShadow = true;
    tree.add(fol);

    tree.position.set(x, 0, z);
    return tree;
  };

  // Initialize Scene, Lighting, Architecture
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 580;

    // 1. Scene & Skybox (Clear agricultural sunny day)
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xdbeafe); // Soft sky blue
    scene.fog = new THREE.Fog(0xdbeafe, 45, 120);

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 150);
    camera.position.set(16, 18, 22);
    camera.lookAt(0, 1.5, 0);

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 4. Bright Sunlight Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xbae6fd, 0xdcfce7, 1.2);
    hemiLight.position.set(0, 30, 0);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xfffbeb, 2.5);
    dirLight.position.set(20, 32, 24);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 80;
    const d = 22;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    scene.add(dirLight);

    // Interior Warm Barn Hanging Lights
    [-3.5, 0, 3.5].forEach((lz) => {
      const barnLight = new THREE.PointLight(0xfef08a, 1.4, 10);
      barnLight.position.set(0, 3.6, lz);
      scene.add(barnLight);
    });

    // Emergency Flame Alarm Light
    const flameLight = new THREE.PointLight(0xef4444, 0, 18);
    flameLight.position.set(0, 3.8, 0);
    scene.add(flameLight);

    // ----------------------------------------------------
    // 5. OUTDOOR FARM LANDSCAPE (Lush Green Grass & Gravel Path)
    // ----------------------------------------------------
    const farmGroundGeo = new THREE.PlaneGeometry(50, 40);
    const farmGroundMat = new THREE.MeshStandardMaterial({
      color: 0x4ade80, // Vibrant lush grass green matching top view
      roughness: 0.9,
    });
    const farmGround = new THREE.Mesh(farmGroundGeo, farmGroundMat);
    farmGround.rotation.x = -Math.PI / 2;
    farmGround.receiveShadow = true;
    scene.add(farmGround);

    // Gravel driveway / Central access path leading to the entrance
    const pathGeo = new THREE.PlaneGeometry(4.2, 16);
    const pathMat = new THREE.MeshStandardMaterial({
      color: 0xd6d3d1, // Gravel sand roadway
      roughness: 0.95,
    });
    const path = new THREE.Mesh(pathGeo, pathMat);
    path.rotation.x = -Math.PI / 2;
    path.position.set(0, 0.015, 12);
    path.receiveShadow = true;
    scene.add(path);

    // Surrounding boundary fence perimeter
    const fenceMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, wireframe: true });
    const fenceGeo = new THREE.BoxGeometry(34, 1.8, 28);
    const fence = new THREE.Mesh(fenceGeo, fenceMat);
    fence.position.set(0, 0.9, 0);
    scene.add(fence);

    // Landscape Trees around perimeter (Balanced trees on left, right & rear)
    const treeCoords: [number, number, number][] = [
      [-14, -10, 1.1], [-14, -5, 1.2], [-14, 0, 1.05], [-14, 6, 1.2], [-14, 11, 1.15], // Left side trees
      [14, -10, 1.1], [14, -4, 1.2], [14, 2, 1.0], [14, 8, 1.2], [14, 12, 1.0],
      [4, -12, 1.1], [10, -12, 1.3],
      [4, 16, 1.0], [8, 16, 1.1], [12, 16, 1.2],
    ];
    treeCoords.forEach(([tx, tz, ts]) => {
      scene.add(createTree(tx, tz, ts));
    });

    // ----------------------------------------------------
    // 6. EXTERNAL FARM FACILITIES (Matching Reference Image)
    // ----------------------------------------------------
    // A. Feed Storage Silos (2 tall silver cylinders on the rear-left)
    const siloMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.2 });
    [-2.2, 0].forEach((ox, i) => {
      const siloGroup = new THREE.Group();
      const siloCylGeo = new THREE.CylinderGeometry(0.9, 0.9, 4.2, 24);
      const siloCyl = new THREE.Mesh(siloCylGeo, siloMat);
      siloCyl.position.y = 2.6;
      siloCyl.castShadow = true;
      siloGroup.add(siloCyl);

      const siloConeGeo = new THREE.ConeGeometry(0.9, 1.0, 24);
      const siloCone = new THREE.Mesh(siloConeGeo, siloMat);
      siloCone.position.y = 5.2;
      siloCone.castShadow = true;
      siloGroup.add(siloCone);

      siloGroup.position.set(8.5 + ox * 1.6, 0, -6.5);
      scene.add(siloGroup);
    });

    // B. Blue Water Storage Tank (Vertical cylindrical plastic tank on the right)
    const waterTankMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.4 });
    const tankGeo = new THREE.CylinderGeometry(0.85, 0.85, 2.6, 20);
    const waterTank = new THREE.Mesh(tankGeo, waterTankMat);
    waterTank.position.set(11.0, 1.3, 2.0);
    waterTank.castShadow = true;
    scene.add(waterTank);

    // C. Control Room Outbuilding (Small white/grey prefab room on the right side)
    const controlGeo = new THREE.BoxGeometry(2.6, 2.4, 4.2);
    const controlMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.6 });
    const controlRoom = new THREE.Mesh(controlGeo, controlMat);
    controlRoom.position.set(11.2, 1.2, -3.0);
    controlRoom.castShadow = true;
    scene.add(controlRoom);

    // D. Waste Management Compost Pit / Bin
    const wasteGeo = new THREE.BoxGeometry(2.4, 0.9, 4.0);
    const wasteMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.95 }); // Soil compost
    const wastePit = new THREE.Mesh(wasteGeo, wasteMat);
    wastePit.position.set(11.2, 0.45, 6.0);
    scene.add(wastePit);

    // ----------------------------------------------------
    // 7. POULTRY SHED BUILDING ARCHITECTURE
    // ----------------------------------------------------
    const shedGroup = new THREE.Group();

    // Full Poultry Floor: Uniform warm golden orange/amber straw bedding covering the entire interior
    const shedFloorGeo = new THREE.PlaneGeometry(16.4, 9.8);
    const shedFloorMat = new THREE.MeshStandardMaterial({
      color: 0xd97706, // Warm golden-orange wood shavings & straw bedding
      roughness: 0.92,
      metalness: 0.05,
    });
    const shedFloor = new THREE.Mesh(shedFloorGeo, shedFloorMat);
    shedFloor.rotation.x = -Math.PI / 2;
    shedFloor.position.set(0, 0.02, 0);
    shedFloor.receiveShadow = true;
    shedGroup.add(shedFloor);

    // ----------------------------------------------------
    // 7. POULTRY SHED GLASS WALLS (ALL 4 SIDES TRANSPARENT GLASS, NO DOORS)
    // ----------------------------------------------------
    // Concrete Curb Foundation (low 0.4m base around perimeter)
    const curbMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.6 });
    // Front curb
    const curbF = new THREE.Mesh(new THREE.BoxGeometry(16.4, 0.4, 0.16), curbMat);
    curbF.position.set(0, 0.2, 5.0);
    curbF.castShadow = true;
    shedGroup.add(curbF);
    // Back curb
    const curbB = new THREE.Mesh(new THREE.BoxGeometry(16.4, 0.4, 0.16), curbMat);
    curbB.position.set(0, 0.2, -5.0);
    curbB.castShadow = true;
    shedGroup.add(curbB);
    // Left curb
    const curbL = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.4, 10.0), curbMat);
    curbL.position.set(-8.0, 0.2, 0);
    curbL.castShadow = true;
    shedGroup.add(curbL);
    // Right curb
    const curbR = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.4, 10.0), curbMat);
    curbR.position.set(8.0, 0.2, 0);
    curbR.castShadow = true;
    shedGroup.add(curbR);

    // Premium Architectural Observation Glass Material (Clear transparent tint)
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.22,
      roughness: 0.05,
      metalness: 0.1,
      transmission: 0.9,
      thickness: 0.1,
    });

    // Four Transparent Glass Walls from curb (0.4m) up to truss height (3.6m) - 3.2m height
    // 1. Front Glass Wall (Z = 5.0, Full unbroken wall, NO DOORS)
    const frontGlassGeo = new THREE.BoxGeometry(16.2, 3.2, 0.06);
    const frontGlass = new THREE.Mesh(frontGlassGeo, glassMat);
    frontGlass.position.set(0, 2.0, 5.0);
    shedGroup.add(frontGlass);

    // 2. Back Glass Wall (Z = -5.0)
    const backGlassGeo = new THREE.BoxGeometry(16.2, 3.2, 0.06);
    const backGlass = new THREE.Mesh(backGlassGeo, glassMat);
    backGlass.position.set(0, 2.0, -5.0);
    shedGroup.add(backGlass);

    // 3. Left Glass Wall (X = -8.0)
    const leftGlassGeo = new THREE.BoxGeometry(0.06, 3.2, 9.8);
    const leftGlass = new THREE.Mesh(leftGlassGeo, glassMat);
    leftGlass.position.set(-8.0, 2.0, 0);
    shedGroup.add(leftGlass);

    // 4. Right Glass Wall (X = 8.0)
    const rightGlassGeo = new THREE.BoxGeometry(0.06, 3.2, 9.8);
    const rightGlass = new THREE.Mesh(rightGlassGeo, glassMat);
    rightGlass.position.set(8.0, 2.0, 0);
    shedGroup.add(rightGlass);

    // Steel Trusses & Structural Posts (Charcoal steel frame matching image)
    const steelMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.85, roughness: 0.3 });
    [-7.9, 7.9].forEach((px) => {
      [-4.8, -2.4, 0, 2.4, 4.8].forEach((pz) => {
        const postGeo = new THREE.BoxGeometry(0.18, 3.6, 0.18);
        const post = new THREE.Mesh(postGeo, steelMat);
        post.position.set(px, 1.8, pz);
        post.castShadow = true;
        shedGroup.add(post);
      });
    });

    // Overhead roof trusses spanning across
    [-4, -1.5, 1.5, 4].forEach((tz) => {
      const trussGeo = new THREE.BoxGeometry(16.2, 0.12, 0.12);
      const truss = new THREE.Mesh(trussGeo, steelMat);
      truss.position.set(0, 3.6, tz);
      shedGroup.add(truss);
    });

    // ----------------------------------------------------
    // 8. VIBRANT BLUE INDUSTRIAL GABLED ROOF (Matching Reference)
    // ----------------------------------------------------
    const roofGroup = new THREE.Group();

    // Vibrant Royal Blue Corrugated Steel Panels (Color #0284c7 / #0369a1 matching image)
    const roofMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7, // Vibrant Industrial Blue
      roughness: 0.4,
      metalness: 0.3,
    });

    const slopeGeo = new THREE.BoxGeometry(16.6, 0.14, 5.8);
    // South slope
    const roofSlopeFront = new THREE.Mesh(slopeGeo, roofMat);
    roofSlopeFront.position.set(0, 4.5, 2.5);
    roofSlopeFront.rotation.x = 0.34;
    roofSlopeFront.castShadow = true;
    roofGroup.add(roofSlopeFront);

    // North slope
    const roofSlopeBack = new THREE.Mesh(slopeGeo, roofMat);
    roofSlopeBack.position.set(0, 4.5, -2.5);
    roofSlopeBack.rotation.x = -0.34;
    roofSlopeBack.castShadow = true;
    roofGroup.add(roofSlopeBack);

    // White Gable Facade Panels on front & back
    const gableShape = new THREE.Shape();
    gableShape.moveTo(-5.0, 3.6);
    gableShape.lineTo(0, 5.3);
    gableShape.lineTo(5.0, 3.6);
    gableShape.closePath();

    const gableGeo = new THREE.ExtrudeGeometry(gableShape, { depth: 0.18, bevelEnabled: false });
    const gableMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.6 });

    const gableFront = new THREE.Mesh(gableGeo, gableMat);
    gableFront.position.set(0, 0, 4.9);
    roofGroup.add(gableFront);

    const gableBack = new THREE.Mesh(gableGeo, gableMat);
    gableBack.position.set(0, 0, -5.08);
    roofGroup.add(gableBack);

    // Silver Rotary Whirlybird Turbine Roof Vents (5 along the ridge line matching image)
    const ventMat = new THREE.MeshStandardMaterial({ color: 0xd4d4d8, metalness: 0.9, roughness: 0.2 });
    [-6, -3, 0, 3, 6].forEach((vx) => {
      const ventGeo = new THREE.SphereGeometry(0.35, 12, 12);
      const vent = new THREE.Mesh(ventGeo, ventMat);
      vent.scale.set(1.0, 0.65, 1.0);
      vent.position.set(vx, 5.5, 0);
      roofGroup.add(vent);

      const baseGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.25, 12);
      const ventBase = new THREE.Mesh(baseGeo, ventMat);
      ventBase.position.set(vx, 5.3, 0);
      roofGroup.add(ventBase);
    });

    // ----------------------------------------------------
    // 9. SIGNBOARD: "PoultryTwin Farm" (Sleek Dark Slate / Obsidian Theme)
    // ----------------------------------------------------
    const signCanvas = document.createElement('canvas');
    signCanvas.width = 1024;
    signCanvas.height = 256;
    const ctx = signCanvas.getContext('2d');
    if (ctx) {
      // Premium dark obsidian charcoal background (#090d16)
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, 1024, 256);

      // Gold & Emerald metallic double accent border
      ctx.strokeStyle = '#f59e0b'; // Warm Amber/Gold
      ctx.lineWidth = 10;
      ctx.strokeRect(10, 10, 1004, 236);

      ctx.strokeStyle = '#06b6d4'; // Cyan technical hairline
      ctx.lineWidth = 3;
      ctx.strokeRect(20, 20, 984, 216);

      // Mascot badge with dark emerald backdrop
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(140, 128, 68, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#022c22';
      ctx.beginPath();
      ctx.arc(140, 128, 62, 0, Math.PI * 2);
      ctx.fill();

      ctx.font = '64px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🐔', 140, 130);

      // Main Title: "PoultryTwin Farm" in high-contrast crisp white & cyan
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 78px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('PoultryTwin Farm', 240, 118);

      // Slogan in bright emerald
      ctx.fillStyle = '#34d399';
      ctx.font = 'bold 30px sans-serif';
      ctx.fillText('Healthy Birds  |  Better Yields  |  Smarter Farming', 244, 182);
    }

    const signTexture = new THREE.CanvasTexture(signCanvas);
    signTexture.anisotropy = 8;

    const signGeo = new THREE.BoxGeometry(6.4, 1.4, 0.12);
    const signFrontMat = new THREE.MeshStandardMaterial({ map: signTexture, roughness: 0.25, metalness: 0.2 });
    const signSideMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4, metalness: 0.8 }); // Dark slate border casing
    const signMesh = new THREE.Mesh(signGeo, [
      signSideMat, signSideMat, signSideMat, signSideMat,
      signFrontMat, signSideMat
    ]);
    signMesh.position.set(0, 4.3, 5.2);
    roofGroup.add(signMesh);

    roofGroup.visible = showRoof;
    scene.add(roofGroup);
    scene.add(shedGroup);

    // ----------------------------------------------------
    // 10. INTERIOR AUTOMATED FEEDER & DRINKER LINES
    // (Red bell-shaped suspended feeder pans matching interior view)
    // ----------------------------------------------------
    const feederGroup = new THREE.Group();
    const bellMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3 }); // Vibrant Red Bell Feeders
    const pipeMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8 });

    // Left and Right automated feeder lines
    [-3.2, 3.2].forEach((lx) => {
      // Long feed auger pipe
      const pipeGeo = new THREE.CylinderGeometry(0.06, 0.06, 9.6, 8);
      const pipe = new THREE.Mesh(pipeGeo, pipeMat);
      pipe.rotation.x = Math.PI / 2;
      pipe.position.set(lx, 1.0, 0);
      feederGroup.add(pipe);

      // Suspended red bell feeder pans along the line
      [-4, -2.4, -0.8, 0.8, 2.4, 4].forEach((fz) => {
        // Bell cone
        const coneGeo = new THREE.ConeGeometry(0.28, 0.28, 12);
        const cone = new THREE.Mesh(coneGeo, bellMat);
        cone.position.set(lx, 0.45, fz);
        cone.castShadow = true;
        feederGroup.add(cone);

        // Suspension cable
        const cableGeo = new THREE.CylinderGeometry(0.01, 0.01, 2.6, 4);
        const cable = new THREE.Mesh(cableGeo, steelMat);
        cable.position.set(lx, 2.0, fz);
        feederGroup.add(cable);
      });
    });

    scene.add(feederGroup);

    // ----------------------------------------------------
    // 11. INDUSTRIAL EXHAUST FANS (At the far end wall)
    // ----------------------------------------------------
    const fans: THREE.Mesh[] = [];
    const fanHousingMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7 });
    const fanBladeMat = new THREE.MeshStandardMaterial({ color: 0x0284c7 });

    [-2.2, 2.2].forEach((fx) => {
      const fHousingGeo = new THREE.CylinderGeometry(0.7, 0.7, 0.25, 24);
      const fHousing = new THREE.Mesh(fHousingGeo, fanHousingMat);
      fHousing.rotation.x = Math.PI / 2;
      fHousing.position.set(fx, 2.2, -4.95);
      scene.add(fHousing);

      const fBladeGeo = new THREE.BoxGeometry(1.1, 0.14, 0.04);
      const fBlade = new THREE.Mesh(fBladeGeo, fanBladeMat);
      fBlade.position.set(fx, 2.2, -4.9);
      scene.add(fBlade);
      fans.push(fBlade);
    });

    // ----------------------------------------------------
    // 12. SENSOR NODES
    // ----------------------------------------------------
    const sensorObjects: { [id: string]: THREE.Group } = {};
    sensors.forEach((s) => {
      const obj = createSensorBeacon(s);
      scene.add(obj);
      sensorObjects[s.id] = obj;
    });

    // ----------------------------------------------------
    // 13. FLOCK OF WHITE CHICKENS (Roaming across litter)
    // ----------------------------------------------------
    const chickens: { group: THREE.Group; vx: number; vz: number; speed: number; pecking: number }[] = [];
    for (let i = 0; i < 24; i++) {
      const ch = createChickenModel();
      // Place on left or right litter bed
      const side = Math.random() > 0.5 ? 1 : -1;
      const cx = side * (1.6 + Math.random() * 5.0);
      const cz = -4.2 + Math.random() * 8.4;
      ch.position.set(cx, 0, cz);
      scene.add(ch);

      chickens.push({
        group: ch,
        vx: (Math.random() - 0.5) * 0.02,
        vz: (Math.random() - 0.5) * 0.02,
        speed: 0.02 + Math.random() * 0.02,
        pecking: Math.random() * 100,
      });
    }

    // ----------------------------------------------------
    // 14. SUBTLE VENTILATION PARTICLES
    // ----------------------------------------------------
    const particleCount = 50;
    const particleGeo = new THREE.BufferGeometry();
    const particlePos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      particlePos[i * 3 + 0] = -7.5 + Math.random() * 15;
      particlePos[i * 3 + 1] = 0.5 + Math.random() * 2.8;
      particlePos[i * 3 + 2] = -4.5 + Math.random() * 9;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePos, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.05,
      transparent: true,
      opacity: 0.4,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // ----------------------------------------------------
    // 15. FLOOR THERMAL HEATMAP
    // ----------------------------------------------------
    const heatPlanes: THREE.Mesh[] = [];
    const heatGeo = new THREE.CircleGeometry(2.4, 24);
    const heatMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      transparent: true,
      opacity: 0.24,
      side: THREE.DoubleSide,
    });
    const heatDisc = new THREE.Mesh(heatGeo, heatMat);
    heatDisc.rotation.x = -Math.PI / 2;
    heatDisc.position.set(0, 0.035, 0);
    heatDisc.visible = false;
    scene.add(heatDisc);
    heatPlanes.push(heatDisc);

    // Store references
    threeRef.current = {
      scene,
      camera,
      renderer,
      chickens,
      fans,
      particles,
      particlePositions: particlePos,
      sensorObjects,
      heatPlanes,
      feederMesh: feederGroup,
      roofMesh: roofGroup,
      flameLight,
      raycaster: new THREE.Raycaster(),
      mouse: new THREE.Vector2(),
      ambientLight,
      dirLight,
    };

    // Resize Handler
    const handleResize = () => {
      if (!container || !threeRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      threeRef.current.camera.aspect = w / h;
      threeRef.current.camera.updateProjectionMatrix();
      threeRef.current.renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Keyboard Listeners
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressedRef.current[e.code] = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressedRef.current[e.code] = false;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Animation Loop
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      if (!threeRef.current) return;
      const { camera, chickens, fans, particles, particlePositions, sensorObjects, flameLight, heatPlanes } =
        threeRef.current;

      // 1. Ventilation Fans Rotation
      fans.forEach((f) => {
        f.rotation.z += delta * 14;
      });

      // 2. Airflow Particles Flow
      if (particles.visible) {
        for (let i = 0; i < particleCount; i++) {
          particlePositions[i * 3 + 2] -= delta * 3.5; // Flow along Z toward exhaust fans
          if (particlePositions[i * 3 + 2] < -4.8) {
            particlePositions[i * 3 + 2] = 4.8;
            particlePositions[i * 3 + 0] = -6.5 + Math.random() * 13;
          }
        }
        particles.geometry.attributes.position.needsUpdate = true;
      }

      // 3. Chickens AI pecking & movement
      const isFeederActive = state.feeder.status === 'DISPENSING' || state.feeder.servoAngle > 0;

      chickens.forEach((c, idx) => {
        if (isFeederActive) {
          // FEEDER ON: All chickens rush and cluster around the red feeder lines at X = -3.2 or X = +3.2
          const targetX = idx % 2 === 0 ? 3.2 : -3.2;
          const targetZ = ((idx % 6) - 2.5) * 1.5; // spaced along feeder line

          const dx = targetX - c.group.position.x;
          const dz = targetZ - c.group.position.z;
          const dist = Math.hypot(dx, dz);

          if (dist > 0.45) {
            // Walk swiftly towards feeder
            const walkSpeed = 0.045;
            c.group.position.x += (dx / dist) * walkSpeed;
            c.group.position.z += (dz / dist) * walkSpeed;
            c.group.rotation.y = Math.atan2(dx, dz);
            c.group.rotation.x = Math.sin(time * 16) * 0.1; // running waddle animation
          } else {
            // Reached feeder: enthusiastically pecking feed pellets
            c.group.rotation.x = 0.35 + Math.sin(time * 12 + idx) * 0.15;
          }
        } else {
          // NORMAL MODE: Regular wandering and pecking
          c.pecking += delta * 2;
          if (Math.sin(c.pecking) > 0.7) {
            c.group.rotation.x = 0.28; // pecking straw
          } else {
            c.group.rotation.x = 0;
            c.group.position.x += c.vx;
            c.group.position.z += c.vz;

            if (c.group.position.x < -7.0 || c.group.position.x > 7.0) c.vx *= -1;
            if (c.group.position.z < -4.2 || c.group.position.z > 4.2) c.vz *= -1;
            c.group.rotation.y = Math.atan2(c.vx, c.vz);
          }
        }
      });

      // 4. Sensor Beacon Pulse animation
      Object.entries(sensorObjects).forEach(([id, grp]) => {
        const ring = grp.getObjectByName('ring');
        if (ring) {
          const s = 1 + Math.sin(time * 4) * 0.15;
          ring.scale.set(s, s, s);
        }
      });

      // 5. Dynamic Flame Alarm reaction
      if (flameLight) {
        if (state.flame.detected) {
          flameLight.intensity = 3.5 + Math.sin(time * 16) * 1.5;
        } else {
          flameLight.intensity = 0;
        }
      }

      // 6. Camera Navigation Modes
      if (activeView === 'walk' || activeView === 'interior') {
        const speed = 4.5 * delta;
        const forward = new THREE.Vector3(
          -Math.sin(walkYawRef.current),
          0,
          -Math.cos(walkYawRef.current)
        ).normalize();
        const right = new THREE.Vector3(
          Math.cos(walkYawRef.current),
          0,
          -Math.sin(walkYawRef.current)
        ).normalize();

        const keys = keysPressedRef.current;
        if (keys['KeyW'] || keys['ArrowUp']) walkPosRef.current.addScaledVector(forward, speed);
        if (keys['KeyS'] || keys['ArrowDown']) walkPosRef.current.addScaledVector(forward, -speed);
        if (keys['KeyA'] || keys['ArrowLeft']) walkPosRef.current.addScaledVector(right, -speed);
        if (keys['KeyD'] || keys['ArrowRight']) walkPosRef.current.addScaledVector(right, speed);

        walkPosRef.current.x = Math.max(-7.4, Math.min(7.4, walkPosRef.current.x));
        walkPosRef.current.z = Math.max(-4.4, Math.min(4.4, walkPosRef.current.z));
        walkPosRef.current.y = 1.55;

        camera.position.copy(walkPosRef.current);

        const lookDir = new THREE.Vector3(
          -Math.sin(walkYawRef.current) * Math.cos(walkPitchRef.current),
          Math.sin(walkPitchRef.current),
          -Math.cos(walkYawRef.current) * Math.cos(walkPitchRef.current)
        );
        camera.lookAt(camera.position.clone().add(lookDir));
      } else if (activeView === 'top') {
        // High 90-degree Aerial Top View matching reference image
        camera.position.lerp(new THREE.Vector3(0, 30, 0.01), 0.08);
        camera.lookAt(0, 0, 0);
      } else if (activeView === 'front') {
        // Front Facade View matching reference image
        camera.position.lerp(new THREE.Vector3(0, 3.2, 14), 0.08);
        camera.lookAt(0, 2.5, 5);
      } else if (activeView === 'side') {
        // Side Elevation View matching reference image
        camera.position.lerp(new THREE.Vector3(18, 4.5, 0), 0.08);
        camera.lookAt(0, 2.2, 0);
      } else {
        // 3D Orbit
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
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      renderer.dispose();
    };
  }, [activeView]);

  // Synchronize state changes
  useEffect(() => {
    if (!threeRef.current) return;
    const { sensorObjects, feederMesh, roofMesh, particles, heatPlanes } = threeRef.current;

    // In interior walk mode, automatically lift the roof for clear lighting
    if (roofMesh) {
      roofMesh.visible = activeView === 'interior' ? false : showRoof;
    }
    if (particles) particles.visible = showAirflow;
    Object.values(sensorObjects).forEach((grp) => {
      grp.visible = showSensors;
    });
    heatPlanes.forEach((hp) => {
      hp.visible = showHeatmap;
    });

    if (feederMesh) {
      if (state.feeder.status === 'DISPENSING' || state.feeder.servoAngle > 0) {
        feederMesh.position.y = 0.04 * Math.sin(Date.now() * 0.02);
      } else {
        feederMesh.position.y = 0;
      }
    }
  }, [state, showRoof, showAirflow, showSensors, showHeatmap, activeView]);

  // Mouse drag Orbit Controls & Walk look
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingOrbitRef.current = true;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    // 1. Raycasting
    if (threeRef.current && mountRef.current) {
      const rect = mountRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      threeRef.current.mouse.set(x, y);

      threeRef.current.raycaster.setFromCamera(threeRef.current.mouse, threeRef.current.camera);
      const intersects = threeRef.current.raycaster.intersectObjects(
        threeRef.current.scene.children,
        true
      );

      let detected: Sensor3DDef | null = null;
      for (const hit of intersects) {
        let parent: THREE.Object3D | null = hit.object;
        while (parent && parent !== threeRef.current.scene) {
          const match = sensors.find((s) => s.id === parent?.name);
          if (match) {
            detected = match;
            break;
          }
          parent = parent.parent;
        }
        if (detected) break;
      }
      setHoveredSensor(detected);
    }

    // 2. Camera Rotation
    if (!isDraggingOrbitRef.current) return;

    const dx = e.clientX - lastMousePosRef.current.x;
    const dy = e.clientY - lastMousePosRef.current.y;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };

    if (activeView === 'walk' || activeView === 'interior') {
      walkYawRef.current -= dx * 0.0035;
      walkPitchRef.current -= dy * 0.0035;
      walkPitchRef.current = Math.max(-Math.PI / 2.4, Math.min(Math.PI / 2.4, walkPitchRef.current));
    } else if (activeView === 'orbit') {
      orbitAngleRef.current.theta -= dx * 0.006;
      orbitAngleRef.current.phi -= dy * 0.006;
      orbitAngleRef.current.phi = Math.max(0.1, Math.min(Math.PI / 2 - 0.05, orbitAngleRef.current.phi));
    }
  };

  const handleMouseUp = () => {
    isDraggingOrbitRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (activeView === 'orbit') {
      orbitAngleRef.current.radius += e.deltaY * 0.015;
      orbitAngleRef.current.radius = Math.max(10, Math.min(45, orbitAngleRef.current.radius));
    }
  };

  const handleClick = () => {
    if (hoveredSensor) {
      onSelectSensor(hoveredSensor.id);
    }
  };

  // Preset Views matching reference image camera angles
  const switchPresetView = (view: 'orbit' | 'walk' | 'top' | 'front' | 'side' | 'interior') => {
    setActiveView(view);
    if (view === 'interior') {
      setShowRoof(false);
      walkPosRef.current.set(0, 1.55, 4.0);
      walkYawRef.current = 0;
      walkPitchRef.current = -0.05;
    } else if (view === 'walk') {
      walkPosRef.current.set(0, 1.55, 4.0);
      walkYawRef.current = 0;
      walkPitchRef.current = 0;
    } else if (view === 'orbit') {
      orbitAngleRef.current = { theta: Math.PI / 4.2, phi: Math.PI / 3.4, radius: 28 };
      orbitTargetRef.current.set(0, 1.6, 0);
    }
  };

  return (
    <div className="flex flex-col w-full rounded-2xl overflow-hidden border-2 border-emerald-500/30 bg-slate-950 shadow-2xl">
      {/* ── TOP HEADER BAR: "PoultryTwin" & ARCHITECTURAL CAMERA VIEWS ── */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex flex-wrap items-center justify-between gap-3 select-none">
        {/* Brand & Slogan matching reference image header */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-base shadow-sm">
            🐔
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-black tracking-tight text-white">
                Poultry<span className="text-emerald-400">Twin</span>
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                PRO 3D
              </span>
            </div>
            <p className="text-[10px] text-slate-400 hidden sm:block">
              Smart Digital Twin for Poultry Farm Management
            </p>
          </div>
        </div>

        {/* 4 Camera Presets matching reference image tiles: Top, Front, Side, Interior */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs">
          <button
            onClick={() => switchPresetView('top')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
              activeView === 'top'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Top View</span>
          </button>

          <button
            onClick={() => switchPresetView('front')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
              activeView === 'front'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <span>Front View</span>
          </button>

          <button
            onClick={() => switchPresetView('side')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
              activeView === 'side'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <span>Side View</span>
          </button>

          <button
            onClick={() => switchPresetView('interior')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
              activeView === 'interior' || activeView === 'walk'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30 ring-2 ring-emerald-400'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Footprints className="w-3.5 h-3.5" />
            <span>Interior Walk</span>
          </button>

          <button
            onClick={() => switchPresetView('orbit')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
              activeView === 'orbit'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>3D Orbit</span>
          </button>
        </div>

        {/* Feature Toggles & Manual Feeder Control */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs">
          {/* Manual Feeder ON / OFF Button with Chicken Flock Attractor */}
          <button
            onClick={() => {
              if (state.feeder.status === 'DISPENSING' || state.feeder.servoAngle > 0) {
                iotDataService.setFeederServo(0);
              } else {
                iotDataService.setFeederServo(90);
              }
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-md ${
              state.feeder.status === 'DISPENSING' || state.feeder.servoAngle > 0
                ? 'bg-rose-500 text-white animate-pulse shadow-rose-500/50 ring-2 ring-rose-400'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
            }`}
            title="Toggle automated feeding dispensers on/off. When ON, all birds run toward the feeder lines!"
          >
            <Utensils className="w-3.5 h-3.5" />
            <span>
              {state.feeder.status === 'DISPENSING' || state.feeder.servoAngle > 0
                ? 'FEEDER: ON (90°)'
                : 'FEEDER: OFF'}
            </span>
          </button>

          <button
            onClick={() => setShowRoof(!showRoof)}
            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors ${
              showRoof ? 'text-blue-400 bg-blue-950/80 border border-blue-500/40' : 'text-slate-400'
            }`}
          >
            Roof: {showRoof ? 'ON' : 'OFF'}
          </button>

          <button
            onClick={() => setShowSensors(!showSensors)}
            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors flex items-center gap-1 ${
              showSensors ? 'text-emerald-400 bg-emerald-950/80' : 'text-slate-500'
            }`}
          >
            <Eye className="w-3 h-3" />
            <span>Sensors</span>
          </button>

          <button
            onClick={() => setShowAirflow(!showAirflow)}
            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors flex items-center gap-1 ${
              showAirflow ? 'text-sky-400 bg-sky-950/80' : 'text-slate-500'
            }`}
          >
            <Wind className="w-3 h-3" />
            <span>Airflow</span>
          </button>
        </div>
      </div>

      {/* ── 3D CANVAS VIEWPORT ── */}
      <div className="relative w-full">
        <div
          ref={mountRef}
          className="w-full h-[540px] md:h-[640px] cursor-grab active:cursor-grabbing outline-none"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onWheel={handleWheel}
          onClick={handleClick}
        />

        {/* Walkthrough Guide overlay (when inside or in walk mode) */}
        {(activeView === 'walk' || activeView === 'interior') && (
          <div className="absolute bottom-4 left-4 pointer-events-none p-3.5 rounded-xl bg-slate-900/90 backdrop-blur-md border border-emerald-500/40 shadow-xl text-xs font-mono text-slate-200">
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold mb-1">
              <Footprints className="w-3.5 h-3.5" />
              <span>Interior Walkthrough Active</span>
            </div>
            <p className="text-[11px] text-slate-300">
              • Move: <strong className="text-white">W / A / S / D</strong> or Arrows
              <br />
              • Turn & Look: <strong className="text-white">Click & Drag Mouse</strong>
              <br />
              • Exit: <strong className="text-white">Click 'Top' or '3D Orbit'</strong>
            </p>
          </div>
        )}

        {/* Orbit Helper */}
        {activeView === 'orbit' && (
          <div className="absolute bottom-4 left-4 pointer-events-none px-3 py-2 rounded-xl bg-slate-900/85 backdrop-blur-md border border-slate-700 shadow-xl text-[11px] font-mono text-slate-300">
            <div className="flex items-center gap-1.5 text-cyan-400 font-bold">
              <Compass className="w-3 h-3" />
              <span>3D Orbit: Click & Drag to rotate • Scroll to Zoom</span>
            </div>
          </div>
        )}

        {/* Floating Sensor Diagnostic Tooltip */}
        {hoveredSensor && (
          <div className="absolute bottom-4 right-4 pointer-events-none p-3.5 rounded-xl bg-slate-900/95 backdrop-blur-md border border-cyan-500/50 shadow-2xl min-w-[220px]">
            <div className="flex items-center gap-2 mb-1.5">
              <div
                className="w-2.5 h-2.5 rounded-full animate-ping"
                style={{ backgroundColor: hoveredSensor.color }}
              />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                {hoveredSensor.name}
              </span>
            </div>
            <div className="text-base font-black text-cyan-300 font-mono">{hoveredSensor.value}</div>
            <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
              <span>Status:</span>
              <span
                className="font-bold uppercase text-[10px] px-1.5 py-0.5 rounded"
                style={{
                  backgroundColor: `${hoveredSensor.color}22`,
                  color: hoveredSensor.color,
                  border: `1px solid ${hoveredSensor.color}44`,
                }}
              >
                {hoveredSensor.status}
              </span>
            </div>
          </div>
        )}

        {/* Top-Right Synchronized Hardware Status Pill */}
        <div className="absolute top-3 right-3 pointer-events-none px-3 py-1 rounded-full bg-slate-900/85 backdrop-blur-md border border-slate-700 text-[10px] font-mono text-slate-300 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>{state.isHardwareConnected ? 'LIVE WOKWI / ESP32' : 'VIRTUAL TELEMETRY'}</span>
        </div>
      </div>
    </div>
  );
};
