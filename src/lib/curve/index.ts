import * as THREE from 'three';
import type JSON_DATA_FORMAT from '../../data/svelte-conveyor-belt-path.json';

export function createCurveFromJSON(json: typeof JSON_DATA_FORMAT) {
	const vertices = json.points;
	const points = [];
	for (const element of vertices) {
		const x = element.x;
		const y = element.y;
		const z = element.z;
		points.push(new THREE.Vector3(x, y, z));
	}

	const curve = new THREE.CatmullRomCurve3(points);
	curve.closed = json.closed;

	return curve;
}
