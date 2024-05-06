import {
	AmbientLight,
	BufferGeometry,
	Group,
	Line,
	LineBasicMaterial,
	Mesh,
	MeshBasicMaterial
} from 'three';
import type { GLTF } from 'three/addons/loaders/GLTFLoader.js';
import type RAPIER from '@dimforge/rapier3d';

import { events } from '$lib/experience/static';
import { createCurveFromJSON } from '$lib/curve';

import conveyorBeltPathJson from '../../../data/svelte-conveyor-belt-path.json';

import { SvelteMachineExperience } from '..';
import { WorldManager } from './manager';
import { ConveyorItem } from './conveyor-item';
import { ConveyorBelt } from './conveyor-belt';

export class World extends EventTarget {
	private readonly _experience = new SvelteMachineExperience();
	private readonly _app = this._experience.app;
	private readonly _appResources = this._app.resources;
	private readonly _ambientLight = new AmbientLight(0xffffff, 1);
	private readonly _dummyItemMaterial = new MeshBasicMaterial({ transparent: true });
	private readonly _maxInstancesCount = 100;

	private _manager?: WorldManager;

	public readonly conveyorBeltPath = createCurveFromJSON(conveyorBeltPathJson);

	public svelteConveyorBeltGroup?: Group;
	public conveyorBelt?: ConveyorBelt;
	public conveyorRawItems: ConveyorItem[] = [];
	public conveyorPackedItem?: ConveyorItem;
	public svelteConveyorBeltCollider?: RAPIER.Collider;

	private _initItems() {
		if (!this.svelteConveyorBeltGroup) return;

		this.svelteConveyorBeltGroup.traverse((item) => {
			if (!(item instanceof Mesh)) return;

			if (item.name === 'convoyer-belt') {
				this.conveyorBelt = new ConveyorBelt(item);
			}
			if (!item.name.endsWith('_item')) return;

			const conveyorItem = new ConveyorItem({
				geometry: item.geometry,
				material: this._dummyItemMaterial,
				count: this._maxInstancesCount
			});

			if (item.name === 'cube_item') {
				this.conveyorPackedItem = conveyorItem;
			} else this.conveyorRawItems.push(conveyorItem);
			item.visible = false;

			this._app.scene?.add(conveyorItem.mesh);
		});

		let counter = 0;
		setInterval(() => {
			this.conveyorPackedItem?.activation({
				index: this.conveyorPackedItem.maxCount - 1 - counter,
				enabled: true
			});
			counter++;
		}, 1000);
	}

	public construct() {
		const svelteConveyorBeltGroup = (this._appResources.items['svelte-conveyor-belt'] as GLTF)
			?.scene;

		if (!(svelteConveyorBeltGroup instanceof Group)) return;
		this.svelteConveyorBeltGroup = svelteConveyorBeltGroup;

		this._initItems();

		/** Remove in prod */
		const _cameraCurvePathLine = new Line(
			new BufferGeometry().setFromPoints(this.conveyorBeltPath.points),
			new LineBasicMaterial({
				color: 0xff0000
			})
		);

		this._app.scene.add(this._ambientLight, this.svelteConveyorBeltGroup, _cameraCurvePathLine);

		this._manager = new WorldManager(this);
		this._manager.construct();

		this.dispatchEvent(new Event(events.CONSTRUCTED));
	}

	public update() {
		this._manager?.update();
		this.conveyorPackedItem?.update();
	}

	public destruct() {
		this.conveyorRawItems = [];
		this.conveyorPackedItem = undefined;
	}
}
