import { get } from "$lib/Web";
import { type User, type Invite, Subject, Action } from "$lib/types";
import type { LayoutLoad } from "./$types";
import { BACKEND_ADDRESS } from "$lib/constants";
import { io } from "socket.io-client";

export const ssr = false;

//TODO handle the updates of the notifications/invites/requests

let user : User | null;

function isFromOther(element: Invite) {
    return element.from && element.from.id !== user?.id;
}

function isFromMe(element: Invite) {
	return element.from && element.from.id === user?.id;
}

const socket = io(`ws://${BACKEND_ADDRESS}/update`, {withCredentials: true});

function updateInvites() {
	socket.on("update", (update) => {
		// console.log(update);
		if (update.subject === Subject.INVITES || update.subject === Subject.REQUESTS) {
			if (update.action === Action.ADD) {
				if (update.value.from.id !== user?.id)
					invites_received.push(update.value);
				else
					invites_send.push(update.value);
			}
			if (update.action === Action.REMOVE) {
				// console.log("removing a invite");
				// console.log("update: ", update);
				if (update.value.from.id !== user?.id) {
					console.log("before removal: ", invites_received);
					invites_received = invites_received.filter((invites) => invites.id !== update.identifier);
					console.log("after removal: ", invites_received);
				}
				else {
					console.log("before removal: ", invites_send);
					invites_send = invites_send.filter((invites) => invites.id !== update.identifier);
					console.log("after removal: ", invites_send);
				}
			}
			invites_received = invites_received;
			invites_send = invites_send;
			// console.log("rec: ", invites_received, "send: ", invites_send);
		}
	});
	
}

let invites_received: Invite[];
let invites_send: Invite[];
// let notifications: Invite[];

export const load: LayoutLoad = (async ({ fetch }) => {
	window.fetch = fetch;

	type Ret = {fetch: any; user: User| null; invites_received: Invite[], invites_send: Invite[]}
	let ret: Ret;

	try {
		user = await get("/user/me");
		const invites: Invite[] = await get("/user/me/invites");
		invites_received = invites.filter(isFromOther);
		invites_send = invites.filter(isFromMe);
		console.log("invites_all: ", invites);
		updateInvites();
		console.log("notifications in layout.ts: ",invites_received);
		ret = {
			fetch: fetch,
			user: user,
			invites_received: invites_received,
			invites_send: invites_send,
		}
	} catch (err) {
		ret = {fetch: fetch, user: null, invites_received: [], invites_send: []};
		console.log("error in layout.ts: ", err);
	}
	return ret;
}) satisfies LayoutLoad;
