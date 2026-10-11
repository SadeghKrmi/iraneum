"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useCallback, useEffect, useRef } from "react";
import { AdditiveBlending, BackSide, Color, type DirectionalLight, type WebGLProgramParametersWithUniforms } from "three";
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

/**
 * Overlapping "wave scale" arcs (like fish scales) in lon/lat, ~1.2° per scale. Returns 0–1: how much of
 * the pattern colour to show at a point on the ocean sphere.
 */
const waveScale = /* glsl */ `
  float waveScale(vec3 p) {
    vec3 n = normalize(p);
    float lat = asin(clamp(n.y, -1.0, 1.0));
    float lon = atan(n.x, n.z);
    vec2 q = vec2(lon * cos(lat), lat) * (57.29578 / 1.2);
    float bestRow = 1e9;
    float bestD = 0.0;
    for (int j = -1; j <= 1; j++) {
      for (int i = -1; i <= 1; i++) {
        float row = floor(q.y) + float(j);
        float shift = mod(row, 2.0) * 0.5;
        vec2 c = vec2(floor(q.x - shift) + float(i) + shift + 0.5, row);
        float d = length(q - c);
        // Each scale is a unit circle; lower rows lie on top, so only their upper arcs show.
        if (d < 1.0 && c.y < bestRow) { bestRow = c.y; bestD = d; }
      }
    }
    if (bestRow > 1e8) return 0.0;
    float f = fract(bestD * 3.0);
    float w = fwidth(bestD * 3.0) * 1.5;
    return 1.0 - smoothstep(0.0, w, min(f, 1.0 - f));
  }
`;

/** The ocean sphere with a wave pattern, a soft atmosphere rim, and light from the viewer's side. */
export function Globe({ palette }: { palette: MapPalette }) {
  const light = useRef<DirectionalLight>(null);
  const camera = useThree((s) => s.camera);
  // Shader uniforms live in a ref: they change every frame without re-rendering React.
  const sea = useRef({ uPattern: { value: new Color(palette.seaPattern) }, uFade: { value: 0 } });
  useEffect(() => {
    sea.current.uPattern.value.set(palette.seaPattern);
  }, [palette.seaPattern]);
  const patchSea = useCallback(
    (shader: WebGLProgramParametersWithUniforms) => {
      shader.uniforms.uPattern = sea.current.uPattern;
      shader.uniforms.uFade = sea.current.uFade;
      shader.vertexShader = shader.vertexShader
        .replace("#include <common>", "#include <common>\nvarying vec3 vSeaPosition;")
        .replace("#include <begin_vertex>", "#include <begin_vertex>\nvSeaPosition = position;");
      shader.fragmentShader = shader.fragmentShader
        .replace(
          "#include <common>",
          `#include <common>\nvarying vec3 vSeaPosition;\nuniform vec3 uPattern;\nuniform float uFade;\n${waveScale}`,
        )
        .replace(
          "#include <color_fragment>",
          "#include <color_fragment>\ndiffuseColor.rgb = mix(diffuseColor.rgb, uPattern, waveScale(vSeaPosition) * uFade * 0.38);",
        );
    },
    [],
  );

  useFrame(() => {
    light.current?.position.copy(camera.position);
    // The pattern shows close up and fades out as the camera pulls away (it would shimmer when tiny).
    const altitude = camera.position.length() - GLOBE_RADIUS;
    sea.current.uFade.value = Math.min(1, Math.max(0, (170 - altitude) / 100));
  });

  return (
    <>
      <hemisphereLight args={["#ffffff", palette.sea, 0.9]} />
      <directionalLight ref={light} intensity={1.9} />
      <mesh renderOrder={0}>
        <sphereGeometry args={[GLOBE_RADIUS, 128, 64]} />
        <meshStandardMaterial
          color={palette.sea}
          roughness={0.85}
          metalness={0}
          onBeforeCompile={patchSea}
        />
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
