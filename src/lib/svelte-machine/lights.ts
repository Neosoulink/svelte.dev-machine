import { events } from '$lib/experience/static';

import {
	AmbientLight,
	CameraHelper,
	DirectionalLight,
	DirectionalLightHelper,
	HemisphereLight,
	Mesh,
	MeshStandardMaterial,
	PlaneGeometry,
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
	private readonly _ambientB = new AmbientLight(0x282855, 0.0);
	private readonly _dirA = new DirectionalLight(0xffffff, 0.65);
	private readonly _dirB = new DirectionalLight(0xffffff, 1);
	private readonly _hemiA = new HemisphereLight(0xffffff, 0x000000, 0);
	private readonly _machine = new SpotLight(0xff6969, 0, 30, 1.5, 0.3, 0.3);

	private _follow_target = true;

	public construct() {
		this._dirA.position.set(-50, 2, -40);
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
		this._dirB.castShadow = true;
		this._dirB.lookAt(this._target);

		this._machine.shadow.mapSize.width = 1024 * 2;
		this._machine.shadow.mapSize.height = 1024 * 2;
		this._machine.shadow.camera.near = 1;
		this._machine.shadow.camera.far = 10;
		this._machine.shadow.radius = 24;
		this._machine.castShadow = true;
		this._machine.position.set(-3.8, 7.6, -2.3);
		this._machine.target.position.copy(this._machine.position.clone().setY(0));

		const planeFloor = new Mesh(
			new PlaneGeometry(100, 100),
			new MeshStandardMaterial({ color: 0xffffff })
		);
		planeFloor.receiveShadow = true;
		planeFloor.rotateX(-Math.PI / 2);

		this._app.scene.add(
			planeFloor,
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
			const dirBShadowHelp = new CameraHelper(this._dirB.shadow.camera);

			this._app.scene.add(dirAHelp, dirBHelp, dirBShadowHelp);
		}

		this.dispatchEvent(new Event(events.CONSTRUCTED));
	}

	update() {
		if (!this._follow_target) return;

		this._dirA.lookAt(this._target);
		this._dirB.lookAt(this._target);
	}
}
