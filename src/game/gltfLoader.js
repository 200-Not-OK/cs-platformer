// Utility to load GLTF models
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as THREE from 'three';

export function loadGLTFModel(url) {
  return new Promise((resolve, reject) => {
    const loader = new GLTFLoader();
    loader.load(
      url,
      (gltf) => {
        if (!gltf || !gltf.scene) {
          reject(new Error(`Invalid GLTF loaded from ${url}: missing scene`));
          return;
        }
        resolve(gltf);
      },
      (progress) => {
        // Optional: log loading progress
        // console.log('Loading progress:', progress);
      },
      (error) => {
        reject(new Error(`Failed to load GLTF from ${url}: ${error.message || error}`));
      }
    );
  });
}
