<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Group, AmbientLight, Vector3 } from 'three';
	import { type GLTF } from 'three/addons/loaders/GLTFLoader.js';

	import { Experience } from '$lib/experience';
	import { events } from '$lib/experience/static';

	import '../assets/styles/global.css';

	let canvasElement: HTMLCanvasElement;
	let onDispose: () => unknown;
	let onUpdate: () => unknown;

	onMount(async () => {
		const RAPIER = await (await import('@dimforge/rapier3d')).default;
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
			const physicWorld = new RAPIER.World(new Vector3(0, -9.81, 0));
			const groundColliderDesc = RAPIER.ColliderDesc.cuboid(10, 0.1, 10);
			physicWorld.createCollider(groundColliderDesc);

			const rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic().setTranslation(0, 1, 0);
			const rigidBody = physicWorld.createRigidBody(rigidBodyDesc);

			const colliderDesc = RAPIER.ColliderDesc.cuboid(0.5, 0.5, 0.5);
			const collider = physicWorld.createCollider(colliderDesc, rigidBody);

			const parentElement = canvasElement.parentElement;

			// DATA
			if (!parentElement || !conveyorBelt) return;

			experience.camera.instance.far = 500;
			experience.camera.instance?.position.set(-100, 20, -90);

			/* Experience Orbit Control */
			const light = new AmbientLight(0xffffff, 1); // soft white light

			onUpdate = () => {
				physicWorld.step();

				const position = rigidBody.translation();
			};

			experience.scene.add(conveyorBelt, light);
			experience.addEventListener(events.UPDATED, onUpdate);

			onDispose = () => {
				if (onUpdate) experience.removeEventListener(events.UPDATED, onUpdate);
				experience.destruct();
			};
		};

		experience.resources.startLoading();
		experience.resources.addEventListener(events.LOADED, onResourcesLoaded);
	});

	onDestroy(() => onDispose?.());
</script>

<section>
	<canvas id="app" bind:this={canvasElement} />
</section>
