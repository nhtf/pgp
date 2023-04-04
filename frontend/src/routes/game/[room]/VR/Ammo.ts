import Ammo from "ammojs-typed";

let didLoad = false;

export async function ammoInit() {
	if (!didLoad) {
		await Ammo.call(Ammo, Ammo);
		didLoad = true;
	}
}

export { Ammo };
