import { PerspectiveCamera, Vector2 } from 'three';
import { SvelteMachineExperience } from '.';

export class Camera extends EventTarget {
	private readonly _experience = new SvelteMachineExperience();
	private readonly _app = this._experience.app;
	private readonly _time = this._app.time;
	private readonly _camera = this._app.camera;
	private readonly _debug = this._app.debug;
	private readonly _position = new Vector2(19.7, 5.5);
	private readonly _smoothedPosition = this._position.clone();
	private readonly _cursor = new Vector2();
	private readonly _sensitivity = 0.0001;
	private readonly _smoothness = 0.1;
	private readonly _radius = -65;

	private _onMouseMove?: (e?: MouseEvent) => unknown;
	private _onClick?: (e?: MouseEvent) => unknown;
	private _isAnimating = false;
	private _zoomingIntervalId = 0;

	construct() {
		this._camera.instance.near = 0.1;
		this._camera.instance.far = 300;
		this._camera.target.set(7.6, -1.1, -12);
		this._camera.instance.position.set(-49, 44.6, -42.5);

		if (this._debug?.cameraControls?.target) this._debug.cameraControls.target.set(7.6, -1.1, -12);

		this._onMouseMove = (e) => {
			this._cursor.set(e?.movementX ?? 0, e?.movementY ?? 0);

			const angleX = this._cursor.x * this._sensitivity;
			const angleY = this._cursor.y * this._sensitivity;

			const newX = this._position.x + angleX;
			const newY = this._position.y + angleY;

			this._position.x = newX;
			this._position.y = newY;
		};

		this._onClick = () => this.toggleZoom();
		this._onMouseMove();
		document.addEventListener('mousemove', this._onMouseMove);
		document.addEventListener('click', this._onClick);
	}

	toggleZoom() {
		if (!(this._camera.instance instanceof PerspectiveCamera) || this._isAnimating) return;

		this._isAnimating = true;

		if (this._camera.instance.fov > 35)
			this._zoomingIntervalId = setInterval(() => {
				this._camera.instance.fov -= 0.5;
				if (this._camera.instance.fov < 35) {
					clearInterval(this._zoomingIntervalId);
					this._isAnimating = false;
				}
			}, 16);
		else
			this._zoomingIntervalId = setInterval(() => {
				this._camera.instance.fov += 0.5;
				if (this._camera.instance.fov > 60) {
					clearInterval(this._zoomingIntervalId);
					this._isAnimating = false;
				}
			}, 16);
	}

	update() {
		this._smoothedPosition.x +=
			(this._position.x - this._smoothedPosition.x) * this._smoothness * this._time.delta * 0.03;
		this._smoothedPosition.y +=
			(this._position.y - this._smoothedPosition.y) * this._smoothness * this._time.delta * 0.03;

		const newXPosition = this._radius * Math.sin(this._smoothedPosition.x);
		const newYPosition = this._radius * Math.sin(this._smoothedPosition.y);
		const newZPosition = this._radius * Math.cos(this._smoothedPosition.x);

		this._camera.instance.position.set(newXPosition, newYPosition, newZPosition);
	}

	destruct() {
		this._onMouseMove && document.removeEventListener('mousemove', this._onMouseMove);
		clearInterval(this._zoomingIntervalId);
	}
}
