import type { PageLoad } from "./$types"
import type { User } from "$lib/entities"
import type { Achievement } from "$lib/types"
import { Status } from "$lib/enums";
import { get, remove } from '$lib/Web';
import { unwrap } from '$lib/Alert';
import { updateStore, userStore } from "../../../stores"

export const ssr = false;

let profile_image = "https://www.w3schools.com/howto/img_avatar.png";

export type simpleuser = { id: number; username: string; avatar: string; status: Status; in_game: boolean; }

const dummyfriends: simpleuser[] = [
	{ username: "dummy1", avatar: profile_image, status: Status.ACTIVE, in_game: false, id: 0 },
	{ username: "dummy2", avatar: profile_image, status: Status.ACTIVE, in_game: true, id: 0 },
	{ username: "dummy3", avatar: profile_image, status: Status.IDLE, in_game: false, id: 0 },
	{ username: "dummy5", avatar: profile_image, status: Status.OFFLINE, in_game: false, id: 0 },
];

const pong = "/Assets/achievement-icons/pong.svg";
const gamer = "/Assets/achievement-icons/gamer.svg";
const chat = "/Assets/achievement-icons/chat.svg";
const winner = "/Assets/achievement-icons/winner.svg";
const popular = "/Assets/achievement-icons/popular.svg";
const chatroom = "/Assets/achievement-icons/chatroom.svg";
const vrpong = "/Assets/achievement-icons/vrpong.svg";
const classic = "/Assets/achievement-icons/classic.svg";

let dummyachievements: Achievement[] = [
	{ name: "Loser", icon: pong, have: true, text: ["you lost the game", "lose 5 games", "lose 10 games", "lose 15 games"], level: 0, progress: 1, level_cost: [5, 10, 15] },
	{ name: "Gamer", icon: gamer, have: true, text: ["played a game", "played 5 games", "played 10 games", "played 15 games"], level: 2, progress: 11, level_cost: [5, 10, 15] },
	{ name: "Winner", icon: winner, have: true, text: ["won a game", "won 5 games", "won 10 games", "won 15 games"], level: 2, progress: 10, level_cost: [5, 10, 15] },
	{ name: "Popular", icon: popular, have: true, text: ["made a friend", "made 5 friend", "made 10 friend", "made 15 friend"], level: 2, progress: 11, level_cost: [5, 10, 15] },
	{ name: "Chatty", icon: chat, have: true, text: ["sent a message", "sent 5 message", "sent 10 message", "sent 15 message"], level: 0, progress: 1, level_cost: [5, 10, 15] },
	{ name: "Social", icon: chatroom, have: true, text: ["joined a chatroom", "joined 5 chatroom", "joined 10 chatroom", "joined 15 chatroom"], level: 3, progress: 15, level_cost: [5, 10, 15] },
	{ name: "VR Pong", icon: vrpong, have: true, text: ["played your first VR pong game", "played 5 VR pong games", "played 10 VR pong games", "played 15 VR pong games"], level: 1, progress: 6, level_cost: [5, 10, 15] },
	{ name: "Classic Pong", icon: classic, have: true, text: ["played classic pong for the first time", "played 5 classic pong games", "played 10 classic pong games", "played 15 classic pong games"], level: 1, progress: 6, level_cost: [5, 10, 15] },
];

export const load: PageLoad = (async ({ fetch, parent, params }) => {
	window.fetch = fetch;

	const { user } = await unwrap(parent());
	const profile: User = await unwrap(get(`/user/${encodeURIComponent(params.username)}`));

	let friends: User[] | null = null;

	//just for debug
	if (!profile.achievements) {
		profile.achievements = dummyachievements
	}

	if (user?.id === profile.id) {
		friends = await get(`/user/me/friends`);

		updateStore(userStore, friends!);
	}

	return { self, friends, profile };
}) satisfies PageLoad;
