import { get } from "$lib/Web";
import { type User, type Invite, Subject, Action } from "$lib/types";
import type { LayoutLoad } from "./$types";
import { BACKEND_ADDRESS } from "$lib/constants";
import { io } from "socket.io-client";

export const ssr = false;

//TODO handle the updates of the notifications/invites/requests

let user: User | null;

function isFromOther(element: Invite) {
    return element.from && element.from.id !== user?.id;
}

function isFromMe(element: Invite) {
	return element.from && element.from.id === user?.id;
}

const socket = io(`ws://${BACKEND_ADDRESS}/update`, { withCredentials: true });

function updateInvite(update: any) {
	if (update.subject === Subject.INVITES || update.subject === Subject.REQUESTS) {
		if (update.action === Action.ADD) {
			if (update.value.from.id !== user?.id)
				invites_received.push(update.value);
			else
				invites_send.push(update.value);
		}
		if (update.action === Action.REMOVE) {
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
	}	
}

let invites_received: Invite[];
let invites_send: Invite[];

export const load: LayoutLoad = (async ({ fetch }) => {
	window.fetch = fetch;

	try {
		const user: User | null = await get("/user/me");
		const invites: Invite[] = await get("/user/me/invites");
		const invites_received = invites.filter((invite) => invite.to.id === user?.id);
		const invites_send = invites.filter((invite) => invite.from.id === user?.id);
	
		socket.on("update", updateInvite);
	
		return { user, invites_received, invites_send }
	} catch (err) {
		console.log("+layout.ts", err);
		return { user: null, invites_received: [], invites_send: []};
	}
}) satisfies LayoutLoad;
