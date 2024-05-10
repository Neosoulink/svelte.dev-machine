import { events } from '$lib/experience/static';

export class Renderer extends EventTarget {
	construct() {
		this.dispatchEvent(new Event(events.CONSTRUCTED));
	}
}
