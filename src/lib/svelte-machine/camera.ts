import { SvelteMachineExperience } from '.';

export class Camera {
	private _experience = new SvelteMachineExperience();
	private _app = this._experience.app;
	private _camera = this._app.camera;
	private _debug = this._app.debug;

	construct() {
		this._camera.instance.far = 1000;
		this._camera.instance.position.set(-100, 40, -100);

		if (this._debug?.cameraControls?.target) {
			this._debug.cameraControls.target.set(0, 5, -25);
			this._debug.cameraControls.target.set(0, 5, -25);
		}
	}
}
