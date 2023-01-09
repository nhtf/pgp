import Ammo from "ammojs-typed";

export async function ammoInit() {
	await Ammo.call(Ammo, Ammo);
}

export { Ammo };
