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
import { SvelteMachineExperience } from '.';

export interface Object3DWithGeometry extends Object3D {
	geometry?: BufferGeometry;
}

/**
 * @description Physic helper based on `Rapier`
 *
 * @docs https://rapier.rs/docs/api/javascript/JavaScript3D/
 */
export class Physic extends EventTarget {
	private _experience = new SvelteMachineExperience();
	private _app = this._experience.app;

	private _vector = new Vector3();
	private _vectorZero = new Vector3();
	private _quaternion = new Quaternion();
	private _matrix = new Matrix4();
	private _scale = new Vector3(1, 1, 1);

	public rapier!: typeof RAPIER;
	public world!: RAPIER.World;
	public objects: Object3DWithGeometry[] = [];
	public objectMap = new WeakMap<WeakKey, RAPIER.RigidBody | RAPIER.RigidBody[]>();

	public async construct() {
		this.rapier = (await import('@dimforge/rapier3d')).default;

		const gravity = new this.rapier.Vector3(0.0, -50, 0.0);
		this.world = new this.rapier.World(gravity);

		this.dispatchEvent(new Event(events.CONSTRUCTED));
	}

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

	public addScene(scene: Object3DWithGeometry) {
		scene.traverse((child) => {
			if (!(child instanceof Object3D) || !child.userData.physics) return;

			const physics = child.userData.physics;

			if (!physics) return;

			this.addObject(child, physics.mass, physics.restitution);
		});
	}

	/**
	 * @description Apply physic to the specify object. Add the object to the physic `world`.
	 *
	 * @param {Object3D} object Object3D based.
	 * @param {number} mass Physic mass.
	 * @param {number} restitution Physic restitution.
	 */
	public addToWorld(object: Object3D, mass = 0, restitution = 0) {
		if (object instanceof Object3D) this.addObject(object, Number(mass), Number(restitution));
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

	public addObject(mesh: Object3DWithGeometry, mass = 0, restitution = 0) {
		const { colliderDesc } = this.getShape(mesh);
		if (!colliderDesc) return;

		colliderDesc.setMass(mass);
		colliderDesc.setRestitution(restitution);

		const body =
			mesh instanceof InstancedMesh
				? this.createInstancedBody(mesh, colliderDesc, mass)
				: this.createBody(colliderDesc, mesh.position, mesh.quaternion, mass);

		if (mass <= 0) return;

		this.objects.push(mesh);
		this.objectMap.set(mesh, body);
	}

	public createInstancedBody(mesh: InstancedMesh, colliderDesc: RAPIER.ColliderDesc, mass: number) {
		const array = mesh.instanceMatrix.array;
		const bodies = [];

		for (let i = 0; i < mesh.count; i++) {
			const position = this._vector.fromArray(array, i * 16 + 12);
			bodies.push(this.createBody(colliderDesc, position, null, mass));
		}

		return bodies;
	}

	createBody(
		colliderDesc: RAPIER.ColliderDesc,
		position: RAPIER.Vector3,
		quaternion?: RAPIER.Rotation | null,
		mass = 0
	) {
		const desc = mass > 0 ? this.rapier.RigidBodyDesc.dynamic() : this.rapier.RigidBodyDesc.fixed();
		desc.setTranslation(position.x, position.y, position.z);
		if (quaternion) desc.setRotation(quaternion);

		const body = this.world.createRigidBody(desc);
		this.world.createCollider(colliderDesc, body);

		return body;
	}

	getBodyFromMesh(mesh: Mesh | InstancedMesh, index = 0) {
		const _body = this.objectMap.get(mesh);
		let body: RAPIER.RigidBody;

		if (!_body) return undefined;
		if (mesh instanceof InstancedMesh && typeof _body === 'object')
			body = (_body as RAPIER.RigidBody[])[index];
		else body = _body as RAPIER.RigidBody;

		return body;
	}

	setMeshPosition(mesh: Mesh | InstancedMesh, position: RAPIER.Vector3, index = 0) {
		const body = this.getBodyFromMesh(mesh, index);
		if (!body) return;

		const _vectorZero = new this.rapier.Vector3(
			this._vectorZero.x,
			this._vectorZero.y,
			this._vectorZero.z
		);
		body.setAngvel(_vectorZero, true);
		body.setLinvel(_vectorZero, true);
		body.setTranslation(position, true);
	}

	setMeshVelocity(mesh: Mesh | InstancedMesh, velocity: RAPIER.Vector3, index = 0) {
		const body = this.getBodyFromMesh(mesh, index);
		if (!body) return;

		body.setLinvel(velocity, true);
	}

	public update() {
		this.world.step();

		for (let i = 0, l = this.objects.length; i < l; i++) {
			const mesh = this.objects[i];

			if (mesh instanceof InstancedMesh) {
				const array = mesh.instanceMatrix.array;
				const bodies = this.objectMap.get(mesh) as RAPIER.RigidBody[];

				for (let j = 0; j < bodies.length; j++) {
					const body = bodies[j];

					const position = new Vector3().copy(body.translation());
					this._quaternion.copy(body.rotation());

					this._matrix.compose(position, this._quaternion, this._scale).toArray(array, j * 16);
				}

				mesh.instanceMatrix.needsUpdate = true;
				mesh.computeBoundingSphere();
			} else {
				const body = this.objectMap.get(mesh) as RAPIER.RigidBody;

				mesh.position.copy(body.translation());
				mesh.quaternion.copy(body.rotation());
			}
		}
	}

	public destruct() {
		/* TODO: document why this method 'destruct' is empty */
	}
}
