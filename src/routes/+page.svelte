<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import {
		WebGLRenderer,
		Scene,
		PerspectiveCamera,
		Group,
		LinearToneMapping,
		LinearSRGBColorSpace,
		AmbientLight
	} from 'three';
	import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
	import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

	import '../assets/styles/global.css';

	let canvasElement: HTMLCanvasElement;
	let dispose = () => {};

	onMount(() => {
		let gltfLoader = new GLTFLoader();
		// let textureLoader = new TextureLoader();

		let conveyorBelt: Group | undefined;

		/**
		 * Initialize Model & Texture.
		 * @param cb Callback triggered after all resources are loaded
		 */
		const loadResources = (cb: () => void) => {
			gltfLoader?.load('/3D/svelte-conveyor-belt.glb', (model) => {
				conveyorBelt = model.scene;

				console.log('Conveyor belt loaded ==>', conveyorBelt);

				cb();
			});
		};

		/** Initialize the experience.*/
		const init = () => {
			const parentElement = canvasElement.parentElement;

			// DATA
			if (!parentElement || !conveyorBelt) return;

			let viewportWidth = parentElement.clientWidth;
			let viewportHeight = parentElement.clientHeight;
			let viewportAspect = viewportWidth / viewportHeight;

			let tickStart = Date.now();
			let tickCurrent = tickStart;

			let shouldStopRendering = false;

			const scene = new Scene();

			/* Experience renderer */
			const renderer = new WebGLRenderer({
				canvas: canvasElement,
				antialias: true,
				alpha: true
			});
			renderer.outputColorSpace = LinearSRGBColorSpace;
			renderer.toneMapping = LinearToneMapping;
			renderer.toneMappingExposure = 0.975;
			renderer.setClearAlpha(0);
			renderer.setSize(viewportWidth, viewportHeight);
			renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

			/* Experience camera */
			const camera = new PerspectiveCamera(35, viewportAspect, 1, 500);
			camera.position.set(-100, 20, -90);

			console.log('Parent loaded ==>', renderer.domElement);

			/* Experience Orbit Control */
			const controls = new OrbitControls(camera, renderer.domElement);
			controls.enableDamping = true;
			controls.target.set(30, 2, 0);
			controls.update();

			/* Experience Orbit Control */
			const light = new AmbientLight(0xffffff, 3); // soft white light

			scene.add(conveyorBelt, light);

			// METHODS
			const onResize = () => {
				viewportWidth = parentElement.clientWidth;
				viewportHeight = parentElement.clientHeight;
				viewportAspect = viewportWidth / viewportHeight;

				renderer.setViewport(0, 0, viewportWidth, viewportHeight);
				renderer.setSize(viewportWidth, viewportHeight);
				renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
				camera.aspect = viewportWidth / viewportHeight;
				camera.updateProjectionMatrix();
			};

			const render = () => {
				const tickCurrentTime = Date.now();
				const tickDelta = tickCurrentTime - tickCurrent;
				tickCurrent = tickCurrentTime;
				const tickElapsed = tickCurrent - tickStart;

				controls.update();

				renderer.render(scene, camera);

				const animationFrameId = requestAnimationFrame(render);
				if (shouldStopRendering) cancelAnimationFrame(animationFrameId);
			};

			// EVENTS
			window?.addEventListener('resize', onResize);

			dispose = () => {
				window?.removeEventListener('resize', onResize);

				shouldStopRendering = true;
			};

			render();
		};

		loadResources(init);
	});

	onDestroy(() => dispose?.());
</script>

<section>
	<canvas bind:this={canvasElement} />
</section>
