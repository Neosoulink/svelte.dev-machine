import type { InstancedMesh } from 'three';
import type RAPIER from '@dimforge/rapier3d';

import { SvelteMachineExperience } from '..';

export class ConveyorItem extends EventTarget {
	private _experience = new SvelteMachineExperience();
	private _physic = this._experience.physic;

	public item: InstancedMesh;
	public collider?: RAPIER.Collider;
	public rigidBody?: RAPIER.RigidBody;

	constructor(item: InstancedMesh) {
		super();

		this.item = item;
		const itemPhysic = this._physic?.applyPhysic(this.item);

		this.collider = itemPhysic?.collider;
		this.rigidBody = itemPhysic?.rigidBody;
		this.rigidBody?.setLinearDamping(0.5);
		this.rigidBody?.setAngularDamping(0.5);
	}

	construct() {}

	destruct() {}

	update() {
		if (!this.collider) return;

		this.item.position.copy(this.collider.translation());
		this.item.quaternion.copy(this.collider.rotation());
	}
}
