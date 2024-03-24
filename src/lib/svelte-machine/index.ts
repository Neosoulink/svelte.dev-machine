import { events } from '$lib/experience/static';
import { Experience } from '$lib/experience';
import { World } from './world';
import { Physic } from './physic';

export class SvelteMachineExperience extends EventTarget {
	protected static _self?: SvelteMachineExperience;

	readonly app!: Experience;

	public readonly world?: World;
	public readonly physic?: Physic;

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
					enableDebug: true,
					axesSizes: 15,
					gridSizes: 30,
					sources: [
						{
							name: 'svelte-conveyor-belt',
							path: '/3D/svelte-conveyor-belt.glb',
							type: 'gltfModel'
						}
					]
				},
				domRef
			);

			this.world = new World();
			this.physic = new Physic();
		} catch (err) {
			throw new Error(err instanceof Error ? err.message : 'Something went wrong');
		}
	}

	private _onLoaded?: () => unknown;
	private _onUpdated?: () => unknown;

	public construct() {
		try {
			this.world?.construct();

			this._onLoaded = async () => {
				try {
					await this.physic?.construct();
					this.world?.construct();

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
		this.world?.update();
	}
}
