import { useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial, PerspectiveCamera, Stars } from "@react-three/drei";
import { useRef, useState, useEffect } from "react";
import * as THREE from "three";

export function FuturisticFleetScene() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Sync with the entrance animation of the parent
    const timer = setTimeout(() => setIsDark(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 8]} />
      <ambientLight intensity={isDark ? 0.2 : 1} />
      <pointLight position={[10, 10, 10]} intensity={isDark ? 2 : 0.5} color="#DC2626" />
      <pointLight position={[-10, -10, -10]} intensity={isDark ? 1 : 0.2} color="#1E3A8A" />
      
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      
      <Float speed={1.5} rotationIntensity={0.8} floatIntensity={0.5}>
        <NetworkMesh isDark={isDark} />
      </Float>

      <Float speed={2} rotationIntensity={0.5} floatIntensity={1} position={[0, -1, 0]}>
        <TruckModel isDark={isDark} />
      </Float>

      <gridHelper args={[30, 30, 0xffffff, 0x333333]} rotation={[Math.PI / 2.5, 0, 0]} position={[0, -2, -4]}>
        <meshBasicMaterial attach="material" transparent opacity={0.05} />
      </gridHelper>
    </>
  );
}

function NetworkMesh({ isDark }: { isDark: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.getElapsedTime() * 0.05;
      meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.08;
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 0, -2]}>
      <sphereGeometry args={[4, 48, 48]} />
      <MeshDistortMaterial
        color={isDark ? "#ffffff" : "#1E3A8A"}
        speed={1.5}
        distort={0.3}
        radius={1}
        wireframe
        opacity={isDark ? 0.15 : 0.4}
        transparent
      />
    </mesh>
  );
}

function TruckModel({ isDark }: { isDark: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.getElapsedTime() * 0.3) * 0.3;
      groupRef.current.position.y = Math.sin(state.clock.getElapsedTime() * 0.5) * 0.2;
    }
  });

  const materialColor = isDark ? "#ffffff" : "#1E3A8A";
  const accentColor = "#DC2626";

  return (
    <group ref={groupRef} scale={0.8} position={[1.5, -0.5, 2]}>
      {/* Abstract Truck Body (Cab) */}
      <mesh position={[-0.8, 0.6, 0]}>
        <boxGeometry args={[1.2, 1.2, 1.2]} />
        <meshStandardMaterial color={accentColor} wireframe emissive={accentColor} emissiveIntensity={isDark ? 1 : 0.2} />
      </mesh>
      {/* Trailer Section */}
      <mesh position={[1.2, 0.5, 0]}>
        <boxGeometry args={[2.8, 1, 1.2]} />
        <meshStandardMaterial color={materialColor} wireframe emissive={materialColor} emissiveIntensity={isDark ? 0.5 : 0} />
      </mesh>
      {/* Wheels */}
      {[[-0.8, 0, 0.6], [-0.8, 0, -0.6], [0.5, 0, 0.6], [0.5, 0, -0.6], [2.2, 0, 0.6], [2.2, 0, -0.6]].map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.3, 0.3, 0.15, 16]} />
          <meshStandardMaterial color={isDark ? "#ffffff" : "#333333"} wireframe={isDark} />
        </mesh>
      ))}
      
      {/* Connective Lines (Visualizing Network) */}
      <mesh position={[0.2, 0.6, 0]}>
        <boxGeometry args={[0.1, 0.1, 1.5]} />
        <meshStandardMaterial color={accentColor} transparent opacity={0.5} />
      </mesh>
    </group>
  );
}
