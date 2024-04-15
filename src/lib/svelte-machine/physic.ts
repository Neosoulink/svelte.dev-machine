import { Box3, type Object3D } from 'three';
import type RAPIER from '@dimforge/rapier3d';

import { events } from '$lib/experience/static';

export class Physic extends EventTarget {
	public rapier?: typeof RAPIER;

	public world?: RAPIER.World;
	public groundRigidBody?: RAPIER.RigidBody;
	public groundCollider?: RAPIER.Collider;

	public async construct() {
		this.rapier = (await import('@dimforge/rapier3d')).default;

		const gravity = new this.rapier.Vector3(0, -9.81, 0);
		this.world = new this.rapier.World(gravity);

		const groundRigidBodyDesc = this.rapier.RigidBodyDesc.fixed().setTranslation(0, -10, 0);
		this.groundRigidBody = this.world?.createRigidBody(groundRigidBodyDesc);

		const groundColliderDesc = this.rapier.ColliderDesc.cuboid(100, 2, 100);
		this.groundCollider = this.world.createCollider(groundColliderDesc, this.groundRigidBody);

		this.dispatchEvent(new Event(events.CONSTRUCTED));
	}

	applyPhysic(item: Object3D) {
		if (!this.rapier || !this.world) return;

		const boundingBox = new Box3().setFromObject(item);
		const width = boundingBox.max.x - boundingBox.min.x;
		const height = boundingBox.max.y - boundingBox.min.y;
		const depth = boundingBox.max.z - boundingBox.min.z;

		const rigidBodyDesc = this.rapier.RigidBodyDesc.dynamic().setTranslation(
			item.position.x,
			item.position.y,
			item.position.z
		);
		const rigidBody = this.world.createRigidBody(rigidBodyDesc);
		const colliderDesc = this.rapier.ColliderDesc.cuboid(width, height, depth);
		const collider = this.world.createCollider(colliderDesc, rigidBody);

		return collider;
	}

	public update() {
		this.world?.step();
	}

	public destruct() {}
}
