import { Texture, LinearSRGBColorSpace, VideoTexture } from 'three';

import { events } from '$lib/experience/static';

import { SvelteMachineExperience } from '.';

export class Loader extends EventTarget {
	protected readonly _experience = new SvelteMachineExperience();
	private readonly resources = this._experience.app.resources;

	public progress = 0;
	public availableTextures: { [name: string]: Texture } = {};
	public availableAudios: { [name: string]: AudioBuffer } = {};

	constructor() {
		super();

		// RESOURCES
		this.resources.setDracoLoader('https://www.gstatic.com/draco/versioned/decoders/1.4.3/');
		this.resources.setSources([
			{
				name: 'svelte-conveyor-belt',
				path: '/3D/svelte-conveyor-belt.glb',
				type: 'gltfModel'
			},
			{
				name: 'scifi-texture',
				path: '/imgs/scifi.jpg',
				type: 'texture'
			}
		]);
	}

	/** Correct resource textures color and flip faces. */
	public correctTextures(item: Texture) {
		if (item instanceof Texture) {
			if (!(item instanceof VideoTexture)) item.flipY = false;
			item.colorSpace = LinearSRGBColorSpace;
		}
	}

	public construct() {
		this.progress = 0;

		const onStart = () => {
			this.dispatchEvent(new Event(events.STARTED));
		};

		const onProgress = () => {
			this.progress = (this.resources.loaded / this.resources.toLoad) * 100;
			this.dispatchEvent(new Event(events.PROGRESSED));
		};

		const onLoad = () => {
			this.resources.removeEventListener(events.STARTED, onStart);
			this.resources.removeEventListener(events.PROGRESSED, onProgress);
			this.resources.removeEventListener(events.LOADED, onLoad);
			this.dispatchEvent(new Event(events.LOADED));
		};

		this.resources.addEventListener(events.STARTED, onStart);
		this.resources.addEventListener(events.PROGRESSED, onProgress);
		this.resources.addEventListener(events.LOADED, onLoad);
		this.resources.startLoading();

		this.dispatchEvent(new Event(events.CONSTRUCTED));
	}

	public destruct() {
		this.resources.loadingManager.removeHandler(/onStart|onError|onProgress|onLoad/);
		const keys = Object.keys(this.resources.items);

		for (const element of keys) {
			const item = this.resources.items[element];
			if (item instanceof Texture) item.dispose();
		}

		this.dispatchEvent(new Event(events.DESTRUCTED));
	}
}
