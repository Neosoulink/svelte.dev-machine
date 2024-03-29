import { AmbientLight, Group } from 'three';
import type { GLTF } from 'three/addons/loaders/GLTFLoader.js';
import type RAPIER from '@dimforge/rapier3d';

import { events } from '$lib/experience/static';

import { SvelteMachineExperience } from '..';
import { WorldManager } from './manager';

export class World extends EventTarget {
	private readonly _experience = new SvelteMachineExperience();
	private readonly _app = this._experience.app;
	private readonly _appResources = this._app.resources;
	private readonly _physic = this._experience.physic;
	private readonly _ambientLight = new AmbientLight(0xffffff, 1);

	private _manager?: WorldManager;

	public svelteConveyorBelt?: Group;
	public svelteConveyorBeltCollider?: RAPIER.Collider;

	public construct() {
		const svelteConveyorBelt = (this._appResources.items['svelte-conveyor-belt'] as GLTF)?.scene;

		if (!(svelteConveyorBelt instanceof Group)) return;

		this.svelteConveyorBelt = svelteConveyorBelt;

		this.svelteConveyorBeltCollider = this._physic?.applyPhysic(svelteConveyorBelt);

		this._app.scene.add(this._ambientLight, this.svelteConveyorBelt ?? new Group());

		this._manager = new WorldManager(this);
		this._manager.construct();
		this.dispatchEvent(new Event(events.CONSTRUCTED));
	}

	public destruct() {}

	public update() {
		this._manager?.update();

		if (this.svelteConveyorBelt && this.svelteConveyorBeltCollider) {
			this.svelteConveyorBelt.position.copy(this.svelteConveyorBeltCollider.translation());
			this.svelteConveyorBelt.quaternion.copy(this.svelteConveyorBeltCollider.rotation());
		}
	}
}
