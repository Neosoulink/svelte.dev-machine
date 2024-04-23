import {
	AmbientLight,
	BoxGeometry,
	Color,
	DynamicDrawUsage,
	Group,
	InstancedMesh,
	Matrix4,
	Mesh,
	MeshBasicMaterial
} from 'three';
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
	public conveyorItems: ConveyorItem[] = [];
	public cubeItem?: ConveyorItem;
	public svelteConveyorBeltCollider?: RAPIER.Collider;

	instancedItem?: InstancedMesh;

	private _initItems() {
		if (!this.svelteConveyorBeltGroup) return;

		this.svelteConveyorBeltGroup.traverse((item) => {
			if (!item.name.endsWith('_item') || !(item instanceof Mesh)) return;

			if (item.name === 'cube_item') {
				item.material = this._dummyItemMaterial;
				item.scale.set(5, 5, 5);
				item.position.setY(50);
				item.userData.physics = { mass: 2 };

				this.instancedItem = new InstancedMesh(item.geometry, this._dummyItemMaterial, 100);
				this.instancedItem.position.set(0, 0, 0);
				this.instancedItem.instanceMatrix.setUsage(DynamicDrawUsage);
				this.instancedItem.userData.physics = { mass: 1 };

				const matrix = new Matrix4();
				const color = new Color();

				for (let i = 0; i < this.instancedItem.count; i++) {
					matrix.setPosition(Math.random() * 10, i * 0.1, Math.random() * 10);

					this.instancedItem.setMatrixAt(i, matrix);
					this.instancedItem.setColorAt(i, color.setHex(Math.random() * 0xffffff));
				}

				this._app.scene?.add(this.instancedItem, item);
			}
		});

		this.svelteConveyorBeltGroup.userData.physics = { mass: 0 };
		this._physic?.addScene(this._app.scene);
	}

	public construct() {
		const svelteConveyorBeltGroup = (this._appResources.items['svelte-conveyor-belt'] as GLTF)
			?.scene;

		if (!(svelteConveyorBeltGroup instanceof Group)) return;
		this.svelteConveyorBeltGroup = svelteConveyorBeltGroup;

		const floor = new Mesh(new BoxGeometry(500, 5, 500), this._dummyItemMaterial);
		floor.position.setY(-10);
		floor.userData.physics = { mass: 0 };

		this._app.scene.add(this._ambientLight, floor);
		this._initItems();

		this._manager = new WorldManager(this);
		this._manager.construct();

		this.dispatchEvent(new Event(events.CONSTRUCTED));
	}

	public update() {
		/* TODO: document why this method 'destruct' is empty */
	}

	public destruct() {
		/* TODO: document why this method 'destruct' is empty */
	}
}
