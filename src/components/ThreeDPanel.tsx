import React, { useRef, useEffect } from 'react';
import { PanelProps, FieldType } from '@grafana/data';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { ThreeDOptions } from 'types';

interface Props extends PanelProps<ThreeDOptions> {}

function createAxisLabel(text: string, position: THREE.Vector3): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'white';
  ctx.font = 'bold 40px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(2, 0.5, 1);
  sprite.position.copy(position);
  return sprite;
}

function createRectangularGridHelper(maxX: number, maxZ: number, showNegative: boolean): THREE.LineSegments {
  const lines: THREE.Vector3[] = [];

  const startX = showNegative ? -maxX : 0;
  const endX = maxX;
  const startZ = showNegative ? -maxZ : 0;
  const endZ = maxZ;

  for (let x = startX; x <= endX; x++) {
    lines.push(new THREE.Vector3(x, 0, startZ));
    lines.push(new THREE.Vector3(x, 0, endZ));
  }

  for (let z = startZ; z <= endZ; z++) {
    lines.push(new THREE.Vector3(startX, 0, z));
    lines.push(new THREE.Vector3(endX, 0, z));
  }

  const geometry = new THREE.BufferGeometry().setFromPoints(lines);
  const material = new THREE.LineBasicMaterial({ color: 0x888888 });
  const gridLines = new THREE.LineSegments(geometry, material);

  (gridLines as any).isCustomGrid = true;
  return gridLines;
}





export const ThreeDPanel: React.FC<Props> = ({ width, height, data, options }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const sceneRef = useRef<THREE.Scene>();
  const cameraRef = useRef<THREE.PerspectiveCamera>();
  const controlsRef = useRef<OrbitControls>();
  const shapeRef = useRef<THREE.Mesh>();
  const pointsRef = useRef<THREE.Vector3[]>([]);
  const frameIndexRef = useRef(0);

  // Extract XYZ data from Grafana DataFrame
  const extractCoords = () => {
    const frame = data.series[0];
    if (!frame) return [];

    const xField = frame.fields.find(f => f.name.toLowerCase() === 'x');
    const yField = frame.fields.find(f => f.name.toLowerCase() === 'y');
    const zField = frame.fields.find(f => f.name.toLowerCase() === 'z');

    if (!xField || !yField || !zField) return [];

    const length = Math.min(xField.values.length, yField.values.length, zField.values.length);
    const points: THREE.Vector3[] = [];
    for (let i = 0; i < length; i++) {
      points.push(new THREE.Vector3(
        parseFloat(xField.values.get(i)),
        parseFloat(yField.values.get(i)),
        parseFloat(zField.values.get(i))
      ));
    }
    return points;
  };

  useEffect(() => {
    if (!canvasRef.current) return;

    const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current, alpha: true });
    renderer.setSize(width, height);
    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(30, width / height, 0.1, 1000);
    camera.position.set(15, 15, 15);
    cameraRef.current = camera;

    const controls = new OrbitControls(camera, renderer.domElement);
    controlsRef.current = controls;

    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const light = new THREE.PointLight(0xffffff, 1);
    light.position.set(10, 10, 10);
    scene.add(light);

    // Animation loop
  const animate = () => {
    requestAnimationFrame(animate);

    const points = pointsRef.current;
    const shape = shapeRef.current;

    if (points.length > 0 && shape) {
      const last = points[points.length - 1];
      shape.position.copy(last);
    }

    renderer.render(scene, camera);
  };
  animate();
  }, []);


  // Update when data changes
  useEffect(() => {
    const newPoints = extractCoords();
    pointsRef.current = newPoints;
    frameIndexRef.current = 0;
  }, [data]);

  useEffect(() => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;

    // Remove old helpers/labels
    scene.children = scene.children.filter(child => {
      const isCustomGrid = (child as any).isCustomGrid;
      const isAxes = child instanceof THREE.AxesHelper;
      const isLabel = (child as any).isLabelSprite;
      return !(isCustomGrid || isAxes || isLabel);
    });



    // === GridHelper (custom) ===
    const gridHelper = createRectangularGridHelper(options.maxX, options.maxZ, options.showNegativeAxes);
    (gridHelper as any).isCustomGrid = true;
    scene.add(gridHelper);

    // === AxesHelper ===
    const axesLength = Math.max(options.maxX, options.maxY, options.maxZ, 1);
    const axesHelper = new THREE.AxesHelper(axesLength);
    scene.add(axesHelper); 

    // === Labels ===
    const offset = 0.5;
    const labels = [
      createAxisLabel('X', new THREE.Vector3(options.maxX + offset, 0, 0)),
      createAxisLabel('Y', new THREE.Vector3(0, options.maxY + offset, 0)),
      createAxisLabel('Z', new THREE.Vector3(0, 0, options.maxZ + offset)),
    ];
    labels.forEach(label => ((label as any).isLabelSprite = true));
    labels.forEach(label => scene.add(label));
  }, [options.maxX, options.maxY, options.maxZ, options.showNegativeAxes]);


  // Resize handling
  useEffect(() => {
    if (rendererRef.current && cameraRef.current) {
      rendererRef.current.setSize(width, height);
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
    }
  }, [width, height]);
  useEffect(() => {
    if (!sceneRef.current) return;

    const scene = sceneRef.current;

    // Remove old mesh
    if (shapeRef.current) {
      scene.remove(shapeRef.current);
      shapeRef.current.geometry.dispose();
      shapeRef.current.material.dispose();
      shapeRef.current = undefined;
    }

    const { shapeType = 'sphere', scale = 1, shapeColor = '#ff0000' } = options;

    let geometry: THREE.BufferGeometry;

    switch (shapeType) {
      case 'cube':
        geometry = new THREE.BoxGeometry(scale, scale, scale);
        break;
      case 'cone':
        geometry = new THREE.ConeGeometry(scale * 0.5, scale, 32);
        break;
      case 'sphere':
      default:
        geometry = new THREE.SphereGeometry(scale * 0.5, 32, 32);
        break;
    }

    const material = new THREE.MeshStandardMaterial({ color: new THREE.Color(shapeColor) });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
    shapeRef.current = mesh;
  }, [options.shapeType, options.scale, options.shapeColor]);



  return <canvas ref={canvasRef} style={{ width, height, display: 'block' }} />;
};