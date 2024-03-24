import { LoadingManager, Mesh, Texture, TextureLoader } from 'three';
import { type GLTF, GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

import { events } from '../static';
import { disposeMaterial } from './helpers';

export type LoadedItem = GLTF | Texture;
export type Source = {
	name: string;
	type: 'texture' | 'gltfModel';
	path: string | string[];
};

export default class Resources extends EventTarget {
	public readonly loadingManager = new LoadingManager();

	public sources: Source[] = [];
	public items:  { [name: Source['name']]: LoadedItem } = {};
	public toLoad = 0;
	public loaded = 0;
	public loaders: {
		dracoLoader?: DRACOLoader;
		gltfLoader?: GLTFLoader;
		textureLoader?: TextureLoader;
	} = {};
	public lastLoadedResource: {
		loaded?: Resources['loaded'];
		toLoad?: Resources['toLoad'];
		source?: Source;
		file?: unknown;
	} = {};

	constructor(sources?: Source[]) {
		super();

		if (sources) this.setSources(sources);

		this.setLoaders();
		this.dispatchEvent(new Event(events.CONSTRUCTED));
	}

	setSources(sources: Source[] = []) {
		this.sources = sources;
		this.toLoad = this.sources.length;
		this.loaded = 0;

		return this.toLoad;
	}

	addSource(source: Source) {
		this.sources.push(source);
		this.toLoad = this.sources.length;
		return this.toLoad;
	}

	getSource(sourceName: string): Source | undefined {
		return this.sources.filter((source) => source.name === sourceName)[0];
	}

	removeSource(sourceName: string) {
		this.sources = this.sources.filter((source) => source.name === sourceName);
		this.toLoad = this.sources.length;

		if (this.loaded > this.toLoad) this.loaded = this.toLoad - 1;

		return this.toLoad;
	}

	setLoaders() {
		this.loaders.gltfLoader = new GLTFLoader(this.loadingManager);
		this.loaders.textureLoader = new TextureLoader(this.loadingManager);
	}

	setDracoLoader(dracoDecoderPath: string, linkWithGltfLoader = true) {
		this.loaders.dracoLoader = new DRACOLoader(this.loadingManager);
		this.loaders.dracoLoader.setDecoderPath(dracoDecoderPath);

		if (linkWithGltfLoader && this.loaders.gltfLoader) {
			this.loaders.gltfLoader.setDRACOLoader(this.loaders.dracoLoader);
		}
	}

	startLoading() {
		this.dispatchEvent(new Event(events.STARTED));

		for (const source of this.sources) {
			if (!this.items[source.name]) {
				if (source.type === 'gltfModel' && typeof source.path === 'string')
					this.loaders.gltfLoader?.load(source.path, (model) => this.sourceLoaded(source, model));

				if (source.type === 'texture' && typeof source.path === 'string')
					this.loaders.textureLoader?.load(source.path, (texture) =>
						this.sourceLoaded(source, texture)
					);
			}
		}
	}

	sourceLoaded(source: Source, file: LoadedItem) {
		this.items[source.name] = file;
		this.loaded++;
		this.dispatchEvent(new Event(events.PROGRESSED));
		this.lastLoadedResource = {
			loaded: this.loaded,
			toLoad: this.toLoad,
			source,
			file
		};

		if (this.loaded === this.toLoad) {
			this.dispatchEvent(new Event(events.LOADED));
			this.lastLoadedResource = {
				loaded: this.loaded,
				toLoad: this.toLoad,
				source,
				file
			};
		}
	}

	destruct() {
		const keys = Object.keys(this.items);

		for (let i = 0; i < keys.length; i++) {
			const item = this.items[keys[i]];
			if (item instanceof Texture) item.dispose();

			if ((item as GLTF | undefined)?.scene?.traverse)
				(item as GLTF).scene.traverse((child) => {
					if (child instanceof Mesh) {
						child.geometry.dispose();

						if (Array.isArray(child.material)) {
							child.material.forEach((material) => {
								disposeMaterial(material);
							});
						} else {
							disposeMaterial(child.material);
						}
					}
				});
		}

		this.loaders.dracoLoader?.dispose();
		this.loadingManager.removeHandler(/onStart|onError|onProgress|onLoad/);
		this.setSources();
		this.loaders = {};
		this.items = {};

		this.dispatchEvent(new Event(events.DESTRUCTED));
	}
}
