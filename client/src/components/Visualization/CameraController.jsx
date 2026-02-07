import { useRef, useCallback, useEffect } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { getPositionAtTime, estimateOrbit } from "../../utils/orbitalMechanics";

/**
 * CameraController — manages smooth animated transitions between:
 *   • Default overview position
 *   • Focused view on a selected asteroid
 */
const CameraController = ({
  targetAsteroid = null,
  timeOffset = 0,
  enabled = true,
}) => {
  const { camera } = useThree();
  const targetPos = useRef(new THREE.Vector3(0, 2, 8));
  const targetLookAt = useRef(new THREE.Vector3(0, 0, 0));
  const currentLookAt = useRef(new THREE.Vector3(0, 0, 0));
  const transitionSpeed = useRef(0.03);

  // Default camera state
  const defaultPos = new THREE.Vector3(0, 3, 9);
  const defaultLook = new THREE.Vector3(0, 0, 0);

  useEffect(() => {
    if (!enabled) return;

    if (targetAsteroid) {
      transitionSpeed.current = 0.025; // slower for dramatic effect
      const orbital = estimateOrbit(targetAsteroid);
      const astPos = getPositionAtTime(orbital, timeOffset);

      // Position camera offset from asteroid, looking at it
      const dir = astPos.clone().normalize();
      const offset = dir.clone().multiplyScalar(1.5);
      const up = new THREE.Vector3(0, 1, 0);
      const side = dir.clone().cross(up).normalize().multiplyScalar(1.2);

      targetPos.current.copy(astPos).add(offset).add(side);
      targetPos.current.y += 0.8;
      targetLookAt.current.copy(astPos);
    } else {
      transitionSpeed.current = 0.04;
      targetPos.current.copy(defaultPos);
      targetLookAt.current.copy(defaultLook);
    }
  }, [targetAsteroid, timeOffset, enabled]);

  useFrame(() => {
    if (!enabled) return;

    const speed = transitionSpeed.current;

    // Lerp camera position
    camera.position.lerp(targetPos.current, speed);

    // Lerp look-at target
    currentLookAt.current.lerp(targetLookAt.current, speed);
    camera.lookAt(currentLookAt.current);
  });

  return null;
};

export default CameraController;
