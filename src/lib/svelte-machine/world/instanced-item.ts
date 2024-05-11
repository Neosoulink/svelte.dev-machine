import { BufferGeometry, InstancedMesh, Material, Matrix4, Vector3 } from 'three';

import { SvelteMachineExperience } from '..';
import type { PhysicProperties } from '../physic';

export interface InstancedItemProps {
	geometry: BufferGeometry;
	material: Material | Material[];
	count: number;
	withPhysics?: boolean;
}

export class InstancedItem extends EventTarget {
	private readonly _experience = new SvelteMachineExperience();
	private readonly _physic = this._experience.physic;
	private readonly _matrix = new Matrix4();

	public mesh: InstancedMesh;
	public physicalProps: PhysicProperties[] = [];

	constructor(props: InstancedItemProps) {
		super();

		this.mesh = new InstancedMesh(props.geometry, props.material, props.count);

		if (props.withPhysics || props.withPhysics === undefined)
			this.physicalProps = this._physic?.addToWorld(this.mesh, 1) as PhysicProperties[];

		this.physicalProps.forEach((props, i) => {
			this.mesh.getMatrixAt(i, this._matrix);
			props.rigidBody.userData = { instance: this._matrix, scale: new Vector3(0, 0, 0) };
		});
	}
}
