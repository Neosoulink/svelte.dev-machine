import {
	AmbientLight,
	BufferGeometry,
	DirectionalLight,
	Group,
	Line,
	LineBasicMaterial,
	Matrix4,
	Mesh,
	Object3D,
	Quaternion,
	Vector3
} from 'three';
import type { GLTF } from 'three/addons/loaders/GLTFLoader.js';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { ColliderDesc } from '@dimforge/rapier3d';

import conveyorBeltPathJson from '../../../data/svelte-conveyor-belt-path.json';

import { events } from '$lib/experience/static';
import { createCurveFromJSON } from '$lib/curve';

import { SvelteMachineExperience } from '..';
import { WorldManager } from './manager';
import { InstancedItem } from './instanced-item';

import type { Object3DWithGeometry } from '../physic';

export class World extends EventTarget {
	private readonly _experience = new SvelteMachineExperience();
	private readonly _physic = this._experience.physic;
	private readonly _app = this._experience.app;
	private readonly _appResources = this._app.resources;
	private readonly _ambientLight = new AmbientLight(0xffffff, 6);
	private readonly _matrix = new Matrix4();
	private readonly _position = new Vector3();
	private readonly _rotation = new Quaternion();
	private readonly _scale = new Vector3(1, 1, 1);

	private _manager?: WorldManager;

	public readonly maxRawItemCount = 20;
	public readonly conveyorBeltPath = createCurveFromJSON(conveyorBeltPathJson);

	public sumMaxRawItemCount = 0;
	public modelsGroup?: Group;
	public boxedItem?: InstancedItem;
	public beltDotsItem?: InstancedItem;
	public rawItems: InstancedItem[] = [];

	private _initItems(scene?: Group) {
		if (!(scene instanceof Group)) throw new Error('No Model Scene Found');

		let boxedItem: Mesh | undefined;

		scene.traverse((object) => {
			if (!(object instanceof Mesh)) return;

			if (object.name === 'belt') this._setObjectFixedPhysicalShape(object);

			if (object.name === 'belt_dots') {
				const count = this.conveyorBeltPath.points.length / 2;
				this.beltDotsItem = new InstancedItem({
					geometry: object.geometry,
					material: object.material,
					count,
					withPhysics: false
				});

				this.beltDotsItem.mesh.userData = { progresses: [] };

				for (let i = 0; i < count; i++) {
					const progress = i / (count - 1);
					const point = this.conveyorBeltPath.getPointAt(progress);

					this.beltDotsItem.mesh.userData.progresses[i] = progress;
					this._matrix.setPosition(point);
					this.beltDotsItem.mesh.setMatrixAt(i, this._matrix);
				}
				object.visible = false;
			}

			if (!object.name.endsWith('_item')) return;

			if (object.name === 'box_item') boxedItem = object;
			else {
				const instancedItem = new InstancedItem({
					geometry: object.geometry,
					material: object.material,
					count: this.maxRawItemCount
				});
				this.sumMaxRawItemCount += this.maxRawItemCount;
				this.rawItems.push(instancedItem);
			}

			object.visible = false;
		});

		if (boxedItem)
			this.boxedItem = new InstancedItem({
				geometry: boxedItem.geometry,
				material: boxedItem.material,
				count: this.sumMaxRawItemCount
			});

		this.modelsGroup = scene;

		[this.boxedItem, this.beltDotsItem, ...this.rawItems, { mesh: this.modelsGroup }].forEach(
			(item) => {
				if (item?.mesh instanceof Object3D) this._app.scene.add(item.mesh);
			}
		);
	}

	public construct() {
		console.log(this._appResources.items['svelte-conveyor-belt']);

		this._initItems((this._appResources.items['svelte-conveyor-belt'] as GLTF)?.scene);

		/** Remove in prod */
		const _cameraCurvePathLine = new Line(
			new BufferGeometry().setFromPoints(this.conveyorBeltPath.points),
			new LineBasicMaterial({
				color: 0xff0000
			})
		);

		this._manager = new WorldManager(this);
		this._manager.construct();

		const dirLight = new DirectionalLight(0xffffff, 2);
		dirLight.position.set(8, 10, 9);
		dirLight.castShadow = true;
		dirLight.shadow.camera.zoom = 2;

		this._app.scene.add(this._ambientLight, _cameraCurvePathLine, dirLight);

		this.dispatchEvent(new Event(events.CONSTRUCTED));
	}

	private _setObjectFixedPhysicalShape(object: Object3DWithGeometry) {
		if (!object.geometry) return;

		const invertedParentMatrixWorld = object.matrixWorld.clone().invert();
		const worldScale = object.getWorldScale(this._scale);

		const clonedGeometry = mergeVertices(object.geometry);
		const triMeshMap = clonedGeometry.attributes.position.array as Float32Array;
		const triMeshUnit = clonedGeometry.index?.array as Uint32Array;
		const triMeshCollider = this._physic?.rapier.ColliderDesc.trimesh(
			triMeshMap,
			triMeshUnit
		) as ColliderDesc;

		this._matrix
			.copy(object.matrixWorld)
			.premultiply(invertedParentMatrixWorld)
			.decompose(this._position, this._rotation, this._scale);

		const collider = this._physic?.world.createCollider(triMeshCollider);
		collider?.setTranslation({
			x: this._position.x * worldScale.x,
			y: this._position.y * worldScale.y,
			z: this._position.z * worldScale.z
		});

		collider?.setFriction(0.05);
		collider?.setRestitution(0.07);

		return {
			collider,
			colliderDesc: triMeshCollider
		};
	}

	public update() {
		this._manager?.update();
	}

	public destruct() {
		this.rawItems = [];
		this.boxedItem = undefined;
	}
}
