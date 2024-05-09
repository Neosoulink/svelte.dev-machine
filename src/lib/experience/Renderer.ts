import * as THREE from 'three';

import { Experience } from '.';

export interface RendererProps {
	enableMiniRender?: boolean;
}

export class Renderer extends EventTarget {
	protected _experience = new Experience();

	public instance: THREE.WebGLRenderer;
	public enabled = true;

	constructor() {
		super();

		this.instance = new THREE.WebGLRenderer({
			canvas: this._experience.canvas,
			antialias: true,
			alpha: true
		});
		this.instance.outputColorSpace = THREE.SRGBColorSpace;
		this.instance.toneMapping = THREE.CineonToneMapping;
		this.instance.toneMappingExposure = 1.75;
		this.instance.shadowMap.enabled = true;
		this.instance.shadowMap.type = THREE.PCFSoftShadowMap;
		this.instance.setClearColor('#211d20');
		this.instance.setSize(this._experience.sizes.width, this._experience.sizes.height);
		this.instance.setPixelRatio(this._experience.sizes.pixelRatio);

		this.instance.shadowMap.enabled = true;
	}

	resize() {
		this.instance.setSize(this._experience.sizes.width, this._experience.sizes.height);
		this.instance.setPixelRatio(this._experience.sizes.pixelRatio);
	}

	destruct() {
		this.instance.dispose();
	}

	update() {
		if (!(this.enabled && this._experience.camera.instance instanceof THREE.Camera)) return;

		this.instance.setViewport(0, 0, this._experience.sizes.width, this._experience.sizes.height);
		this.instance.render(this._experience.scene, this._experience.camera.instance);

		if (this._experience.debug?.active && this._experience.camera.miniCamera) {
			this.instance.setScissorTest(true);
			this.instance.setViewport(
				this._experience.sizes.width - this._experience.sizes.width / 3,
				this._experience.sizes.height - this._experience.sizes.height / 3,
				this._experience.sizes.width / 3,
				this._experience.sizes.height / 3
			);
			this.instance.setScissor(
				this._experience.sizes.width - this._experience.sizes.width / 3,
				this._experience.sizes.height - this._experience.sizes.height / 3,
				this._experience.sizes.width / 3,
				this._experience.sizes.height / 3
			);
			this.instance.render(this._experience.scene, this._experience.camera.miniCamera);
			this.instance.setScissorTest(false);
		}
	}
}
