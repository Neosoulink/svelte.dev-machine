import { events } from '$lib/experience/static';
import { Experience } from '$lib/experience';

import { Physic } from './physic';
import { Renderer } from './renderer';
import { Camera } from './camera';
import { Lights } from './lights';
import { World } from './world';
import { Environments } from './environments';

export class SvelteMachineExperience extends EventTarget {
	protected static _self?: SvelteMachineExperience;

	readonly app!: Experience;

	public readonly physic?: Physic;
	public readonly renderer?: Renderer;
	public readonly camera?: Camera;
	public readonly lights?: Lights;
	public readonly world?: World;
	public readonly environments?: Environments;

	/**
	 * `SvelteMachineExperience` constructor
	 *
	 * @param domRef `querySelector` dom ref string
	 */
	constructor(domRef = 'canvas#app') {
		try {
			super();

			if (SvelteMachineExperience._self) return SvelteMachineExperience._self;
			SvelteMachineExperience._self = this;

			this.app = new Experience(
				{
					enableDebug: false,
					sources: [
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
					]
				},
				domRef
			);

			this.physic = new Physic();
			this.renderer = new Renderer();
			this.camera = new Camera();
			this.lights = new Lights();
			this.world = new World();
			this.environments = new Environments();
		} catch (err) {
			throw new Error(err instanceof Error ? err.message : 'Something went wrong');
		}
	}

	private _onLoaded?: () => unknown;
	private _onUpdated?: () => unknown;

	public async construct() {
		try {
			await this.physic?.construct();
			this.renderer?.construct();
			this.camera?.construct();
			this.lights?.construct();

			this._onLoaded = () => {
				try {
					this.world?.construct();
					this.environments?.construct();

					this._onUpdated = () => this.update();
					this.app?.addEventListener(events.UPDATED, this._onUpdated);

					this.dispatchEvent?.(new Event(events.CONSTRUCTED));
				} catch (err) {
					throw new Error(err instanceof Error ? err.message : 'Something went wrong');
				}
			};

			this.app?.resources.addEventListener(events.LOADED, this._onLoaded);
			this.app?.resources.startLoading();

			this.dispatchEvent?.(new Event(events.CONSTRUCTED));
		} catch (err) {
			throw new Error(err instanceof Error ? err.message : 'Something went wrong');
		}
	}

	public destruct() {
		this.world?.destruct();
		this.app.destruct();

		if (this._onLoaded) this.app?.removeEventListener(events.LOADED, this._onLoaded);
		if (this._onUpdated) this.app?.removeEventListener(events.UPDATED, this._onUpdated);

		this._onLoaded = undefined;
		this._onUpdated = undefined;
		SvelteMachineExperience._self = undefined;
		this.dispatchEvent?.(new Event(events.DESTRUCTED));
	}

	public update() {
		this.physic?.update();
		this.lights?.update();
		this.camera?.update();
		this.world?.update();
	}
}
