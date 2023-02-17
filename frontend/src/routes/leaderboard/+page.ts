import { BACKEND } from "$lib/constants";
import type { PageLoad } from "./$types"

export const ssr = false;

let dummy_data = [
    {id: "vrpong",
    data: [
        {
            username: "user1",
            avatar: `${BACKEND}/avatar/image.jpg`,
            wins: 10,
            losses: 0,
            draws: 0,
            rank: 1,
        },
        {
            username: "user5",
            avatar: `${BACKEND}/avatar/image.jpg`,
            wins: 7,
            losses: 1,
            draws: 3,
            rank: 2,
        },
        {
            username: "user2",
            avatar: `${BACKEND}/avatar/image.jpg`,
            wins: 6,
            losses: 3,
            draws: 1,
            rank: 3,
        },
        {
            username: "user3",
            avatar: `${BACKEND}/avatar/image.jpg`,
            wins: 6,
            losses: 2,
            draws: 0,
            rank: 4,
        },
        {
            username: "user4",
            avatar: `${BACKEND}/avatar/image.jpg`,
            wins: 3,
            losses: 7,
            draws: 7,
            rank: 5,
        },
        {
            username: "user6",
            avatar: `${BACKEND}/avatar/image.jpg`,
            wins: 2,
            losses: 2,
            draws: 2,
            rank: 6,
        },
        {
            username: "user8",
            avatar: `${BACKEND}/avatar/image.jpg`,
            wins: 1,
            losses: 4,
            draws: 3,
            rank: 7,
        },
        {
            username: "user9",
            avatar: `${BACKEND}/avatar/image.jpg`,
            wins: 1,
            losses: 0,
            draws: 0,
            rank: 8,
        },
        {
            username: "user10",
            avatar: `${BACKEND}/avatar/image.jpg`,
            wins: 0,
            losses: 0,
            draws: 0,
            rank: 9,
        },
        {
            username: "user11",
            avatar: `${BACKEND}/avatar/image.jpg`,
            wins: 0,
            losses: 0,
            draws: 0,
            rank: 9,
        },
        {
            username: "user12",
            avatar: `${BACKEND}/avatar/image.jpg`,
            wins: 0,
            losses: 0,
            draws: 0,
            rank: 9,
        },
    ]},
    {id: "orpong",
    data:[
        {
            username: "user1d2",
            avatar: `${BACKEND}/avatar/image.jpg`,
            wins: 10,
            losses: 0,
            draws: 0,
            rank: 1,
        },
        {
            username: "user5d2",
            avatar: `${BACKEND}/avatar/image.jpg`,
            wins: 7,
            losses: 1,
            draws: 3,
            rank: 2,
        },
        {
            username: "user2d2",
            avatar: `${BACKEND}/avatar/image.jpg`,
            wins: 6,
            losses: 3,
            draws: 1,
            rank: 3,
        },
        {
            username: "user3d2",
            avatar: `${BACKEND}/avatar/image.jpg`,
            wins: 6,
            losses: 2,
            draws: 0,
            rank: 4,
        },
        {
            username: "user4d2",
            avatar: `${BACKEND}/avatar/image.jpg`,
            wins: 3,
            losses: 7,
            draws: 7,
            rank: 5,
        },
        {
            username: "user6d2",
            avatar: `${BACKEND}/avatar/image.jpg`,
            wins: 2,
            losses: 2,
            draws: 2,
            rank: 6,
        },
        {
            username: "user8d2",
            avatar: `${BACKEND}/avatar/image.jpg`,
            wins: 1,
            losses: 4,
            draws: 3,
            rank: 7,
        },
    ]},
    ];

export const load: PageLoad = (({ fetch }) => {
    window.fetch = fetch;

    return { lb: dummy_data };
  }) satisfies PageLoad;