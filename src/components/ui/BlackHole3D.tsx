import React, { useRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';

interface BlackHole3DProps {
  className?: string;
  children?: React.ReactNode;
}

const BlackHole3D: React.FC<BlackHole3DProps> = ({ className = '', children }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene>();
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const cameraRef = useRef<THREE.PerspectiveCamera>();
  const animationIdRef = useRef<number>();

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      9,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(8, 2, 8);
    camera.lookAt(1, 1, 1);
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      powerPreference: "high-performance"
    });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0x000000, 0);
    rendererRef.current = renderer;
    mountRef.current.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.2);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0xffffff, 0.5, 100);
    pointLight1.position.set(10, 10, 10);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x330066, 0.3, 100);
    pointLight2.position.set(-10, -10, -10);
    scene.add(pointLight2);

    // Black hole material with custom shader
    const blackHoleMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        color1: { value: new THREE.Color(0x000000) },
        color2: { value: new THREE.Color(0x1a0033) },
        color3: { value: new THREE.Color(0x330066) },
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vPosition;
        void main() {
          vUv = uv;
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform vec3 color1;
        uniform vec3 color2;
        uniform vec3 color3;
        varying vec2 vUv;
        varying vec3 vPosition;
        
        void main() {
          vec2 center = vec2(0.5, 0.5);
          float dist = distance(vUv, center);
          
          // Create black hole effect with radial gradient
          float gradient = 1.0 - smoothstep(0.0, 0.8, dist);
          
          // Add spiral effect
          float angle = atan(vUv.y - center.y, vUv.x - center.x);
          float spiral = sin(angle * 8.0 + time * 2.0) * 0.1;
          gradient += spiral;
          
          // Create event horizon
          float horizon = 1.0 - smoothstep(0.3, 0.35, dist);
          
          // Mix colors based on distance
          vec3 color = mix(color1, color2, gradient);
          color = mix(color, color3, horizon);
          
          // Add some glow
          float glow = 1.0 - smoothstep(0.0, 0.2, dist);
          color += glow * vec3(0.1, 0.0, 0.2);
          
          gl_FragColor = vec4(color, 1.0);
        }
      `,
      side: THREE.DoubleSide,
    });

    // Black hole sphere
    const blackHoleGeometry = new THREE.SphereGeometry(1, 64, 64);
    const blackHole = new THREE.Mesh(blackHoleGeometry, blackHoleMaterial);
    scene.add(blackHole);

    // Accretion disk particles
    const particleCount = 2000000;
    const particles = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 6);
    const colors = new Float32Array(particleCount * 6);
    const sizes = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 6;
      
      // Create particles in a disk shape
      const radius = 0.5 + Math.random() * 4.0;
      const angle = Math.random() * Math.PI * 4;
      const height = (Math.random() - 0.5) * 0.2;
      
      positions[i3] = Math.cos(angle) * radius;
      positions[i3 + 1] = height;
      positions[i3 + 2] = Math.sin(angle) * radius;
      
      // Color based on distance from center
      const colorIntensity = 1.0 - (radius - 0.5) / 2.0;
      colors[i3] = colorIntensity; // Red
      colors[i3 + 1] = colorIntensity * 0.3; // Green
      colors[i3 + 2] = colorIntensity * 0.8; // Blue
      
      sizes[i] = Math.random() * 0.02 + 0.01;
    }

    particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particles.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    particles.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const particleMaterial = new THREE.PointsMaterial({
      size: 0.05,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      transparent: true,
      opacity: 0.8,
    });

    const particleSystem = new THREE.Points(particles, particleMaterial);
    scene.add(particleSystem);

    // Event horizon ring
    const ringGeometry = new THREE.TorusGeometry(10.1, 0.05, 8, 1);
    const ringMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xffffff, 
      transparent: true, 
      opacity: 0.1 
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = Math.PI / 2;
    scene.add(ring);

    // Animation loop
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);

      const time = Date.now() * 0.001;

      // Rotate black hole
      blackHole.rotation.y += 0.001;
      blackHole.rotation.x += 0.0005;

      // Rotate particle system
      particleSystem.rotation.y += 0.002;

      // Update shader time
      blackHoleMaterial.uniforms.time.value = time;

      // Orbit camera
      camera.position.x = Math.cos(time * 0.1) * 8;
      camera.position.z = Math.sin(time * 0.1) * 8;
      camera.position.y = Math.sin(time * 0.05) * 2;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };

    animate();

    // Handle resize
    const handleResize = () => {
      if (!mountRef.current || !camera || !renderer) return;
      
      const width = mountRef.current.clientWidth;
      const height = mountRef.current.clientHeight;
      
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      window.removeEventListener('resize', handleResize);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div 
      ref={mountRef} 
      className={`relative w-full h-full ${className}`}
      style={{ background: 'linear-gradient(180deg, #000000 0%, #1a0033 50%, #000000 100%)' }}
    >
      {/* Overlay content */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        {children}
      </div>
    </div>
  );
};

export default BlackHole3D;