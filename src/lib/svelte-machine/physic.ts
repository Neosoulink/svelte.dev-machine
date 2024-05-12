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
import type RAPIER from '@dimforge/rapier3d-compat';

import { events } from '$lib/experience/static';
import { SvelteMachineExperience } from '.';

export interface Object3DWithGeometry extends Object3D {
	geometry?: BufferGeometry;
}

export interface PhysicProperties {
	rigidBodyDesc: RAPIER.RigidBodyDesc;
	rigidBody: RAPIER.RigidBody;
	colliderDesc: RAPIER.ColliderDesc;
	collider: RAPIER.Collider;
}

const RAPIER_PATH = 'https://cdn.skypack.dev/@dimforge/rapier3d-compat@0.12.0';

/**
 * @description Physic helper based on `Rapier`
 *
 * @docs https://rapier.rs/docs/api/javascript/JavaScript3D/
 */
export class Physic extends EventTarget {
	private _experience = new SvelteMachineExperience();
	private _app = this._experience.app;
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
	 * @type {Map<WeakKey, RAPIER.RigidBody | RAPIER.RigidBody[]>}
	 */
	public dynamicObjectMap = new Map<WeakKey, PhysicProperties | PhysicProperties[]>();

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

		const physicProperties =
			object instanceof InstancedMesh
				? this.createInstancedPhysicProperties(object, colliderDesc, mass)
				: this.createPhysicProperties(colliderDesc, object.position, object.quaternion, mass);

		if (mass > 0) {
			this.dynamicObjects.push(object);
			this.dynamicObjectMap.set(object, physicProperties);
		}

		return physicProperties;
	}

	public async construct() {
		this.rapier = await import(RAPIER_PATH);
		await this.rapier.init();

		console.log(this.rapier);

		const gravity = new this.rapier.Vector3(0.0, -9.81, 0.0);
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
	public createInstancedPhysicProperties(
		mesh: InstancedMesh,
		colliderDesc: RAPIER.ColliderDesc,
		mass: number
	) {
		const array = mesh.instanceMatrix.array;
		const bodies = [];

		for (let i = 0; i < mesh.count; i++) {
			const position = this._vector.fromArray(array, i * 16 + 12);
			bodies.push(this.createPhysicProperties(colliderDesc, position, null, mass));
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
	public createPhysicProperties(
		colliderDesc: RAPIER.ColliderDesc,
		position: RAPIER.Vector3,
		rotation?: RAPIER.Rotation | null,
		mass = 0
	) {
		const rigidBodyDesc =
			mass > 0 ? this.rapier.RigidBodyDesc.dynamic() : this.rapier.RigidBodyDesc.fixed();
		rigidBodyDesc.setTranslation(position.x, position.y, position.z);
		if (rotation) rigidBodyDesc.setRotation(rotation);

		const rigidBody = this.world.createRigidBody(rigidBodyDesc);
		const collider = this.world.createCollider(colliderDesc, rigidBody);

		return { rigidBodyDesc, rigidBody, colliderDesc, collider };
	}

	/**
	 *
	 * @param object
	 * @param index
	 * @returns
	 */
	getPhysicPropertyFromObject(object: Object3DWithGeometry, index = 0) {
		const _physicProperties = this.dynamicObjectMap.get(object);
		let body: PhysicProperties;

		if (!_physicProperties) return undefined;
		if (object instanceof InstancedMesh) body = (_physicProperties as PhysicProperties[])[index];
		else body = _physicProperties as PhysicProperties;

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
		const physicProperties = this.getPhysicPropertyFromObject(object, index);
		if (!physicProperties) return;

		const _vectorZero = new this.rapier.Vector3(0, 0, 0);
		physicProperties.rigidBody.setAngvel(_vectorZero, true);
		physicProperties.rigidBody.setLinvel(_vectorZero, true);
		physicProperties.rigidBody.setTranslation(position, true);

		return physicProperties;
	}

	/**
	 *
	 * @param object
	 * @param velocity
	 * @param index
	 */
	setObjectVelocity(object: Object3DWithGeometry, velocity: RAPIER.Vector3, index = 0) {
		const physicProperties = this.getPhysicPropertyFromObject(object, index);
		if (!physicProperties) return;

		physicProperties.rigidBody.setLinvel(velocity, true);

		return physicProperties;
	}

	/**
	 * @description Update the dynamic objects physics.
	 */
	public update() {
		for (let i = 0, l = this.dynamicObjects.length; i < l; i++) {
			const object = this.dynamicObjects[i];

			if (object instanceof InstancedMesh) {
				const array = object.instanceMatrix.array;
				const bodies = this.dynamicObjectMap.get(object) as PhysicProperties[];

				for (let j = 0; j < bodies.length; j++) {
					const physicProperties = bodies[j];

					const position = new Vector3().copy(physicProperties.rigidBody.translation());
					this._quaternion.copy(physicProperties.rigidBody.rotation());
					const scale =
						(physicProperties.rigidBody.userData as { scale?: Vector3 })?.scale ?? this._scale;

					this._matrix.compose(position, this._quaternion, scale);
					this._matrix.toArray(array, j * 16);
				}

				object.instanceMatrix.needsUpdate = true;
				object.computeBoundingSphere();
			} else {
				const physicProperties = this.dynamicObjectMap.get(object) as PhysicProperties;

				object.position.copy(physicProperties.rigidBody.translation());
				object.quaternion.copy(physicProperties.rigidBody.rotation());
			}
		}

		this.world.timestep = this._app.time.delta * 0.003;
		this.world.step();
	}

	/**
	 * @description Remove the specified object to the physic `world`.
	 *
	 * @param {Object3D} object Object3D based.
	 */
	removeFromWorld(object: Object3D) {
		const dynamicObjectsLength = this.dynamicObjects.length;
		for (let i = 0; i < dynamicObjectsLength; i++) {
			const dynamicObject = this.dynamicObjects[i];
			const dynamicObjectProps = this.dynamicObjectMap.get(dynamicObject);

			if (dynamicObject.id === object.id && dynamicObjectProps) {
				if (object instanceof InstancedMesh)
					(dynamicObjectProps as PhysicProperties[]).map((props) => {
						this.world.removeRigidBody(props.rigidBody);
						this.world.removeCollider(props.collider, true);
					});
				else {
					this.world.removeRigidBody((dynamicObjectProps as PhysicProperties).rigidBody);
					this.world.removeCollider((dynamicObjectProps as PhysicProperties).collider, true);
				}

				this.dynamicObjectMap.delete(dynamicObject);
				this.dynamicObjects.splice(i, 1);
				return;
			}
		}
	}

	public destruct() {
		this.dynamicObjects = [];
		this.dynamicObjectMap = new Map();
	}
}
