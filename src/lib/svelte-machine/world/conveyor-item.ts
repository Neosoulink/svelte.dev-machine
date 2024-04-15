import type { Mesh } from 'three';
import type RAPIER from '@dimforge/rapier3d';

import { SvelteMachineExperience } from '..';

export class ConveyorItem extends EventTarget {
	private _experience = new SvelteMachineExperience();
	private _physic = this._experience.physic;

	public item: Mesh;
	public collider?: RAPIER.Collider;

	constructor(item: Mesh) {
		super();

		this.item = item;
		this.collider = this._physic?.applyPhysic(this.item);
	}

	construct() {}

	destruct() {}

	update() {
		if (!this.collider) return;

		this.item.position.copy(this.collider.translation());
		this.item.quaternion.copy(this.collider.rotation());
	}
}
