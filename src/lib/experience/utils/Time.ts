import { events } from '../static';

export default class Time extends EventTarget {
	private readonly _start = Date.now();

	private _shouldStopAnimation = false;

	private _tick = () => {
		const currentTime = Date.now();
		this.delta = currentTime - this.current;
		this.current = currentTime;
		this.elapsed = this.current - this._start;

		const animationFrameId = requestAnimationFrame(this._tick);
		this.dispatchEvent(new Event(events.TICKED));

		if (this._shouldStopAnimation) cancelAnimationFrame(animationFrameId);
	};
	private _initialAnimationFrameId = requestAnimationFrame(this._tick);

	public current = this._start;
	public elapsed = 0;
	public delta = 16;

	constructor() {
		super();
		this.dispatchEvent(new Event(events.CONSTRUCTED));
	}

	private _stopAnimation() {
		this._shouldStopAnimation = true;
		if (typeof this._initialAnimationFrameId === 'number')
			cancelAnimationFrame(this._initialAnimationFrameId);
	}

	destruct() {
		this._stopAnimation();
		this.dispatchEvent(new Event(events.DESTRUCTED));
	}
}
