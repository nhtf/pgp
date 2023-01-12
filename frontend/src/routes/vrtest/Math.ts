import { Ammo } from "./Ammo";
import * as THREE from "three";

export type VectorObject = string;

function serialize(value: ArrayBufferLike): string {
	return btoa(String.fromCharCode(...new Uint8Array(value)));
}

function deserialize(value: string): ArrayBufferLike {
	value = atob(value);
	const bytes = new Uint8Array(value.length);

	for (let i = 0; i < value.length; i++) {
		bytes[i] = value.charCodeAt(i);
	}

	return bytes.buffer;
}

export class Vector {
	x: number;
	y: number;
	z: number;

	constructor(x: number, y: number, z: number) {
		this.x = x;
		this.y = y;
		this.z = z;
	}

	intoAmmo(): Ammo.btVector3 {
		return new Ammo.btVector3(this.x, this.y, this.z);
	}

	intoThree(): THREE.Vector3 {
		return new THREE.Vector3(this.x, this.y, this.z);
	}

	intoObject(): VectorObject {
		const buffer = new Float32Array(3);
		buffer[0] = this.x;
		buffer[1] = this.y;
		buffer[2] = this.z;
		return serialize(buffer.buffer);
	}

	static fromAmmo(vector: Ammo.btVector3): Vector {
		return new Vector(vector.x(), vector.y(), vector.z());
	}

	static moveFromAmmo(vector: Ammo.btVector3): Vector {
		const result = Vector.fromAmmo(vector);
		Ammo.destroy(vector);
		return result;
	}

	static fromThree(vector: THREE.Vector3): Vector {
		return new Vector(vector.x, vector.y, vector.z);
	}

	static fromObject(vector: VectorObject): Vector {
		const buffer = new Float32Array(deserialize(vector));
		return new Vector(buffer[0], buffer[1], buffer[2]);
	}

	add(other: Vector): Vector {
		return new Vector(this.x + other.x, this.y + other.y, this.z + other.z);
	}

	sub(other: Vector): Vector {
		return new Vector(this.x - other.x, this.y - other.y, this.z - other.z);
	}

	scale(scalar: number): Vector {
		return new Vector(this.x * scalar, this.y * scalar, this.z * scalar);
	}
}

export type QuaternionObject = string;

export class Quaternion {
	x: number;
	y: number;
	z: number;
	w: number;

	constructor(x: number, y: number, z: number, w: number) {
		this.x = x;
		this.y = y;
		this.z = z;
		this.w = w;
	}

	intoAmmo(): Ammo.btQuaternion {
		return new Ammo.btQuaternion(this.x, this.y, this.z, this.w);
	}

	intoThree(): THREE.Quaternion {
		return new THREE.Quaternion(this.x, this.y, this.z, this.w);
	}

	intoObject(): QuaternionObject {
		const buffer = new Float32Array(4);
		buffer[0] = this.x;
		buffer[1] = this.y;
		buffer[2] = this.z;
		buffer[3] = this.w;
		return serialize(buffer.buffer);
	}

	static fromAmmo(quaternion: Ammo.btQuaternion): Quaternion {
		return new Quaternion(quaternion.x(), quaternion.y(), quaternion.z(), quaternion.w());
	}

	static moveFromAmmo(quaternion: Ammo.btQuaternion): Quaternion {
		const result = Quaternion.fromAmmo(quaternion);
		Ammo.destroy(quaternion);
		return result;
	}

	static fromThree(quaternion: THREE.Quaternion): Quaternion {
		return new Quaternion(quaternion.x, quaternion.y, quaternion.z, quaternion.w);
	}

	static fromObject(quaternion: QuaternionObject): Quaternion {
		const buffer = new Float32Array(deserialize(quaternion));
		return new Quaternion(buffer[0], buffer[1], buffer[2], buffer[3]);
	}

	euler(): Vector {
		return new Vector(
			Math.atan2(2 * (this.x * this.w + this.y * this.z), 1 - 2 * (this.x * this.x + this.y * this.y)),
			Math.asin(2 * (this.w * this.y - this.z * this.x)),
			Math.atan2(2 * (this.w * this.z + this.x * this.y), 1 - 2 * (this.y * this.y + this.z * this.z))
		);
	}

	mul(other: Quaternion): Quaternion {
		return new Quaternion(
			this.w * other.x + this.x * other.w + this.y * other.z - this.z * other.y,
			this.w * other.y + this.y * other.w + this.z * other.x - this.x * other.z,
			this.w * other.z + this.z * other.w + this.x * other.y - this.y * other.x,
			this.w * other.w - this.x * other.x - this.y * other.y - this.z * other.z
		);
	}

	inverse(): Quaternion {
		return new Quaternion(-this.x, -this.y, -this.z, this.w);
	}
}
