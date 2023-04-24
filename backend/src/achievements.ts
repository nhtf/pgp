export interface ObjectiveDef {
	threshold: number,
	color: string,
	name: string,
	description: string,
}

export interface AchievementDef {
	name: string,
	image: string,
	max: number,
	objectives: ObjectiveDef[],
}

export const VRPONG_ACHIEVEMENT = "VR Pong";
export const CHAT_ACHIEVEMENT = "Chatty";
export const CLASSIC_LOSES_ACHIEVEMENT = "Loser";
export const FRIEND_COUNT_ACHIEVEMENT = "Popular";
export const AVATAR_ACHIEVEMENT = "Avatar";

export const achievements: AchievementDef[] = [
	{
		name: AVATAR_ACHIEVEMENT,
		max: 1,
		image: "/Assets/achievement-icons/avatarAchievment.svg",
		objectives: [
			{
				name: "Look at me!",
				description: "Set an avatar",
				threshold: 1,
				color: "#993399",
			},
		],
	},
	{
		name: VRPONG_ACHIEVEMENT,
		max: 4200,
		image: "/Assets/achievement-icons/vrpong.svg",
		objectives: [
			{
				name: "Enter the matrix",
				description: "Play a game of VR Pong",
				threshold: 1,
				color: "#cd7f32",
			},
			{
				name: "I'm getting the hang of this",
				description: "Play 50 games of VR Pong",
				threshold: 50,
				color: "#c0c0c0",
			},
			{
				name: "I am the metaverse",
				description: "Play 200 games of VR Pong",
				threshold: 200,
				color: "#ffd700",
			},
			{
				name: "No Game No Life",
				description: "Play 4200 games of VR Pong",
				threshold: 4200,
				color: "#99ffff",
			},
		],
	},
	{
		name: CHAT_ACHIEVEMENT,
		max: 5000,
		image: "/Assets/achievement-icons/chatroom.svg",
		objectives: [
			{
				name: "Hello world!",
				description: "Send a message in a chatroom",
				threshold: 1,
				color: "#cd7f32",
			},
			{
				name: "I know right?",
				description: "Send 100 messages in chatrooms",
				threshold: 100,
				color: "#c0c0c0",
			},
			{
				name: "Influencer",
				description: "Send 1000 messages in chatrooms",
				threshold: 1000,
				color: "#ffd700",
			},
			{
				name: "b.r.b.g.g.f.m.d",
				description: "Send 5000 messages in chatrooms",
				threshold: 5000,
				color: "#99ffff",
			},
		],
	},
	{
		name: CLASSIC_LOSES_ACHIEVEMENT,
		max: 3000,
		image: "/Assets/achievement-icons/pong.svg",
		objectives: [
			{
				name: "Beginner's unluck",
				threshold: 5,
				color: "#FF00FF",
				description: "You lost 5 classic games",
			},
			{
				name: "...",
				threshold: 10,
				color: "#FFFFFF",
				description: "You lost 10 classic games",
			},
			{
				name: "Mission failed successfully",
				threshold: 100,
				color: "#FFFFFF",
				description: "You lost 100 classic games",
			},
			{
				name: "Professional loser",
				threshold: 3000,
				color: "#FFFFFF",
				description: "You lost 3000 classic games",
			},
		],
	},
	{
		name: FRIEND_COUNT_ACHIEVEMENT,
		max: 2000,
		image: "/Assets/achievement-icons/popular.svg",
		objectives: [
			{
				name: "Popular",
				threshold: 5,
				color: "#FF00FF",
				description: "Made 5 friends",
			},
			{
				name: "People person",
				threshold: 20,
				color: "#FFFFFF",
				description: "Made 20 friends",
			},
			{
				name: "I know you",
				threshold: 2000,
				color: "#FFFFFF",
				description: "Made 2000 friends",
			},
		],
	}
];
