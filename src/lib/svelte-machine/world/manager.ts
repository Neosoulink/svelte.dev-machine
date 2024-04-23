import { Matrix4, Quaternion, Vector3 } from 'three';

import { SvelteMachineExperience } from '..';
import type { World } from '.';

export class WorldManager extends EventTarget {
	private readonly _experience = new SvelteMachineExperience();
	private readonly _physic = this._experience.physic;
	private readonly _app = this._experience.app;
	private readonly _appCamera = this._app.camera;
	private readonly _appDebug = this._experience.app.debug;

	constructor(private readonly _world: World) {
		super();
	}

	public construct(): void {
		this._appCamera.instance.far = 500;
		this._appCamera.instance.position.set(-100, 40, -100);

		if (this._appDebug?.cameraControls?.target) {
			this._appDebug.cameraControls.target.set(0, 5, -25);
			this._appDebug.cameraControls.target.set(0, 5, -25);
		}

		if (!this._world.cubeItem) return;
	}

	public setMatrix(matrix: Matrix4) {
		const position = new Vector3(0, 0, 0);
		const quaternion = new Quaternion().random();
		const scale = new Vector3(1, 1, 1);

		matrix.compose(position, quaternion, scale);

		return matrix;
	}

	public update(): void {
		this._world.conveyorItems.map((item) => item.update());
		this._world.cubeItem?.update();
	}

	public destruct(): void {}
}
