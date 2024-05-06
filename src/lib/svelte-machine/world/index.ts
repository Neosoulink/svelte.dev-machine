import { AmbientLight, Group, Matrix4, Mesh, MeshBasicMaterial, Quaternion, Vector3 } from 'three';
import type { GLTF } from 'three/addons/loaders/GLTFLoader.js';
import type RAPIER from '@dimforge/rapier3d';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

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
	private readonly _dummyItemMaterial = new MeshBasicMaterial({ transparent: true });

	private _manager?: WorldManager;

	public svelteConveyorBeltGroup?: Group;
	public conveyorRawItems: ConveyorItem[] = [];
	public conveyorPackedItem?: ConveyorItem;
	public svelteConveyorBeltCollider?: RAPIER.Collider;

	private _initItems() {
		if (!this.svelteConveyorBeltGroup) return;

		const _matrix4 = new Matrix4();
		const _position = new Vector3();
		const _rotation = new Quaternion();
		const _scale = new Vector3();

		this.svelteConveyorBeltGroup.traverse((item) => {
			if (!(item instanceof Mesh)) return;

			if (item.name === 'convoyer-belt' && this._physic?.world) {
				const invertedParentMatrixWorld = item.matrixWorld.clone().invert();
				const worldScale = item.getWorldScale(_scale);
				const clonedGeometry = mergeVertices(item.geometry);
				const triMeshMap = clonedGeometry.attributes.position.array as Float32Array;
				const triMeshUnit = clonedGeometry.index?.array as Uint32Array;
				const triMeshCollider = this._physic.rapier.ColliderDesc.trimesh(triMeshMap, triMeshUnit);

				_matrix4
					.copy(item.matrixWorld)
					.premultiply(invertedParentMatrixWorld)
					.decompose(_position, _rotation, _scale);

				if (triMeshCollider) {
					const collider = this._physic.world.createCollider(triMeshCollider);
					collider.setTranslation({
						x: _position.x * worldScale.x,
						y: _position.y * worldScale.y,
						z: _position.z * worldScale.z
					});
				}
			}

			if (!item.name.endsWith('_item')) return;

			const conveyorItem = new ConveyorItem({
				geometry: item.geometry,
				material: this._dummyItemMaterial,
				count: 50
			});

			if (item.name === 'cube_item') {
				this.conveyorPackedItem = conveyorItem;
			} else this.conveyorRawItems.push(conveyorItem);

			this._app.scene?.add(conveyorItem.mesh);
		});

		setTimeout(() => {
			this.conveyorPackedItem?.activation({
				index: Math.round(Math.random() * this.conveyorPackedItem.maxCount),
				enabled: true
			});
		}, 1000);
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
	}

	public update() {
		this._manager?.update();
	}

	public destruct() {
		this.conveyorRawItems = [];
		this.conveyorPackedItem = undefined;
	}
}
