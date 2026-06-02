import { useEffect, useRef } from "react";
import * as THREE from "three";

interface SignalTowerProps {
  status?: "idle" | "running" | "success" | "risk";
  activeRisks?: string[];
}

export function SignalTower({ status = "idle", activeRisks = [] }: SignalTowerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number>(0);
  const statusRef = useRef(status);
  const timeRef = useRef(0);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const isLowPower = navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4;

    const scene = new THREE.Scene();
    scene.background = null;

    const camera = new THREE.PerspectiveCamera(45, 400 / 600, 0.1, 100);
    camera.position.set(0, 2, 8);
    camera.lookAt(0, 1, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: !isLowPower, alpha: true });
    renderer.setSize(400, 600);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isLowPower ? 1 : 2));
    container.appendChild(renderer.domElement);

    const geometry = new THREE.ConeGeometry(1.2, 4, 6);
    const material = new THREE.MeshStandardMaterial({
      color: 0x0a0a0a,
      metalness: 0.9,
      roughness: 0.3,
      emissive: 0x000000,
    });
    const tower = new THREE.Mesh(geometry, material);
    tower.position.y = 1;
    scene.add(tower);

    const edges = new THREE.EdgesGeometry(geometry);
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0xff9f1c,
      transparent: true,
      opacity: 0.3,
    });
    const wireframe = new THREE.LineSegments(edges, lineMaterial);
    tower.add(wireframe);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xff9f1c, 0.5, 10);
    pointLight.position.set(3, 3, 3);
    scene.add(pointLight);

    const animate = () => {
      timeRef.current += 0.016;
      const time = timeRef.current;

      tower.rotation.y += 0.001;

      const currentStatus = statusRef.current;

      if (currentStatus === "idle") {
        const pulse = 0.3 + 0.2 * Math.sin(time * 0.8);
        lineMaterial.opacity = pulse;
        material.emissive.setHex(0x000000);
      } else if (currentStatus === "running") {
        const chase = 0.5 + 0.3 * Math.sin(time * 8);
        lineMaterial.opacity = chase;
        material.emissive.setHex(0x1a0f00);
      } else if (currentStatus === "success") {
        const flash = time < 1 ? 1.0 : 0.6 + 0.1 * Math.sin(time * 2);
        lineMaterial.opacity = flash;
        material.emissive.setHex(time < 1 ? 0xff9f1c : 0x1a0f00);
      } else if (currentStatus === "risk") {
        lineMaterial.opacity = 0.8;
        material.emissive.setHex(0x330000);
      }

      renderer.render(scene, camera);
      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) {
          cancelAnimationFrame(frameRef.current);
        } else {
          frameRef.current = requestAnimationFrame(animate);
        }
      },
      { threshold: 0 }
    );
    observer.observe(container);

    return () => {
      cancelAnimationFrame(frameRef.current);
      observer.disconnect();
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      edges.dispose();
      lineMaterial.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed right-0 top-0 h-screen w-[400px] hidden xl:block pointer-events-none"
      style={{ zIndex: 5 }}
    />
  );
}
