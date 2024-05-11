import { SvelteMachineExperience } from '.';

import { events } from '$lib/experience/static';

export class UI extends EventTarget {
	private readonly _experience = new SvelteMachineExperience();
	private readonly _loader = this._experience.loader;
	private readonly _LoaderIndicator = document.querySelector('#logo-stroke') as
		| SVGPathElement
		| undefined;

	public readonly loaderLayer = document.querySelector('#loader ') as HTMLDivElement | undefined;
	public readonly loaderBg = document.querySelector('#loader .loader-bg') as
		| HTMLDivElement
		| undefined;
	public readonly zoomControl = document.querySelector('#toggle-zoom') as
		| HTMLSpanElement
		| undefined;
	public readonly spawnRateControl = document.querySelector('#toggle-spawn-rate') as
		| HTMLSpanElement
		| undefined;

	private _onZoomControlClick?: (e: MouseEvent) => unknown;
	private _onSpawnRateControlClick?: (e: MouseEvent) => unknown;
	private _onLoaderProgressed?: (e: Event) => unknown;

	construct() {
		this._onZoomControlClick = () => {
			this.dispatchEvent(new Event(events.UI_TOGGLE_ZOOM));
		};
		this._onSpawnRateControlClick = () => {
			this.dispatchEvent(new Event(events.UI_SPAWN_RATE));
		};

		this._onLoaderProgressed = () => {
			if (!this._loader) return;

			if (this._LoaderIndicator)
				this._LoaderIndicator.style.strokeWidth = '' + (this._loader.progress / 100) * 8;

			setTimeout(() => {
				if (this.loaderLayer) this.loaderLayer.style.opacity = '0';
				if (this.loaderBg) this.loaderBg.style.transform = 'scale(0)';

				setTimeout(() => {
					if (this.loaderLayer) this.loaderLayer.remove();
				}, 1000);
			}, 2000);
		};

		this.zoomControl?.addEventListener('click', this._onZoomControlClick);
		this.spawnRateControl?.addEventListener('click', this._onSpawnRateControlClick);
		this._loader?.addEventListener(events.PROGRESSED, this._onLoaderProgressed);
	}

	destruct() {
		this._onZoomControlClick &&
			this.zoomControl?.removeEventListener('click', this._onZoomControlClick);
		this._onSpawnRateControlClick &&
			this.spawnRateControl?.removeEventListener('click', this._onSpawnRateControlClick);
		this._onLoaderProgressed &&
			this._loader?.removeEventListener(events.PROGRESSED, this._onLoaderProgressed);
	}
}
