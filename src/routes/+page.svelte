<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { PerspectiveCamera, Group, AmbientLight } from 'three';
	import { type GLTF } from 'three/addons/loaders/GLTFLoader.js';

	import { Experience } from '$lib/experience';
	import { events } from '$lib/experience/static';

	import '../assets/styles/global.css';

	let canvasElement: HTMLCanvasElement;
	let dispose = () => {};

	onMount(() => {
		const experience = new Experience({
			enableDebug: true,
			axesSizes: 15,
			gridSizes: 15,
			withMiniCamera: true,
			sources: [
				{ name: 'svelte-conveyor-belt', path: '/3D/svelte-conveyor-belt.glb', type: 'gltfModel' }
			]
		});

		let conveyorBelt: Group | undefined;

		const onResourcesLoaded = () => {
			const LoadedFile = experience.resources.lastLoadedResource.file as GLTF;
			console.log('here', conveyorBelt);

			if (!(LoadedFile.scene instanceof Group)) return;

			conveyorBelt = LoadedFile.scene;
			console.log('conveyorBelt ===>', conveyorBelt);

			init();
		};

		/** Initialize the experience.*/
		const init = () => {
			const parentElement = canvasElement.parentElement;

			// DATA
			if (!parentElement || !conveyorBelt) return;

			experience.camera.instance.far = 500;
			experience.camera.instance?.position.set(-100, 20, -90);

			/* Experience Orbit Control */
			const light = new AmbientLight(0xffffff, 1); // soft white light

			experience.scene.add(conveyorBelt, light);

			dispose = () => {
				experience.destruct();
			};
		};

		experience.resources.startLoading();
		experience.resources.addEventListener(events.LOADED, onResourcesLoaded);
	});

	onDestroy(() => dispose?.());
</script>

<section>
	<canvas id="app" bind:this={canvasElement} />
</section>
