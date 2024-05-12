import { PerspectiveCamera, Camera as ThreeCamera, Vector3 } from 'three';

import { Experience } from '.';

import { events } from './static';

export class Camera extends EventTarget {
	private _experience = new Experience();
	private _sizes = this._experience.sizes;

	public readonly instance = new PerspectiveCamera(
		35,
		this._sizes.width / this._sizes.height,
		0.1,
		500
	);
	public readonly initialFov = 35;
	public readonly target = new Vector3();

	public miniCamera?: PerspectiveCamera;

	constructor(miniCamera?: boolean) {
		super();

		this._setCamera();
		miniCamera && this._setMiniCamera();
		this.dispatchEvent(new Event(events.CONSTRUCTED));
	}

	private _setCamera() {
		this.instance.position.z = 8;

		this._experience.scene.add(this.instance);

		this._experience.debug?.setCameraOrbitControl();
		this._experience.debug?.setCameraHelper();

		this.instance && this._experience.scene.add(this.instance);
	}

	private _setMiniCamera() {
		this.removeMiniCamera();
		this.miniCamera = new PerspectiveCamera(75, this._sizes.width / this._sizes.height, 0.1, 500);
		this.miniCamera.position.z = 8;

		this._experience.debug?.setMiniCameraOrbitControls();

		this._experience.scene.add(this.miniCamera);
	}

	public resize() {
		if (!(this.instance instanceof ThreeCamera)) return;

		if (this.instance instanceof PerspectiveCamera)
			this.instance.aspect = this._sizes.width / this._sizes.height;

		this.instance.updateProjectionMatrix();
	}

	public removeCamera() {
		if (!(this.instance instanceof Camera)) return;
		this.instance.clearViewOffset();
		this.instance.clear();
		this.instance.userData = {};
		this._experience.scene.remove(this.instance);
	}

	public removeMiniCamera() {
		if (!(this.miniCamera instanceof Camera)) return;
		this.miniCamera.clearViewOffset();
		this.miniCamera.clear();
		this.miniCamera.userData = {};
		this._experience.scene.remove(this.miniCamera);
		this.miniCamera = undefined;
	}

	/** Correct the aspect ration of the camera. */
	public correctAspect() {
		if (!(this.instance instanceof PerspectiveCamera)) return;

		this.instance.fov = this.initialFov;
		this.instance.far = 500;
		this.resize();
	}

	public update() {
		this.instance?.updateProjectionMatrix();
		this.miniCamera?.updateProjectionMatrix();

		if (this._experience.debug?.cameraControls?.target)
			this.target.copy(this._experience.debug?.cameraControls?.target);

		this.instance.lookAt(this.target);
	}

	public destruct() {
		this.removeCamera();
		this.removeMiniCamera();
		this.dispatchEvent(new Event(events.DESTRUCTED));
	}
}
