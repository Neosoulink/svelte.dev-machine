import { BufferGeometry, InstancedMesh, Material } from 'three';

import { SvelteMachineExperience } from '..';
import type { PhysicProperties } from '../physic';

export interface ConveyorItemProps {
	geometry: BufferGeometry;
	material: Material | Material[];
	count: number;
}

export interface ConveyorItemActivationProps {
	index: number;
	enabled?: boolean;
}

export class ConveyorItem extends EventTarget {
	private readonly _experience = new SvelteMachineExperience();
	private readonly _physic = this._experience.physic;

	public mesh: InstancedMesh;
	public physicalProps: PhysicProperties[] = [];

	constructor(props: ConveyorItemProps) {
		super();

		const mesh = new InstancedMesh(props.geometry, props.material, props.count);

		this.mesh = mesh;
		this.physicalProps = this._physic?.addToWorld(this.mesh, 1) as PhysicProperties[];
	}
}
