import {
	Box3,
	BufferGeometry,
	IcosahedronGeometry,
	InstancedMesh,
	Matrix4,
	Mesh,
	Object3D,
	Quaternion,
	SphereGeometry,
	Vector3
} from 'three';
import type RAPIER from '@dimforge/rapier3d';

import { events } from '$lib/experience/static';

export interface Object3DWithGeometry extends Object3D {
	geometry?: BufferGeometry;
}

/**
 * @description Physic helper based on `Rapier`
 *
 * @docs https://rapier.rs/docs/api/javascript/JavaScript3D/
 */
export class Physic extends EventTarget {
	private _vector = new Vector3();
	private _quaternion = new Quaternion();
	private _matrix = new Matrix4();
	private _scale = new Vector3(1, 1, 1);

	/**
	 * @description `Rapier3D.js`.
	 *
	 * @type {typeof RAPIER}
	 */
	public rapier!: typeof RAPIER;
	/**
	 * @description {@link RAPIER.World} instance.
	 *
	 * @type {RAPIER.World}
	 */
	public world!: RAPIER.World;
	/**
	 * @description List of {@link Object3D} with physic applied.
	 *
	 * @type {typeof RAPIER}
	 */
	public dynamicObjects: Object3DWithGeometry[] = [];
	/**
	 * @description {@link WeakMap} of dynamic objects {@link RAPIER.RigidBody}
	 *
	 * @type {WeakMap<WeakKey, RAPIER.RigidBody | RAPIER.RigidBody[]>}
	 */
	public dynamicObjectMap = new WeakMap<WeakKey, RAPIER.RigidBody | RAPIER.RigidBody[]>();

	/**
	 * @description Add the specified `object` to the physic `dynamicObjects` map.
	 *
	 * @param object `Object3D` based.
	 * @param mass Physic object mass.
	 * @param restitution Physic Object restitution.
	 */
	private _addObject(object: Object3DWithGeometry, mass = 0, restitution = 0) {
		const { colliderDesc } = this.getShape(object);
		if (!colliderDesc) return;

		colliderDesc.setMass(mass);
		colliderDesc.setRestitution(restitution);

		const body =
			object instanceof InstancedMesh
				? this.createInstancedBody(object, colliderDesc, mass)
				: this.createBody(colliderDesc, object.position, object.quaternion, mass);

		if (mass > 0) {
			this.dynamicObjects.push(object);
			this.dynamicObjectMap.set(object, body);
		}

		return body;
	}

	public async construct() {
		this.rapier = (await import('@dimforge/rapier3d')).default;

		const gravity = new this.rapier.Vector3(0.0, -50, 0.0);
		this.world = new this.rapier.World(gravity);

		this.dispatchEvent(new Event(events.CONSTRUCTED));
	}

	/**
	 * Apply physic the specified object.
	 *
	 * @deprecated
	 */
	public applyPhysic(item: Object3DWithGeometry) {
		if (!this.rapier || !this.world) return;

		const rigidBodyDesc = this.rapier.RigidBodyDesc.dynamic().setTranslation(
			item.position.x,
			item.position.y,
			item.position.z
		);
		const rigidBody = this.world.createRigidBody(rigidBodyDesc);
		const colliderDescData = this.getShape(item);
		const collider = this.world.createCollider(colliderDescData.colliderDesc, rigidBody);

		return { ...colliderDescData, collider, rigidBody, rigidBodyDesc };
	}

	/**
	 * Add objects children from the specified {@link Object3D} to the physic world using the userData.
	 *
	 * @param {Object3D} object Object3D based.
	 *
	 * @example ```ts
	 *  const floor = new Mesh(
	 *    new BoxGeometry(500, 5, 500),
	 *    new MeshBasicMaterial({})
	 *  );
	 *  floor.position.setY(-10);
	 *  floor.userData.physics = { mass: 0, restitution: restitution };
	 *
	 *  rapierPhysicsHelper?.addToWorld(floor, 0);
	 * ```
	 */
	public addSceneToWorld(object: Object3DWithGeometry) {
		object.traverse((child) => {
			if (!(child instanceof Object3D) || !child.userData.physics) return;

			const physics = child.userData.physics;

			if (!physics) return;

			this._addObject(child, physics.mass, physics.restitution);
		});
	}

	/**
	 * @description Apply physic to the specified object. Add the object to the physic `world`.
	 *
	 * @param {Object3D} object Object3D based.
	 * @param {number} mass Physic mass.
	 * @param {number} restitution Physic restitution.
	 */
	public addToWorld(object: Object3D, mass = 0, restitution = 0) {
		if (object instanceof Object3D)
			return this._addObject(object, Number(mass), Number(restitution));
	}

	/**
	 * @description Retrieve the shape of the passed `object`.
	 *
	 * @param {Object3D} object `Object3D` based.
	 */
	public getShape(object: Object3DWithGeometry) {
		const positions = object?.geometry?.attributes?.position?.array;
		let width = 0;
		let height = 0;
		let depth = 0;
		let halfWidth = 0;
		let halfHeight = 0;
		let halfDepth = 0;
		let radius = 0;
		let colliderDesc: RAPIER.ColliderDesc;

		if (
			object instanceof Mesh &&
			(object.geometry instanceof SphereGeometry || object.geometry instanceof IcosahedronGeometry)
		) {
			const parameters = object.geometry.parameters;

			radius = parameters.radius ?? 1;
			colliderDesc = this.rapier.ColliderDesc.ball(radius);
		} else if (positions) {
			let minX = 0,
				minY = 0,
				minZ = 0,
				maxX = 0,
				maxY = 0,
				maxZ = 0;

			for (let i = 0; i < positions.length; i += 3) {
				const _vector = new this.rapier.Vector3(positions[i], positions[i + 1], positions[i + 2]);

				minX = Math.min(minX, _vector.x);
				minY = Math.min(minY, _vector.y);
				minZ = Math.min(minZ, _vector.z);
				maxX = Math.max(maxX, _vector.x);
				maxY = Math.max(maxY, _vector.y);
				maxZ = Math.max(maxZ, _vector.z);
			}

			width = maxX - minX;
			height = maxY - minY;
			depth = maxZ - minZ;

			halfWidth = width / 2;
			halfHeight = height / 2;
			halfDepth = depth / 2;

			colliderDesc = this.rapier.ColliderDesc.cuboid(halfWidth, halfHeight, halfDepth);
		} else {
			const boundingBox = new Box3().setFromObject(object);

			width = boundingBox.max.x - boundingBox.min.x;
			height = boundingBox.max.y - boundingBox.min.y;
			depth = boundingBox.max.z - boundingBox.min.z;

			halfWidth = width / 2;
			halfHeight = height / 2;
			halfDepth = depth / 2;

			colliderDesc = this.rapier.ColliderDesc.cuboid(halfWidth, halfHeight, halfDepth);
		}

		return {
			width,
			height,
			depth,
			halfWidth,
			halfHeight,
			halfDepth,
			colliderDesc
		};
	}

	/**
	 * @description Create {@link RAPIER.RigidBody} for each instance of the {@link InstancedMesh} specified mesh
	 *
	 * @param {InstancedMesh} mesh {@link InstancedMesh}
	 * @param {RAPIER.ColliderDesc} colliderDesc {@link RAPIER.ColliderDesc}
	 * @param {number | undefined} mass
	 */
	public createInstancedBody(mesh: InstancedMesh, colliderDesc: RAPIER.ColliderDesc, mass: number) {
		const array = mesh.instanceMatrix.array;
		const bodies = [];

		for (let i = 0; i < mesh.count; i++) {
			const position = this._vector.fromArray(array, i * 16 + 12);
			bodies.push(this.createBody(colliderDesc, position, null, mass));
		}

		return bodies;
	}

	/**
	 * @description Create {@link RAPIER.RigidBody} for the specified {@link RAPIER.Collider}
	 *
	 * @param {RAPIER.ColliderDesc} colliderDesc {@link RAPIER.ColliderDesc}
	 * @param {RAPIER.Vector3} position {@link RAPIER.Vector3}
	 * @param {RAPIER.Rotation} rotation {@link RAPIER.Rotation}
	 * @param {number | undefined} mass
	 */
	public createBody(
		colliderDesc: RAPIER.ColliderDesc,
		position: RAPIER.Vector3,
		rotation?: RAPIER.Rotation | null,
		mass = 0
	) {
		const desc = mass > 0 ? this.rapier.RigidBodyDesc.dynamic() : this.rapier.RigidBodyDesc.fixed();
		desc.setTranslation(position.x, position.y, position.z);
		if (rotation) desc.setRotation(rotation);

		const body = this.world.createRigidBody(desc);
		this.world.createCollider(colliderDesc, body);

		return body;
	}

	/**
	 *
	 * @param object
	 * @param index
	 * @returns
	 */
	getBodyFromObject(object: Object3DWithGeometry, index = 0) {
		const _body = this.dynamicObjectMap.get(object);
		let body: RAPIER.RigidBody;

		if (!_body) return undefined;
		if (object instanceof InstancedMesh && typeof _body === 'object')
			body = (_body as RAPIER.RigidBody[])[index];
		else body = _body as RAPIER.RigidBody;

		return body;
	}

	/**
	 *
	 * @param object
	 * @param position
	 * @param index
	 * @returns
	 */
	setObjectPosition(object: Object3DWithGeometry, position: RAPIER.Vector3, index = 0) {
		const body = this.getBodyFromObject(object, index);
		if (!body) return;

		const _vectorZero = new this.rapier.Vector3(0, 0, 0);
		body.setAngvel(_vectorZero, true);
		body.setLinvel(_vectorZero, true);
		body.setTranslation(position, true);

		return body;
	}

	/**
	 *
	 * @param object
	 * @param velocity
	 * @param index
	 */
	setObjectVelocity(object: Object3DWithGeometry, velocity: RAPIER.Vector3, index = 0) {
		const body = this.getBodyFromObject(object, index);
		if (!body) return;

		body.setLinvel(velocity, true);

		return body;
	}

	/**
	 * @description Update the dynamic objects physics.
	 */
	public update() {
		this.world.step();

		for (let i = 0, l = this.dynamicObjects.length; i < l; i++) {
			const mesh = this.dynamicObjects[i];

			if (mesh instanceof InstancedMesh) {
				const array = mesh.instanceMatrix.array;
				const bodies = this.dynamicObjectMap.get(mesh) as RAPIER.RigidBody[];

				for (let j = 0; j < bodies.length; j++) {
					const body = bodies[j];

					const position = new Vector3().copy(body.translation());
					this._quaternion.copy(body.rotation());

					this._matrix.compose(position, this._quaternion, this._scale).toArray(array, j * 16);
				}

				mesh.instanceMatrix.needsUpdate = true;
				mesh.computeBoundingSphere();
			} else {
				const body = this.dynamicObjectMap.get(mesh) as RAPIER.RigidBody;

				mesh.position.copy(body.translation());
				mesh.quaternion.copy(body.rotation());
			}
		}
	}

	public destruct() {
		/* TODO: document why this method 'destruct' is empty */
	}
}
