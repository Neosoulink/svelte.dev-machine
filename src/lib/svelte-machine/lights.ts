import { events } from '$lib/experience/static';

import { AmbientLight, DirectionalLight, DirectionalLightHelper } from 'three';
import { SvelteMachineExperience } from '.';

export class Lights extends EventTarget {
	private _experience = new SvelteMachineExperience();
	private _app = this._experience.app;
	private _debug = this._app.debug;

	private mainAmbientLight = new AmbientLight(0xffffff, 1);
	private northDirLight = new DirectionalLight(0xffffff, 2);

	public construct() {
		this.northDirLight.position.set(-15, 15, -15);
		this.northDirLight.castShadow = true;

		this._app.scene.add(this.mainAmbientLight, this.northDirLight);

		if (this._debug?.active) {
			const dirLightHelp = new DirectionalLightHelper(this.northDirLight, 10);
			this._app.scene.add(dirLightHelp);
		}

		this.dispatchEvent(new Event(events.CONSTRUCTED));
	}
}
