import React, { useEffect, useRef } from "react";
import * as THREE from "three";

// Lightweight, dependency-free Three.js dot-wave background with
// mouse tilt and scroll parallax. Honors prefers-reduced-motion.
// Usage:
// <DotWave3D speed={0.25} amplitude={0.8} density={{x:80,y:50}} parallax={{mouse:0.06,scroll:40}} />

export type DotWave3DProps = {
  speed?: number; // wave speed
  amplitude?: number; // wave height
  density?: { x: number; y: number }; // grid resolution
  color?: string; // dot color
  parallax?: { mouse: number; scroll: number }; // strengths
  hole?: { y: number; feather: number }; // center horizontal band (in NDC)
  className?: string;
};

const DotWave3D: React.FC<DotWave3DProps> = ({
  speed = 0.25,
  amplitude = 0.8,
  density = { x: 80, y: 50 },
  color = "#bcd1ff",
  parallax = { mouse: 0.06, scroll: 40 },
  hole = { y: 0.26, feather: 0.18 },
  className = "absolute inset-0 pointer-events-none -z-10",
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const cleanupRef = useRef<() => void>();

  useEffect(() => {
    const prefersReduced = window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const container = mountRef.current;
    if (!container) return;

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 1000);
    camera.position.set(0, 8, 38);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    const dpr = Math.min(window.devicePixelRatio || 1, 1.8);
    renderer.setPixelRatio(dpr);
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setClearColor(0x000000, 0); // transparent
    container.appendChild(renderer.domElement);

    // Build a grid of points on XZ plane; Y displaced in shader by time-based sin
    const cols = Math.max(16, Math.floor(density.x));
    const rows = Math.max(10, Math.floor(density.y));
    const width = 90; // expanded visible area width for an infinite feel
    const depth = 60; // expanded visible area depth
    const xStep = width / cols;
    const zStep = depth / rows;

    const positions = new Float32Array(cols * rows * 3);
    let i = 0;
    for (let zi = 0; zi < rows; zi++) {
      for (let xi = 0; xi < cols; xi++) {
        const x = xi * xStep - width / 2;
        const z = zi * zStep - depth / 2;
        positions[i++] = x;
        positions[i++] = 0; // Y set by shader
        positions[i++] = z;
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uAmp: { value: amplitude },
        uSpeed: { value: speed },
        uColor: { value: new THREE.Color(color) },
        uHoleY: { value: hole.y },
        uHoleFeather: { value: hole.feather },
      },
      vertexShader: `
        uniform float uTime;
        uniform float uAmp;
        uniform float uSpeed;
        varying float vHeight;
        varying vec2 vNdc;
        void main() {
          vec3 p = position;
          float wave = sin(p.x * 0.18 + uTime * uSpeed) * 0.8
                     + cos(p.z * 0.22 + uTime * uSpeed * 0.9) * 0.6;
          p.y += wave * uAmp;
          vHeight = p.y;
          vec4 clip = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
          gl_Position = clip;
          vNdc = clip.xy / clip.w; // -1..1
          // Perspective-aware point size
          float size = 3.2 + (p.y + 1.0) * 1.8;
          gl_PointSize = size;
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        uniform float uHoleY;
        uniform float uHoleFeather;
        varying float vHeight;
        varying vec2 vNdc;
        void main() {
          // Soft round point
          vec2 uv = gl_PointCoord - 0.5;
          float d = length(uv);
          if (d > 0.5) discard;
          float alpha = smoothstep(0.5, 0.0, d);
          // Vertical center band hole (lower alpha around NDC y=0)
          float distY = abs(vNdc.y);
          float holeMask = smoothstep(uHoleY - uHoleFeather, uHoleY + uHoleFeather, distY);
          alpha *= holeMask;
          // Height-based subtle brightness
          float b = clamp(0.65 + vHeight * 0.15, 0.5, 1.0);
          gl_FragColor = vec4(uColor * b, alpha * 0.9);
        }
      `,
    });

    const points = new THREE.Points(geometry, material);
    const group = new THREE.Group();
    group.add(points);
    group.rotation.x = -0.35; // tilt a bit toward camera
    scene.add(group);

    // Lighting effect (very subtle fog-like tone)
    scene.fog = new THREE.FogExp2(0x000000, 0.035);

    const onResize = () => {
      const { clientWidth: w, clientHeight: h } = container;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };

    const onScroll = () => {
      const y = window.scrollY || 0;
      const max = Math.max(0, parallax.scroll || 40);
      const target = -Math.min(y / (window.innerHeight || 1), 1) * max;
      group.position.y = target * 0.02; // translate world (subtle)
    };

    // Mouse tilt
    let targetRX = group.rotation.x;
    let targetRY = group.rotation.y;
    const onPointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) / rect.width;
      const dy = (e.clientY - cy) / rect.height;
      const maxTilt = 0.18; // ~10 degrees
      targetRY = -dx * (parallax.mouse || 0.06) * (maxTilt / 0.06);
      targetRX = -0.35 + dy * (parallax.mouse || 0.06) * (maxTilt / 0.06);
    };

    const clock = new THREE.Clock();
    let rafId = 0;

    const tick = () => {
      const t = clock.getElapsedTime();
      if (!prefersReduced) {
        (material.uniforms.uTime.value as number) = t;
        // Smoothly lerp rotations for a natural feel
        group.rotation.x += (targetRX - group.rotation.x) * 0.06;
        group.rotation.y += (targetRY - group.rotation.y) * 0.06;
      }
      renderer.render(scene, camera);
      rafId = requestAnimationFrame(tick);
    };

    // Initial size + listeners
    onResize();
    onScroll();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onScroll, { passive: true });
    container.addEventListener("pointermove", onPointerMove);

    if (prefersReduced) {
      // Render once; no RAF
      renderer.render(scene, camera);
    } else {
      tick();
    }

    cleanupRef.current = () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll);
      container.removeEventListener("pointermove", onPointerMove);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };

    return () => cleanupRef.current?.();
  }, [speed, amplitude, density.x, density.y, color, parallax.mouse, parallax.scroll, hole.y, hole.feather]);

  return <div ref={mountRef} className={className} aria-hidden="true" />;
};

export default DotWave3D;