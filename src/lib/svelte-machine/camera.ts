import { SvelteMachineExperience } from '.';

export class Camera {
	private _experience = new SvelteMachineExperience();
	private _app = this._experience.app;
	private _camera = this._app.camera;
	private _debug = this._app.debug;

	construct() {
		this._camera.instance.near = 0.1;
		this._camera.instance.far = 300;
		this._camera.instance.position.set(-50, 48, -43);
		this._camera.target.set(7.6, -1.1, -12);

		if (this._debug?.cameraControls?.target) this._debug.cameraControls.target.set(7.6, -1.1, -12);
	}
}
