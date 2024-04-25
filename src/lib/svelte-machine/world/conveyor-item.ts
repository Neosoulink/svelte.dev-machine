import { Color, Matrix4, type InstancedMesh } from 'three';

import { SvelteMachineExperience } from '..';
import type { PhysicProperties } from '../physic';

export class ConveyorItem extends EventTarget {
	private _experience = new SvelteMachineExperience();
	private _physic = this._experience.physic;

	public object: InstancedMesh;
	public physicalProperties?: PhysicProperties[];

	constructor(item: InstancedMesh) {
		super();

		const matrix = new Matrix4();
		const color = new Color();

		for (let i = 0; i < item.count; i++) {
			matrix.setPosition(Math.random() * 10, 30 + i * 0.1, Math.random() * 10);

			item.setMatrixAt(i, matrix);
			item.setColorAt(i, color.setHex(Math.random() * 0xffffff));
		}

		this.object = item;
		this.physicalProperties = this._physic?.addToWorld(this.object, 1) as PhysicProperties[];

		this.physicalProperties.map((item) => {
			item.rigidBody.setLinearDamping(0.5);
		});
	}
}
