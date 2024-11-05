import * as THREE from 'three';
import { vertexShader } from './vertexShader';
import { fragmentShader } from './fragmentShader';

export const createGlobeMaterial = (earthTexture) => {
  return new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      u_map_tex: { type: "t", value: earthTexture },
      u_dot_size: { type: "f", value: 0.3 }, 
      u_pointer: { type: "v3", value: new THREE.Vector3(0, 0, 1) },
      u_time_since_click: { value: 0 },
    },
    transparent: true,
    depthWrite: false,
  });
};