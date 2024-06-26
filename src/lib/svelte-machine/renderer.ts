import { ACESFilmicToneMapping, BasicShadowMap } from 'three';

import { events } from '$lib/experience/static';
import { SvelteMachineExperience } from '.';

export class Renderer extends EventTarget {
	private readonly _experience = new SvelteMachineExperience();
	private readonly _app = this._experience.app;
	private readonly _renderer = this._app.renderer;

	construct() {
		this._renderer.instance.setClearAlpha(0);
		this._renderer.instance.toneMapping = ACESFilmicToneMapping;
		this._renderer.instance.shadowMap.enabled = true;
		this._renderer.instance.shadowMap.type = BasicShadowMap;

		this.dispatchEvent(new Event(events.CONSTRUCTED));
	}
}
