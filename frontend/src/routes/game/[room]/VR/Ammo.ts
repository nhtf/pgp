import Ammo from "ammojs-typed";

let didLoad = false;

export let internalTick: { fn: any, cb: any } = {
	fn: null,
	cb: null,
}

export async function ammoInit() {
	if (!didLoad) {
		await Ammo.call(Ammo, Ammo);

		internalTick.fn = (Ammo as any).addFunction(() => {
			internalTick.cb(arguments);
		});

		didLoad = true;
	}
}

export { Ammo };
