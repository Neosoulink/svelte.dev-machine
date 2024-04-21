import type { Mesh } from 'three';
import type RAPIER from '@dimforge/rapier3d';

import { SvelteMachineExperience } from '..';

export class ConveyorItem extends EventTarget {
	private _experience = new SvelteMachineExperience();
	private _physic = this._experience.physic;

	public item: Mesh;
	public collider?: RAPIER.Collider;
	public rigidBody?: RAPIER.RigidBody;

	constructor(item: Mesh) {
		super();

		this.item = item;
		const itemPhysic = this._physic?.applyPhysic(this.item);

		this.collider = itemPhysic?.collider;
		this.rigidBody = itemPhysic?.rigidBody;
	}

	construct() {}

	destruct() {}

	update() {
		if (!this.collider) return;

		this.item.position.copy(this.collider.translation());
		this.item.quaternion.copy(this.collider.rotation());
	}
}
