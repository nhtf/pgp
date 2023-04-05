import * as THREE from "three";

const audioLoader = new THREE.AudioLoader();

export async function loadAudio(listener: THREE.AudioListener, path: string) {
	const startTime = Date.now();
	const sound = new THREE.PositionalAudio(listener);
	const buffer = await audioLoader.loadAsync(path);
	sound.setBuffer(buffer);
	sound.setRefDistance(20);
	return sound;
}
