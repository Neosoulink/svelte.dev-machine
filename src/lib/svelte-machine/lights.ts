import { events } from '$lib/experience/static';

import {
	AmbientLight,
	DirectionalLight,
	DirectionalLightHelper,
	HemisphereLight,
	SpotLight,
	Vector3
} from 'three';
import { SvelteMachineExperience } from '.';

export class Lights extends EventTarget {
	private readonly _experience = new SvelteMachineExperience();
	private readonly _app = this._experience.app;
	private readonly _debug = this._app.debug;
	private readonly _target = new Vector3();
	private readonly _ambientA = new AmbientLight(0xffffff, 1);
	private readonly _ambientB = new AmbientLight(0x282855, 1);
	private readonly _dirA = new DirectionalLight(0xffffff, 1);
	private readonly _dirB = new DirectionalLight(0xffffff, 0.5);
	private readonly _hemiA = new HemisphereLight(0xffffff, 0x000000, 0.5);
	private readonly _machine = new SpotLight(0xff6969, 300, 30, 1.5, 0.3, 0.3);

	private _follow_target = true;

	public construct() {
		this._dirA.position.set(-15, 1.3, -15);
		this._dirA.castShadow = true;
		this._dirA.lookAt(this._target);

		this._dirB.position.set(15, 10, -15);
		this._dirB.castShadow = true;
		this._dirB.lookAt(this._target);

		this._machine.position.set(-3.8, 7.6, -2.3);
		this._machine.castShadow = true;
		this._machine.target.position.copy(this._machine.position.clone().setY(0));

		this._app.scene.add(
			this._ambientA,
			this._ambientB,
			this._dirA,
			this._dirB,
			this._hemiA,
			this._machine,
			this._machine.target
		);

		if (this._debug?.active && this._debug.gui) {
			const lightGui = this._debug.gui?.addFolder('Lights');

			const targetGui = lightGui?.addFolder('Target').close();
			targetGui
				.add({ follow: this._follow_target }, 'follow')
				.onChange((v) => (this._follow_target = !!v));
			targetGui.add(this._target, 'x').min(-50).max(50).step(0.1);
			targetGui.add(this._target, 'y').min(-50).max(50).step(0.1);
			targetGui.add(this._target, 'z').min(-50).max(50).step(0.1);

			const ambientAGui = lightGui?.addFolder('Ambient A');
			ambientAGui?.add(this._ambientA, 'intensity').min(0).max(10).step(0.1);
			ambientAGui?.addColor(this._ambientA, 'color');

			const ambientBGui = lightGui?.addFolder('Ambient B');
			ambientBGui?.add(this._ambientB, 'intensity').min(0).max(10).step(0.1);
			ambientBGui?.addColor(this._ambientB, 'color');

			const dirAGui = lightGui?.addFolder('Directional A');
			dirAGui?.add(this._dirA, 'intensity').min(0).max(10).step(0.1);
			dirAGui?.addColor(this._dirA, 'color');
			dirAGui?.add(this._dirA.position, 'x').min(-50).max(50).step(0.1);
			dirAGui?.add(this._dirA.position, 'y').min(-50).max(50).step(0.1);
			dirAGui?.add(this._dirA.position, 'z').min(-50).max(50).step(0.1);

			const dirBGui = lightGui?.addFolder('Directional B');
			dirBGui?.add(this._dirB, 'intensity').min(0).max(10).step(0.1);
			dirBGui?.addColor(this._dirB, 'color');
			dirBGui?.add(this._dirB.position, 'x').min(-50).max(50).step(0.1);
			dirBGui?.add(this._dirB.position, 'y').min(-50).max(50).step(0.1);
			dirBGui?.add(this._dirB.position, 'z').min(-50).max(50).step(0.1);

			const hemiAGui = lightGui?.addFolder('Hemisphere A');
			hemiAGui?.add(this._hemiA, 'intensity').min(0).max(10).step(0.1);
			hemiAGui?.addColor(this._hemiA, 'color');
			hemiAGui?.addColor(this._hemiA, 'groundColor');
			hemiAGui?.add(this._hemiA.position, 'x').min(-50).max(50).step(0.1);
			hemiAGui?.add(this._hemiA.position, 'y').min(-50).max(50).step(0.1);
			hemiAGui?.add(this._hemiA.position, 'z').min(-50).max(50).step(0.1);

			const machinePointGui = lightGui?.addFolder('Machine');
			machinePointGui?.add(this._machine, 'intensity').min(0).max(500).step(0.1);
			machinePointGui?.addColor(this._machine, 'color');
			machinePointGui
				?.add(this._machine, 'angle')
				.min(0)
				.max(Math.PI / 2)
				.step(0.1);
			machinePointGui?.add(this._machine, 'penumbra').min(0).max(1).step(0.1);
			machinePointGui?.add(this._machine, 'decay').min(-0).max(2).step(0.1);
			machinePointGui?.add(this._machine, 'distance').min(-0).max(50).step(0.1);
			machinePointGui?.add(this._machine.position, 'x').min(-20).max(20).step(0.1);
			machinePointGui?.add(this._machine.position, 'y').min(-20).max(20).step(0.1);
			machinePointGui?.add(this._machine.position, 'z').min(-20).max(20).step(0.1);

			const dirAHelp = new DirectionalLightHelper(this._dirA, 10);
			const dirBHelp = new DirectionalLightHelper(this._dirB, 10);

			this._app.scene.add(dirAHelp, dirBHelp);
		}

		this.dispatchEvent(new Event(events.CONSTRUCTED));
	}

	update() {
		if (!this._follow_target) return;

		this._dirA.lookAt(this._target);
		this._dirB.lookAt(this._target);
	}
}
