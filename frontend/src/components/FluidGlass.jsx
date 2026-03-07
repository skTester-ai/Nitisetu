import * as THREE from 'three';
import { useRef, useState, useMemo, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
  useScroll,
  Scroll,
  ScrollControls,
  Text,
  Environment,
  MeshTransmissionMaterial
} from '@react-three/drei';
import { easing } from 'maath';
import { useTheme } from '../context/ThemeContext';

export default function FluidGlass() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const bgColor = isDark ? '#060d06' : '#faf7ee';

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Canvas 
        camera={{ position: [0, 0, 20], fov: 35 }} 
        gl={{ antialias: true }} 
      >
        <color attach="background" args={[bgColor]} />
        <Suspense fallback={null}>
          <ambientLight intensity={isDark ? 1.5 : 2.5} />
          <directionalLight position={[10, 10, 10]} intensity={isDark ? 1 : 2} />
          <spotLight position={[-10, 20, 10]} angle={0.15} penumbra={1} intensity={isDark ? 2 : 5} castShadow />
          <Environment preset={isDark ? "city" : "apartment"} />

          <ScrollControls damping={0.2} pages={3} distance={1}>
            <Scene />
          </ScrollControls>
        </Suspense>
      </Canvas>
    </div>
  );
}

function Scene() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const lensRef = useRef();
  const { viewport } = useThree();

  // Make the lens track the mouse cursor fluidly using maath's damp3
  useFrame((state, delta) => {
    if (!lensRef.current) return;
    
    // Calculate destination based on pointer
    const destX = (state.pointer.x * viewport.width) / 4;
    const destY = (state.pointer.y * viewport.height) / 4;
    
    // Damp position
    easing.damp3(lensRef.current.position, [destX, destY, 8], 0.25, delta);
    
    // Add subtle continuous rotation
    lensRef.current.rotation.x = THREE.MathUtils.lerp(lensRef.current.rotation.x, state.pointer.y * 0.2, 0.1);
    lensRef.current.rotation.y = THREE.MathUtils.lerp(lensRef.current.rotation.y, state.pointer.x * 0.2, 0.1);
  });

  return (
    <>
      {/* 
        The Magnifying Glass element 
        Uses native sphere geometry scaled down on Z to form a lens 
      */}
      <mesh ref={lensRef} position={[0, 0, 8]} scale={[4, 4, 0.5]}>
        <sphereGeometry args={[1, 64, 64]} />
        <MeshTransmissionMaterial
          samples={16}
          resolution={1024}
          transmission={1}
          roughness={0.05}
          thickness={isDark ? 5 : 2.5}
          ior={isDark ? 1.15 : 1.25}
          chromaticAberration={isDark ? 0.1 : 0.05}
          anisotropy={0.1}
          clearcoat={1}
          clearcoatRoughness={0}
          color={isDark ? "#ffffff" : "#e0e0e0"}
        />
      </mesh>

      {/* 
        The Content that zooms forward as the user scrolls
        Placed behind the lens (Z < 8) so it gets distorted 
      */}
      <Scroll>
        <ZoomingTypography />
      </Scroll>
    </>
  );
}

// Separate component to handle the responsive text sizing based on viewport width
function ZoomingTypography() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const group = useRef();
  const titleRef = useRef();
  const data = useScroll();
  const { viewport } = useThree();
  
  // Calculate responsive font sizes
  const isMobile = viewport.width < 10;
  const titleSize = isMobile ? 1.5 : 3.0;
  const subSize = isMobile ? 0.8 : 1.5;

  const w = viewport.width;
  const h = viewport.height;

  // The text starts far away (negative Z) and zooms towards the camera (positive Z)
  useFrame(() => {
    if (!group.current || !titleRef.current) return;
    
    const scroll = data.offset; // 0 to 1

    // Main Title fades out and flies past camera
    titleRef.current.position.z = THREE.MathUtils.lerp(0, 25, scroll * 3);
    const titleOpacity = 1 - Math.max(0, scroll * 3);
    titleRef.current.material.opacity = titleOpacity;
    titleRef.current.material.transparent = true;

    // Subtexts slide forward from the background in a continuous stream
    group.current.children.forEach((child, index) => {
      // Space them out evenly so they arrive one after another
      const delay = 0.15 + (index * 0.08);
      // Only start moving if scroll has reached the delay
      let progress = Math.max(0, (scroll - delay) / (1 - delay));
      
      // Target Z goes from -20 to 15 (flying past the lens at Z=8)
      const targetZ = THREE.MathUtils.lerp(-20, 15, progress);
      child.position.z = targetZ;
      
      // Fade in smoothly as it approaches, fade out as it flies past camera
      if (child.material) {
        child.material.transparent = true;
        
        if (targetZ < -35) child.material.opacity = 0;
        else if (targetZ > 12) child.material.opacity = Math.max(0, 1 - (targetZ - 12) / 3);
        else child.material.opacity = Math.min(1, Math.max(0, (targetZ + 35) / 10));
      }
    });
  });

  return (
    <>
      {/* Main Title - Centered, starts at Z=0 */}
      <Text 
        ref={titleRef}
        position={[0, 0, 0]} 
        fontSize={titleSize} 
        fontWeight={900} 
        color={isDark ? "#ffffff" : "#1a2a0e"}
        letterSpacing={-0.05}
        anchorX="center" 
        anchorY="middle"
      >
        Niti Setu Engine
      </Text>

      {/* Zooming Data Tags - Start far behind (Z=-40) */}
      {/* Spread out in a wide orbital ring to avoid the massive center text */}
      <group ref={group}>
        <Text position={[-w / 2.5, h / 2.5, -40]} fontSize={subSize} color="#4ade80" fontWeight={800} anchorX="center" anchorY="middle">SCHEME MATCHING</Text>
        <Text position={[w / 2.5, h / 2.5, -40]} fontSize={subSize} color="#fcd34d" fontWeight={800} anchorX="center" anchorY="middle">PM-KISAN</Text>
        <Text position={[-w / 2.5, -h / 2.5, -40]} fontSize={subSize} color="#60a5fa" fontWeight={800} anchorX="center" anchorY="middle">CROP INSURANCE</Text>
        <Text position={[w / 2.5, -h / 2.5, -40]} fontSize={subSize} color="#f472b6" fontWeight={800} anchorX="center" anchorY="middle">KCC ELIGIBILITY</Text>
        <Text position={[-w / 2, 0, -40]} fontSize={subSize} color="#a78bfa" fontWeight={800} anchorX="center" anchorY="middle">DBT TRACKER</Text>
        <Text position={[0, h / 2.2, -40]} fontSize={subSize} color="#34d399" fontWeight={800} anchorX="center" anchorY="middle">VECTOR SEARCH</Text>
        <Text position={[0, -h / 2.2, -40]} fontSize={subSize} color="#fb923c" fontWeight={800} anchorX="center" anchorY="middle">MULTILINGUAL AI</Text>
        <Text position={[w / 3, -h / 4, -40]} fontSize={subSize} color="#2dd4bf" fontWeight={800} anchorX="center" anchorY="middle">SUBSIDY FINDER</Text>
        <Text position={[-w / 3, h / 4, -40]} fontSize={subSize} color="#facc15" fontWeight={800} anchorX="center" anchorY="middle">RAG PIPELINE</Text>
        <Text position={[w / 2, 0, -40]} fontSize={subSize * 1.5} color="#f87171" fontWeight={800} anchorX="center" anchorY="middle">FARMER FIRST</Text>
      </group>
    </>
  );
}
