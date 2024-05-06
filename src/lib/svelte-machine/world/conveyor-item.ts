import { BufferGeometry, Color, InstancedMesh, Material, Matrix4, Vector3 } from 'three';

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
	private readonly _world = this._experience.world;
	private readonly _initialPosition =
		this._experience.world?.conveyorBeltPath.getPointAt(0.99) ?? new Vector3();

	public readonly maxCount: number;

	public mesh: InstancedMesh;
	public physicalProps: PhysicProperties[] = [];
	public activeInstances: number[] = [];

	constructor(props: ConveyorItemProps) {
		super();

		const mesh = new InstancedMesh(props.geometry, props.material, props.count);
		const matrix = new Matrix4();
		const color = new Color();

		for (let i = 0; i < mesh.count; i++) {
			matrix.setPosition(this._initialPosition.x, 20, this._initialPosition.z);
			mesh.setMatrixAt(i, matrix);
			mesh.setColorAt(i, color.setHex(Math.random() * 0xffffff));
		}

		this.maxCount = props.count;
		this.mesh = mesh;
		this.physicalProps = this._physic?.addToWorld(this.mesh, 1) as PhysicProperties[];
		this.physicalProps.map((item) => {
			item.collider.setFriction(0.01);
			item.collider.setRestitution(0.5);

			item.rigidBody.setEnabled(false);
			item.rigidBody.setLinearDamping(0.3);
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
			this.physicalProps.map((item, i) => {
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

		this.physicalProps = newProps;
	}

	public activation(props: ConveyorItemActivationProps) {
		if (typeof props.index !== 'number' || props.index < 0 || props.index > this.maxCount - 1)
			throw new Error(`Invalid index property passed to the "${this.activation.name}" method`);

		const activeInstanceIndex = this.activeInstances.indexOf(props.index);
		const physicalProps = this.physicalProps[props.index];

		physicalProps.rigidBody.setEnabled(!!props.enabled);

		if (props.enabled === true && activeInstanceIndex === -1) {
			this.activeInstances.push(props.index);
			physicalProps.rigidBody.userData = {
				pointId: 22
			};
		} else if (activeInstanceIndex >= 0) {
			this.activeInstances.splice(activeInstanceIndex, 1);
			physicalProps.rigidBody.userData = undefined;
		}
	}

	public update() {
		this.activeInstances.forEach((id) => {
			const props = this.physicalProps[id];
			const propsUserData = props?.rigidBody?.userData as { pointId: number };
			const currentPathPoint = propsUserData?.pointId;

			if (!props || !this._world || typeof currentPathPoint !== 'number') return;

			const curvePoints = this._world.conveyorBeltPath.points;
			const translation = props.rigidBody.translation();
			const direction = this._world.conveyorBeltPath.points[currentPathPoint]
				.clone()
				.sub(translation)
				.normalize();
			const impulse = direction.multiplyScalar(0.1);

			props.rigidBody.applyImpulse(impulse, true);

			const nextPointDistance = curvePoints[currentPathPoint].distanceTo(translation);

			if (nextPointDistance < 1.5 && currentPathPoint - 1 >= 0)
				propsUserData.pointId = (currentPathPoint - 1) % curvePoints.length;

			if (translation.y > -20) return;

			this.activation({ enabled: false, index: id });
		});
	}
}
