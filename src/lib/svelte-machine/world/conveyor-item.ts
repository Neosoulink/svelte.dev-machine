import { BufferGeometry, Color, InstancedMesh, Material, Matrix4 } from 'three';

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

	public readonly maxCount: number;

	public mesh: InstancedMesh;
	public physicalProperties: PhysicProperties[] = [];
	public activeInstances: number[] = [];

	constructor(props: ConveyorItemProps) {
		super();

		const mesh = new InstancedMesh(props.geometry, props.material, props.count);
		const matrix = new Matrix4();
		const color = new Color();

		for (let i = 0; i < mesh.count; i++) {
			matrix.setPosition(5, 30, -55);
			mesh.setMatrixAt(i, matrix);
			mesh.setColorAt(i, color.setHex(Math.random() * 0xffffff));
		}

		this.maxCount = props.count;
		this.mesh = mesh;
		this.physicalProperties = this._physic?.addToWorld(this.mesh, 1) as PhysicProperties[];
		this.physicalProperties.map((item) => {
			item.rigidBody.setEnabled(false);
			item.rigidBody.setLinearDamping(0.5);
		});
	}

	public increaseCount(props?: Partial<ConveyorItemProps> & { keepCompose?: boolean }) {
		if (!props || !this._physic) return;

		let geometry = this.mesh.geometry;
		let material = this.mesh.material;
		let count = this.mesh.count;

		if (props.geometry) {
			geometry = props.geometry;
			this.mesh.geometry.dispose();
		}

		if (props.material) {
			material = props.material;

			if (this.mesh.material instanceof Material) this.mesh.material.dispose();
			else this.mesh.material.map((item) => item.dispose());
		}

		if (props.count) count = props.count;

		const newMesh = new InstancedMesh(geometry, material, count);
		const newProps = this._physic.addToWorld(newMesh, 1) as PhysicProperties[];
		const initialPosition = {
			x: (Math.random() - 0.5) * 20,
			y: 20,
			z: (Math.random() - 0.5) * 130
		};
		const initialRotation = { x: 0, y: 0, z: 0, w: 0 };

		newProps[count - 1].rigidBody.setTranslation(initialPosition, false);
		newProps[count - 1].rigidBody.setRotation(initialRotation, false);
		newProps[count - 1].rigidBody.setLinearDamping(0.5);

		if (props.keepCompose)
			this.physicalProperties.map((item, i) => {
				if (!newProps?.[i]?.rigidBody) return;

				newProps[i].rigidBody.setTranslation(item.rigidBody.translation(), false);
				newProps[i].rigidBody.setRotation(item.rigidBody.rotation(), false);
				newProps[i].rigidBody.setAngvel(item.rigidBody.angvel(), false);
				newProps[i].rigidBody.setLinvel(item.rigidBody.linvel(), false);
				newProps[i].rigidBody.setLinearDamping(item.rigidBody.linearDamping());

				newProps[i].collider.setTranslation(item.collider.translation());
				newProps[i].collider.setRotation(item.collider.rotation());
				newProps[i].collider.setFriction(item.collider.friction());
				newProps[i].collider.setRestitution(item.collider.restitution());
			});

		this._physic.removeFromWorld(this.mesh);
		this.mesh.dispose();

		if (this.mesh.parent) this.mesh.parent.add(newMesh);
		setTimeout(() => {
			this.mesh.removeFromParent();
			this.mesh = newMesh;
		}, 16);

		this.physicalProperties = newProps;
	}

	public activation(props: ConveyorItemActivationProps) {
		if (typeof props.index !== 'number' || props.index < 0 || props.index > this.maxCount - 1)
			throw new Error(`Invalid index property passed to the "${this.activation.name}" method`);

		this.physicalProperties[props.index].rigidBody.setEnabled(!!props.enabled);

		if (props.enabled === true) this.activeInstances.push(props.index);
		else {
			const activeInstanceIndex = this.activeInstances.indexOf(props.index);
			if (activeInstanceIndex >= 0) this.activeInstances.splice(activeInstanceIndex, 1);
		}
	}


}
