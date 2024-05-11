import { EquirectangularReflectionMapping, SRGBColorSpace, Texture, TextureLoader } from 'three';

import { events } from '$lib/experience/static';
import { SvelteMachineExperience } from '.';

export class Environments extends EventTarget {
	private readonly _experience = new SvelteMachineExperience();
	private readonly _app = this._experience.app;
	private readonly _resources = this._app.resources;
	private readonly _world = this._experience.world;

	public textureLoader?: TextureLoader;
	public envMap?: Texture;

	construct() {
		this.envMap = this._resources.items['scifi-texture'] as Texture | undefined;
		if (!this.envMap) return;

		this.envMap.mapping = EquirectangularReflectionMapping;
		this.envMap.colorSpace = SRGBColorSpace;

		this._world?.modelMaterials.forEach((material) => {
			material.envMapIntensity = 0.9;
			material.roughness = 0.2;
			material.metalness = 0.4;

			if (material.name === 'metal-orange') {
				material.roughness = 0.1;
				material.metalness = 0.5;
			}

			if (['plastic-black', 'white'].includes(material.name)) {
				material.roughness = 0.5;
				material.metalness = 0.1;
			}

			if (material.name === 'textures') material.envMapIntensity = 1;
		});

		this._app.scene.environment = this.envMap;

		this.dispatchEvent(new Event(events.CONSTRUCTED));
	}
}
