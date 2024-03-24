import type RAPIER from '@dimforge/rapier3d';

import { events } from '$lib/experience/static';

export class Physic extends EventTarget {
	public rapier?: typeof RAPIER;

	public world?: RAPIER.World;
	public groundColliderDesc?: RAPIER.ColliderDesc;
	public rigidBodyDesc?: RAPIER.RigidBodyDesc;
	public rigidBody?: RAPIER.RigidBody;
	public colliderDesc?: RAPIER.ColliderDesc;
	public collider?: RAPIER.Collider;

	public async construct() {
		this.rapier = (await import('@dimforge/rapier3d')).default;

		this.world = new this.rapier.World(new this.rapier.Vector3(0, -9.81, 0));
		this.groundColliderDesc = this.rapier.ColliderDesc.cuboid(10, 0.1, 10);
		this.world.createCollider(this.groundColliderDesc);

		this.rigidBodyDesc = this.rapier.RigidBodyDesc.dynamic().setTranslation(0, 1, 0);
		this.rigidBody = this.world.createRigidBody(this.rigidBodyDesc);

		this.colliderDesc = this.rapier.ColliderDesc.cuboid(0.5, 0.5, 0.5);
		this.collider = this.world.createCollider(this.colliderDesc, this.rigidBody);

		this.dispatchEvent(new Event(events.CONSTRUCTED));
	}

	public update() {
		this.world?.step();
	}

	public destruct() {}
}
