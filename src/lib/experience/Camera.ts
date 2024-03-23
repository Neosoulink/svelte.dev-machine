import { PerspectiveCamera, Camera as ThreeCamera } from 'three';

import { Experience } from '.';

import { events } from './static';

export default class Camera extends EventTarget {
	private _experience = new Experience();
	private _sizes = this._experience.sizes;

	public readonly instance = new PerspectiveCamera(
		35,
		this._sizes.width / this._sizes.height,
		0.1,
		500
	);
	public miniCamera?: PerspectiveCamera;
	public updateProjectionMatrix = true;

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

	public update() {
		if (!this.updateProjectionMatrix) return;

		this.instance?.updateProjectionMatrix();
		this.miniCamera?.updateProjectionMatrix();
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

	public destruct() {
		this.removeCamera();
		this.removeMiniCamera();
		this.dispatchEvent(new Event(events.DESTRUCTED));
	}
}
