import { Material, Texture } from "three";

export function disposeMaterial(material: Material) {
	const mat = material as Material & { map?: Texture };
	if (mat.map) mat.map.dispose();

	material.dispose();
}
