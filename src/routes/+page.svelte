<script lang="ts">
	import { onMount, onDestroy } from 'svelte';

	import { SvelteMachineExperience } from '$lib/svelte-machine';

	import Loader from '../components/loader.svelte';
	import Controls from '../components/controls.svelte';

	import '../assets/styles/global.css';

	let onDispose: () => unknown;

	onMount(async () => {
		const experience = new SvelteMachineExperience();
		await experience.construct();

		onDispose = () => experience.destruct();
	});

	onDestroy(() => onDispose?.());
</script>

<section>
	<canvas id="app" />

	<Controls />

	<Loader />
</section>

<style>
	#app {
		position: fixed;
		top: 0;
		left: 0;
		width: 100dvw;
		height: 100dvh;
		z-index: 10;
	}
</style>
