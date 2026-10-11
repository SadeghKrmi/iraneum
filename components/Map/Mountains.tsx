"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { ConeGeometry, Matrix4, Quaternion, Vector3, type InstancedMesh } from "three";
import { toSphere } from "@/lib/geo";
import { scatterPeaks } from "@/lib/mountains";
import { LAND_RADIUS } from "./constants";
import type { MapPalette } from "./palette";

const Y = new Vector3(0, 1, 0);

/** A 5-sided cone standing on its base at y = 0, 1 unit wide and tall (scaled per peak). */
function peakGeometry() {
  const cone = new ConeGeometry(1, 1, 5, 1);
  cone.translate(0, 0.5, 0);
  return cone;
}

/** Stylized low-poly mountain ranges; tall peaks get a snow cap. Built once (deterministic). */
export function Mountains({ palette }: { palette: MapPalette }) {
  const { peaks, snowy, rockGeometry, capGeometry } = useMemo(() => {
    const peaks = scatterPeaks();
    return { peaks, snowy: peaks.filter((p) => p.snowy), rockGeometry: peakGeometry(), capGeometry: peakGeometry() };
  }, []);
  const rock = useRef<InstancedMesh>(null);
  const caps = useRef<InstancedMesh>(null);

  useLayoutEffect(() => {
    const matrix = new Matrix4();
    const position = new Vector3();
    const up = new Vector3();
    const quaternion = new Quaternion();
    const scale = new Vector3();
    peaks.forEach((p, i) => {
      toSphere(p.at, LAND_RADIUS - 0.05, position);
      quaternion.setFromUnitVectors(Y, up.copy(position).normalize());
      matrix.compose(position, quaternion, scale.set(p.radius, p.height, p.radius));
      rock.current?.setMatrixAt(i, matrix);
    });
    // Snow caps: the top ~third of the tallest peaks.
    snowy.forEach((p, i) => {
      toSphere(p.at, LAND_RADIUS - 0.05 + p.height * 0.66, position);
      quaternion.setFromUnitVectors(Y, up.copy(position).normalize());
      matrix.compose(position, quaternion, scale.set(p.radius * 0.35, p.height * 0.35, p.radius * 0.35));
      caps.current?.setMatrixAt(i, matrix);
    });
    if (rock.current) rock.current.instanceMatrix.needsUpdate = true;
    if (caps.current) caps.current.instanceMatrix.needsUpdate = true;
  }, [peaks, snowy]);

  return (
    <group>
      <instancedMesh ref={rock} args={[rockGeometry, undefined, peaks.length]} frustumCulled={false} renderOrder={2}>
        <meshStandardMaterial color={palette.mountain} roughness={1} flatShading />
      </instancedMesh>
      <instancedMesh ref={caps} args={[capGeometry, undefined, snowy.length]} frustumCulled={false} renderOrder={2}>
        <meshStandardMaterial color={palette.snow} roughness={0.9} flatShading />
      </instancedMesh>
    </group>
  );
}
