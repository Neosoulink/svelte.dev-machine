import { events } from '$lib/experience/static';

import { AmbientLight, DirectionalLight, SpotLight, Vector3 } from 'three';
import { SvelteMachineExperience } from '.';

export class Lights extends EventTarget {
	private readonly _experience = new SvelteMachineExperience();
	private readonly _app = this._experience.app;
	private readonly _debug = this._app.debug;
	private readonly _target = new Vector3();
	private readonly _ambientA = new AmbientLight(0xffffff, 0.8);
	private readonly _dirA = new DirectionalLight(0xffffff, 0.65);
	private readonly _dirB = new DirectionalLight(0xffffff, 1);

	private _follow_target = true;

	public readonly machine = new SpotLight(0xff5f39, 80, 30, 1.5, 0.3, 0.3);

	public construct() {
		this._dirA.position.set(-50, -1.5, -14);
		this._dirA.lookAt(this._target);

		this._dirB.position.set(10, 32, -10);
		this._dirB.shadow.mapSize.width = 1024 * 2;
		this._dirB.shadow.mapSize.height = 1024 * 2;
		this._dirB.shadow.camera.near = 1;
		this._dirB.shadow.camera.far = 50;
		this._dirB.shadow.camera.top = 80;
		this._dirB.shadow.camera.bottom = -80;
		this._dirB.shadow.camera.left = -80;
		this._dirB.shadow.camera.right = 80;
		this._dirB.shadow.radius = 24;
		this._dirB.shadow.bias = -0.0075;
		this._dirB.castShadow = true;
		this._dirB.lookAt(this._target);

		this.machine.shadow.mapSize.width = 1024 * 2;
		this.machine.shadow.mapSize.height = 1024 * 2;
		this.machine.shadow.camera.near = 1;
		this.machine.shadow.camera.far = 10;
		this.machine.shadow.bias = -0.0075;
		this.machine.shadow.radius = 24;
		this.machine.castShadow = true;
		this.machine.position.set(-3.8, 7.7, -2.3);
		this.machine.target.position.copy(this.machine.position.clone().setY(0));

		this._app.scene.add(this._ambientA, this._dirA, this._dirB, this.machine, this.machine.target);

		this.dispatchEvent(new Event(events.CONSTRUCTED));
	}

	update() {
		if (!this._follow_target) return;

		this._dirA.lookAt(this._target);
		this._dirB.lookAt(this._target);
	}
}
