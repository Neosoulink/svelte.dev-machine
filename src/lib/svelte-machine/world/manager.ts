import { SvelteMachineExperience } from '..';
import type { World } from '.';

export class WorldManager extends EventTarget {
	protected readonly _experience = new SvelteMachineExperience();
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
	}

	public update(): void {}

	public destruct(): void {}
}
