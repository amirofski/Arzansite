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
  hole?: { y: number; feather: number }; // center sparseness band in NDC (radial helper)
  className?: string;
};

const DotWave3D: React.FC<DotWave3DProps> = ({
  speed = 0.25,
  amplitude = 0.8,
  density = { x: 80, y: 50 },
  color = "#bcd1ff",
  parallax = { mouse: 0.06, scroll: 40 },
  hole = { y: 0.22, feather: 0.22 },
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
const isSmall = (container.clientWidth || 0) < 640;
    const dpr = Math.min(window.devicePixelRatio || 1, isSmall ? 1.2 : 1.8);
    renderer.setPixelRatio(dpr);
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setClearColor(0x000000, 0); // transparent
    container.appendChild(renderer.domElement);

// Build a grid of points on XZ plane; Y displaced in shader by time-based sin
    // Responsive density based on container size
    const baseCols = Math.max(300, Math.floor(density.x));
    const baseRows = Math.max(200, Math.floor(density.y));
    const scaleX = Math.max(0.6, Math.min(1.4, container.clientWidth / 1280));
    const scaleY = Math.max(0.6, Math.min(1.4, container.clientHeight / 720));
    const cols = Math.floor(baseCols * scaleX);
    const rows = Math.floor(baseRows * scaleY);
    const width = 100; // expanded area for an infinite feel
    const depth = 90;
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
          // Mixed waves to avoid linear banding and add subtle complexity
          float w1 = sin(p.x * 0.9 + uTime * (uSpeed*5.0)) * 5.9;
          float w2 = cos(p.z * 0.21 - uTime * (uSpeed*5.9)) * 5.9;
          float w3 = sin((p.x + p.z) * 0.13 + uTime * (uSpeed*0.7)) * 0.4;
          float wave = w1 + w2 + w3;
          p.y += wave * uAmp;
          vHeight = p.y;
          vec4 clip = projectionMatrix * modelViewMatrix * vec4(p, 0.5);
          gl_Position = clip;
          vNdc = clip.xy / clip.w; // -1..1 in screen space
          // Edge emphasis: bigger toward edges, tiny near center for depth
          float r = length(vNdc);
          float edge = smoothstep(7.15, 1.0, r);
          float base = 0.8 + (p.y + 0.0) * 0.2;
          gl_PointSize = base + edge * 3.0; // larger at edges, smaller center
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
          // Radial center sparsity and vertical feather
          float r = length(vNdc);
          float center = smoothstep(0.0, 0.25, r); // near center => smaller alpha
          alpha *= mix(1.2, 0.8, center);
          float distY = abs(vNdc.y);
          float band = smoothstep(uHoleY - uHoleFeather, uHoleY + uHoleFeather, distY);
          alpha *= band;
          // Height-based subtle brightness
          float b = clamp(0.65 + vHeight * 0.15, 0.5, 1.0);
          gl_FragColor = vec4(uColor * b, alpha * 0.9);
        }
      `,
    });

    const points = new THREE.Points(geometry, material);
    const group = new THREE.Group();
    group.add(points);
    group.rotation.x = 0; // tilt a bit toward camera
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
        // Gentle auto drift to enhance depth
        group.rotation.z = Math.sin(t * 0.1) * 0.02;
        // Smoothly lerp rotations for a natural feel (mouse tilt)
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