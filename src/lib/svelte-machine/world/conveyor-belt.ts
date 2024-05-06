import { Matrix4, Mesh, Quaternion, Vector3 } from 'three';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { ColliderDesc } from '@dimforge/rapier3d';

import { SvelteMachineExperience } from '..';
import type { PhysicProperties } from '../physic';

export class ConveyorBelt extends EventTarget {
	private readonly _experience = new SvelteMachineExperience();
	private readonly _physic = this._experience.physic;

	private readonly _matrix4 = new Matrix4();
	private readonly _position = new Vector3();
	private readonly _rotation = new Quaternion();
	private readonly _scale = new Vector3();

	public mesh: Mesh;
	public physicalProps: Partial<PhysicProperties>;

	constructor(mesh: Mesh) {
		super();

		const invertedParentMatrixWorld = mesh.matrixWorld.clone().invert();
		const worldScale = mesh.getWorldScale(this._scale);
		const clonedGeometry = mergeVertices(mesh.geometry);
		const triMeshMap = clonedGeometry.attributes.position.array as Float32Array;
		const triMeshUnit = clonedGeometry.index?.array as Uint32Array;
		const triMeshCollider = this._physic?.rapier.ColliderDesc.trimesh(
			triMeshMap,
			triMeshUnit
		) as ColliderDesc;

		this._matrix4
			.copy(mesh.matrixWorld)
			.premultiply(invertedParentMatrixWorld)
			.decompose(this._position, this._rotation, this._scale);

		const collider = this._physic?.world.createCollider(triMeshCollider);
		collider?.setTranslation({
			x: this._position.x * worldScale.x,
			y: this._position.y * worldScale.y,
			z: this._position.z * worldScale.z
		});

		collider?.setFriction(0.05);
		collider?.setRestitution(0.07);

		this.physicalProps = {
			collider,
			colliderDesc: triMeshCollider
		};
		this.mesh = mesh;
	}
}
