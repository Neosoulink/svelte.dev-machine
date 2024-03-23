import * as THREE from 'three';
import GUI from 'three/examples/jsm/libs/lil-gui.module.min.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import Stats from 'stats.js';

import { Experience } from '..';

export default class Debug {
	private _experience = new Experience();

	public active = false;
	public gui?: GUI;
	public stats?: Stats;
	public cameraControls?: OrbitControls;
	public miniCameraControls?: OrbitControls;
	public cameraHelper?: THREE.CameraHelper;

	constructor(active?: boolean) {
		if (!active) return;

		this.active = active;
		this.gui = new GUI();
		this.stats = new Stats();
		this.stats.showPanel(0);
		this.setCameraOrbitControl();
		this.setMiniCameraOrbitControls();
		this.setCameraHelper();

		if (!window) return;

		window.document.body.appendChild(this.stats.dom);
		if (this._experience.sizes.width <= 450) this.gui.close();
	}

	setCameraOrbitControl() {
		if (this.cameraControls) {
			this.cameraControls.dispose();
			this.cameraControls = undefined;
		}

		if (!this.active) return;

		if (this._experience.camera.instance instanceof THREE.Camera) {
			this.cameraControls = new OrbitControls(
				this._experience.camera.instance,
				this._experience.canvas
			);

			this.cameraControls.enableDamping = true;
		}
	}

	setMiniCameraOrbitControls() {
		if (this.miniCameraControls) {
			this.miniCameraControls.dispose();
			this.miniCameraControls = undefined;
		}

		if (!this.active) return;

		if (this._experience.camera.miniCamera) {
			this.miniCameraControls = new OrbitControls(
				this._experience.camera.miniCamera,
				this._experience.canvas
			);
			this.miniCameraControls.enableDamping = true;
		}
	}

	setCameraHelper() {
		if (this.cameraHelper) {
			this._experience.scene.remove(this.cameraHelper);
			this.cameraHelper = undefined;
		}

		if (!this.active) return;

		if (this._experience.camera.instance) {
			this.cameraHelper = new THREE.CameraHelper(this._experience.camera.instance);
			this._experience.scene.add(this.cameraHelper);
		}
	}

	update() {
		if (this.active) {
			this.cameraControls?.update();
			this.miniCameraControls?.update();
		}
	}

	destruct() {
		this.gui?.destroy();
		this.gui = undefined;

		this.stats?.dom.remove();
		this.stats = undefined;

		if (this.cameraHelper) {
			this._experience.scene.remove(this.cameraHelper);
			this.cameraHelper = undefined;
		}
		if (this.cameraControls) {
			this.cameraControls.dispose();
			this.cameraControls = undefined;
		}
		if (this.miniCameraControls) {
			this.miniCameraControls.dispose();
			this.miniCameraControls = undefined;
		}
	}
}
