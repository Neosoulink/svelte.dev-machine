import { AmbientLight, Group, InstancedMesh, Mesh, MeshBasicMaterial } from 'three';
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
	private readonly _dummyItemMaterial = new MeshBasicMaterial({});

	private _manager?: WorldManager;

	public svelteConveyorBeltGroup?: Group;
	public conveyorRawItems: ConveyorItem[] = [];
	public conveyorPackedItem?: ConveyorItem;
	public svelteConveyorBeltCollider?: RAPIER.Collider;


	private _initItems() {
		if (!this.svelteConveyorBeltGroup) return;

		this.svelteConveyorBeltGroup.traverse((item) => {
			if (!item.name.endsWith('_item') || !(item instanceof Mesh)) return;
			const instancedMesh = new InstancedMesh(item.geometry, this._dummyItemMaterial, 2);
			const conveyorItem = new ConveyorItem(instancedMesh);

			if (item.name === 'cube_item') {
				this.conveyorPackedItem = conveyorItem;
				return;
			} else this.conveyorRawItems.push(conveyorItem);

			this._app.scene?.add(conveyorItem.object);
		});

		this._physic?.addToWorld(this.svelteConveyorBeltGroup);
	}

	public construct() {
		const svelteConveyorBeltGroup = (this._appResources.items['svelte-conveyor-belt'] as GLTF)
			?.scene;

		if (!(svelteConveyorBeltGroup instanceof Group)) return;
		this.svelteConveyorBeltGroup = svelteConveyorBeltGroup;

		this._initItems();

		this._app.scene.add(this._ambientLight, this.svelteConveyorBeltGroup);

		this._manager = new WorldManager(this);
		this._manager.construct();

		this.dispatchEvent(new Event(events.CONSTRUCTED));
		window.onkeydown = () =>
			this.conveyorRawItems.map((parentItem) => {
				parentItem.physicalProperties?.map((item) => {
					item.rigidBody.applyImpulse(
						{
							x: (Math.random() - 0.5) * 50,
							y: Math.random() * 50,
							z: (Math.random() - 0.5) * 50
						},
						true
					);
				});
			});
	}

	public update() {
		this._manager?.update();
	}

	public destruct() {
		this.conveyorRawItems = [];
		this.conveyorPackedItem = undefined;
	}
}
