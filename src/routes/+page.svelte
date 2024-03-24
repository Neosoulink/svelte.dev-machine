<script lang="ts">
	import { onMount, onDestroy } from 'svelte';

	import { SvelteMachineExperience } from '$lib/svelte-machine';

	import '../assets/styles/global.css';

	let onDispose: () => unknown;

	onMount(async () => {
		const experience = new SvelteMachineExperience();
		experience.construct();

		onDispose = () => experience.destruct();
	});

	onDestroy(() => onDispose?.());
</script>

<section>
	<canvas id="app" />
</section>
