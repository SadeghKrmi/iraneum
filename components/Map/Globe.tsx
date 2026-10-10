"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import { AdditiveBlending, BackSide, Color, type DirectionalLight } from "three";
import { GLOBE_RADIUS } from "@/lib/geo";
import type { MapPalette } from "./palette";

const atmosphereVertex = /* glsl */ `
  varying vec3 vNormal;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const atmosphereFragment = /* glsl */ `
  uniform vec3 color;
  varying vec3 vNormal;
  void main() {
    float intensity = pow(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.0);
    gl_FragColor = vec4(color, 1.0) * intensity;
  }
`;

/** The ocean sphere, a soft atmosphere rim, and light that comes from the viewer's side. */
export function Globe({ palette }: { palette: MapPalette }) {
  const light = useRef<DirectionalLight>(null);
  const camera = useThree((s) => s.camera);
  useFrame(() => {
    light.current?.position.copy(camera.position);
  });

  return (
    <>
      <hemisphereLight args={["#ffffff", palette.sea, 0.9]} />
      <directionalLight ref={light} intensity={1.9} />
      <mesh renderOrder={0}>
        <sphereGeometry args={[GLOBE_RADIUS, 128, 64]} />
        <meshStandardMaterial color={palette.sea} roughness={0.85} metalness={0} />
      </mesh>
      <mesh scale={1.07}>
        <sphereGeometry args={[GLOBE_RADIUS, 64, 32]} />
        <shaderMaterial
          key={palette.atmosphere}
          vertexShader={atmosphereVertex}
          fragmentShader={atmosphereFragment}
          uniforms={{ color: { value: new Color(palette.atmosphere) } }}
          side={BackSide}
          blending={AdditiveBlending}
          transparent
          depthWrite={false}
        />
      </mesh>
    </>
  );
}
