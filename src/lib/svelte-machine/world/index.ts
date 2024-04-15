import { AmbientLight, Group, Mesh } from 'three';
import type { GLTF } from 'three/addons/loaders/GLTFLoader.js';
import type RAPIER from '@dimforge/rapier3d';

import { events } from '$lib/experience/static';

import { SvelteMachineExperience } from '..';
import { WorldManager } from './manager';
import { ConveyorItem } from './conveyor-item';

export class World extends EventTarget {
	private readonly _experience = new SvelteMachineExperience();
	private readonly _app = this._experience.app;
	private readonly _appResources = this._app.resources;
	private readonly _physic = this._experience.physic;
	private readonly _ambientLight = new AmbientLight(0xffffff, 1);

	private _manager?: WorldManager;

	public svelteConveyorBeltGroup?: Group;
	public conveyorItems: ConveyorItem[] = [];
	public coneItem?: ConveyorItem;
	public svelteConveyorBeltCollider?: RAPIER.Collider;

	private _traverseConveyorBeltGroup() {
		if (!this.svelteConveyorBeltGroup) return;
		this.svelteConveyorBeltGroup.traverse((item) => {
			if (/_item$/.test(item.name) && item instanceof Mesh) {
				const newItem = new ConveyorItem(item);
				this.conveyorItems.push(newItem);

				if (item.name === 'cone_item') this.coneItem = newItem;
			}
		});
	}

	public construct() {
		const svelteConveyorBeltGroup = (this._appResources.items['svelte-conveyor-belt'] as GLTF)
			?.scene;

		if (!(svelteConveyorBeltGroup instanceof Group)) return;

		this.svelteConveyorBeltGroup = svelteConveyorBeltGroup;
		this._app.scene.add(this._ambientLight, this.svelteConveyorBeltGroup ?? new Group());

		this._traverseConveyorBeltGroup();

		this._manager = new WorldManager(this);
		this._manager.construct();
		this.dispatchEvent(new Event(events.CONSTRUCTED));
	}

	public destruct() {}

	public update() {
		this._manager?.update();
	}
}
