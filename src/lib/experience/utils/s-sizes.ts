import { events } from '../static';

export interface SceneSizesType {
	height: number;
	width: number;
}

export interface SizesProps {
	height?: SceneSizesType['height'];
	width?: SceneSizesType['width'];
	listenResize?: boolean;
}

export default class Sizes extends EventTarget {
	public width: SceneSizesType['width'] = window.innerWidth;
	public height: SceneSizesType['height'] = window.innerHeight;
	public aspect: number;
	public pixelRatio = Math.min(window.devicePixelRatio, 2);
	public listenResize: boolean;
	public frustrum = 5;

	constructor({ height, width, listenResize = true }: SizesProps) {
		super();

		// SETUP
		this.height = Number(height ?? this.height);
		this.width = Number(width ?? this.width);
		this.aspect = this.width / this.height;
		this.listenResize = !!listenResize;

		window.addEventListener('resize', this._onResize);
		this.dispatchEvent(new Event(events.CONSTRUCTED));
	}

	private _onResize = () => {
		if (!this.listenResize) return;

		this.height = window.innerHeight;
		this.width = window.innerWidth;
		this.pixelRatio = this.pixelRatio = Math.min(window.devicePixelRatio, 2);

		this.dispatchEvent(new Event(events.RESIZED));
	};

	destruct() {
		this._onResize && window.removeEventListener('resize', this._onResize);
	}
}
