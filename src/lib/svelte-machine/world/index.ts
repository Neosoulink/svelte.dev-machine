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

	private _manager?: WorldManager;

	public readonly maxRawItemCount = 20;
	public readonly conveyorBeltPath = createCurveFromJSON(conveyorBeltPathJson);

	public sumMaxRawItemCount = 0;
	public svelteConveyorBeltGroup?: Group;
	public conveyorBelt?: ConveyorBelt;
	public conveyorRawItems: ConveyorItem[] = [];
	public conveyorPackedItem?: ConveyorItem;
	public svelteConveyorBeltCollider?: RAPIER.Collider;

	private _initItems() {
		if (!this.svelteConveyorBeltGroup) return;
		let conveyorPackedItem: Mesh | undefined;

		this.svelteConveyorBeltGroup.traverse((item) => {
			if (!(item instanceof Mesh)) return;

			if (item.name === 'convoyer-belt') {
				this.conveyorBelt = new ConveyorBelt(item);
			}
			if (!item.name.endsWith('_item')) return;

			if (item.name === 'cube_item') {
				conveyorPackedItem = item;
			} else {
				const conveyorItem = new ConveyorItem({
					geometry: item.geometry,
					material: this._dummyItemMaterial,
					count: this.maxRawItemCount
				});
				this.sumMaxRawItemCount += this.maxRawItemCount;
				this.conveyorRawItems.push(conveyorItem);

				this._app.scene?.add(conveyorItem.mesh);
			}

			item.visible = false;
		});

		if (conveyorPackedItem) {
			this.conveyorPackedItem = new ConveyorItem({
				geometry: conveyorPackedItem.geometry,
				material: this._dummyItemMaterial,
				count: this.sumMaxRawItemCount
			});
			this._app.scene.add(this.conveyorPackedItem.mesh);
		}
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

		this._manager = new WorldManager(this);
		this._manager.construct();

		this._app.scene.add(this._ambientLight, this.svelteConveyorBeltGroup, _cameraCurvePathLine);

		this.dispatchEvent(new Event(events.CONSTRUCTED));
	}

	public update() {
		this._manager?.update();
	}

	public destruct() {
		this.conveyorRawItems = [];
		this.conveyorPackedItem = undefined;
	}
}
