import { Matrix4, Vector3 } from 'three';
import type RAPIER from '@dimforge/rapier3d';

import { SvelteMachineExperience } from '..';
import type { World } from '.';
import type { PhysicProperties } from '../physic';

export interface RigidBodyUserData {
	pointId: number;
	packed: PhysicProperties;
}

export class WorldManager extends EventTarget {
	private readonly _experience = new SvelteMachineExperience();
	private readonly _vecZero = new Vector3();
	private readonly _matrix = new Matrix4();
	private readonly _initialItemsPosition =
		this._experience.world?.conveyorBeltPath.getPointAt(0.99).setY(12) ?? this._vecZero;
	private readonly _switchPoint = 17;

	private _rawItemsPoolLeft: PhysicProperties[] = [];
	private _rawItemsPool: PhysicProperties[] = [];
	private _packedItemsPoolLeft: PhysicProperties[] = [];

	constructor(private readonly _world: World) {
		super();
	}

	public construct(): void {
		if (!this._world) throw new Error('Unable to retrieve the World');

		this._rawItemsPoolLeft = [];

		this._packedItemsPoolLeft = [
			...this._packedItemsPoolLeft,
			...(this._world.boxedItem?.physicalProps ?? [])
		];

		this._world.rawItems.forEach((rawItem) => {
			this._rawItemsPoolLeft = [...this._rawItemsPoolLeft, ...rawItem.physicalProps];
		});

		this._rawItemsPoolLeft.forEach((item, id) => {
			item.collider.setFriction(0.01);
			item.collider.setRestitution(0.5);

			item.rigidBody.setEnabled(false);
			item.rigidBody.setLinearDamping(0.5);

			if (!this._packedItemsPoolLeft[id]) return;

			this._packedItemsPoolLeft[id].collider.setFriction(0.01);
			this._packedItemsPoolLeft[id].collider.setRestitution(0.5);

			this._packedItemsPoolLeft[id].rigidBody.setEnabled(false);
			this._packedItemsPoolLeft[id].rigidBody.setLinearDamping(0.3);
		});

		setInterval(() => {
			this._activateRandomRawItem();
		}, 4000);
	}

	private _activateRandomRawItem() {
		const nextItemId = Math.floor(Math.random() * this._rawItemsPoolLeft.length);
		const rawItem = this._rawItemsPoolLeft[nextItemId];

		if (!rawItem) return;

		rawItem.rigidBody.userData = {
			pointId: 22
		};
		rawItem.rigidBody.setEnabled(true);
		rawItem.rigidBody.setTranslation(this._initialItemsPosition, false);

		this._rawItemsPool.push(rawItem);
		this._rawItemsPoolLeft.splice(nextItemId, 1);
	}

	private _deactivateRawItem(rawItem: PhysicProperties, rawItemPoolId: number) {
		if (!rawItem?.rigidBody || typeof rawItemPoolId !== 'number') return;

		const propsUserData = rawItem.rigidBody.userData as RigidBodyUserData;

		this._resetPhysicalProps(rawItem);
		this._resetPhysicalProps(propsUserData?.packed);

		if (propsUserData.packed) this._packedItemsPoolLeft.push(propsUserData.packed);
		rawItem.rigidBody.userData = undefined;

		this._rawItemsPoolLeft.push(rawItem);
		this._rawItemsPool.splice(rawItemPoolId, 1);
	}

	private _resetPhysicalProps(props?: PhysicProperties) {
		if (!props) return;

		props.rigidBody.setTranslation(this._vecZero, false);
		props.rigidBody.setRotation({ ...this._vecZero, w: 0 }, false);
		props.rigidBody.setAngvel(this._vecZero, false);
		props.rigidBody.setLinvel(this._vecZero, false);
		props.rigidBody.setEnabled(false);
	}

	private _copyPhysicalProps(
		oldProps: PhysicProperties,
		newProps: PhysicProperties,
		enable?: boolean,
		offset?: RAPIER.Vector3
	) {
		const translate = newProps.rigidBody.translation();
		oldProps.rigidBody.setTranslation(
			{
				x: translate.x + (offset?.x ?? 0),
				y: translate.y + (offset?.y ?? 0),
				z: translate.z + (offset?.z ?? 0)
			},
			true
		);
		oldProps.rigidBody.setAngvel(newProps.rigidBody.angvel(), true);
		oldProps.rigidBody.setLinvel(newProps.rigidBody.linvel(), true);
		oldProps.rigidBody.setEnabled(!!enable);

		oldProps.collider.setEnabled(!!enable);
	}

	private _applyImpulseFromCurvePoint(
		item: PhysicProperties,
		currentCurvePoint: number,
		multiplayer = 0.05
	) {
		const translation = item.rigidBody.translation();
		const direction = this._world.conveyorBeltPath.points[currentCurvePoint]
			.clone()
			.sub(translation)
			.normalize();
		const impulse = direction.multiplyScalar(multiplayer);

		item.rigidBody.applyImpulse(impulse, true);
	}
	private _getCurvePointFromCurvePoint(item: PhysicProperties, currentCurvePoint: number) {
		const curvePoints = this._world.conveyorBeltPath.points;
		const translation = item.rigidBody.translation();
		const nextPointDistance = curvePoints[currentCurvePoint].distanceTo(translation);

		if (nextPointDistance < 2.5 && currentCurvePoint - 1 >= 0)
			return (currentCurvePoint - 1) % curvePoints.length;

		return currentCurvePoint;
	}

	public update(): void {
		if (this._world.beltDotsItem?.mesh.userData.progresses) {
			const beltDotsItemInstanced = this._world.beltDotsItem.mesh;
			const beltDotsItemProgresses: number[] = this._world.beltDotsItem.mesh.userData.progresses;

			for (let i = 0; i < this._world.beltDotsItem?.mesh.count; i++) {
				const position = this._world.conveyorBeltPath.getPointAt(beltDotsItemProgresses[i]);
				this._matrix.setPosition(position);

				// Should rotate the mesh
				// const tangent = this._world.conveyorBeltPath.getTangentAt(beltDotsItemProgresses[i]);
				// const target = position.clone().add(tangent);
				// this._matrix.lookAt(
				// 	position,
				// 	target.setY(target.y + this.rotationOffset),
				// 	tangent.clone().add({ x: 0, y: 1, z: 0 })
				// );
				beltDotsItemInstanced.setMatrixAt(i, this._matrix);

				beltDotsItemProgresses[i] -= 0.0005;
				if (beltDotsItemProgresses[i] < 0) beltDotsItemProgresses[i] = 1;
			}

			beltDotsItemInstanced.instanceMatrix.needsUpdate = true;
			beltDotsItemInstanced.computeBoundingSphere();
		}

		this._rawItemsPool.forEach((rawItem, rawItemId) => {
			const propsUserData = rawItem?.rigidBody?.userData as RigidBodyUserData;
			const currentPathPoint = propsUserData?.pointId;
			const dynamicItem = propsUserData?.packed ?? rawItem;

			if (!rawItem || !this._world || typeof currentPathPoint !== 'number') return;

			this._applyImpulseFromCurvePoint(dynamicItem, currentPathPoint);
			propsUserData.pointId = this._getCurvePointFromCurvePoint(dynamicItem, currentPathPoint);

			if (
				propsUserData.pointId === this._switchPoint &&
				!propsUserData.packed &&
				this._packedItemsPoolLeft.length
			) {
				propsUserData.packed = this._packedItemsPoolLeft[0];
				this._packedItemsPoolLeft.splice(0, 1);

				this._copyPhysicalProps(propsUserData.packed, rawItem, true, { x: 0, y: 1, z: 0 });
				this._resetPhysicalProps(rawItem);
			}

			if (dynamicItem.rigidBody.translation().y < -20)
				return this._deactivateRawItem(rawItem, rawItemId);
		});
	}
}
