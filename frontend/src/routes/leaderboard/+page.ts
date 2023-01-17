import type { PageLoad } from "./$types"

export const ssr = false;

let dummy_data = [
    {id: "vrpong",
    data: [
        {
            username: "user1",
            avatar: "http://localhost:3000/avatar/3.jpg",
            wins: 10,
            losses: 0,
            draws: 0,
            rank: 1,
        },
        {
            username: "user5",
            avatar: "http://localhost:3000/avatar/3.jpg",
            wins: 7,
            losses: 1,
            draws: 3,
            rank: 2,
        },
        {
            username: "user2",
            avatar: "http://localhost:3000/avatar/3.jpg",
            wins: 6,
            losses: 3,
            draws: 1,
            rank: 3,
        },
        {
            username: "user3",
            avatar: "http://localhost:3000/avatar/3.jpg",
            wins: 6,
            losses: 2,
            draws: 0,
            rank: 4,
        },
        {
            username: "user4",
            avatar: "http://localhost:3000/avatar/3.jpg",
            wins: 3,
            losses: 7,
            draws: 7,
            rank: 5,
        },
        {
            username: "user6",
            avatar: "http://localhost:3000/avatar/3.jpg",
            wins: 2,
            losses: 2,
            draws: 2,
            rank: 6,
        },
        {
            username: "user8",
            avatar: "http://localhost:3000/avatar/3.jpg",
            wins: 1,
            losses: 4,
            draws: 3,
            rank: 7,
        },
    ]},
    {id: "orpong",
    data:[
        {
            username: "user1d2",
            avatar: "http://localhost:3000/avatar/3.jpg",
            wins: 10,
            losses: 0,
            draws: 0,
            rank: 1,
        },
        {
            username: "user5d2",
            avatar: "http://localhost:3000/avatar/3.jpg",
            wins: 7,
            losses: 1,
            draws: 3,
            rank: 2,
        },
        {
            username: "user2d2",
            avatar: "http://localhost:3000/avatar/3.jpg",
            wins: 6,
            losses: 3,
            draws: 1,
            rank: 3,
        },
        {
            username: "user3d2",
            avatar: "http://localhost:3000/avatar/3.jpg",
            wins: 6,
            losses: 2,
            draws: 0,
            rank: 4,
        },
        {
            username: "user4d2",
            avatar: "http://localhost:3000/avatar/3.jpg",
            wins: 3,
            losses: 7,
            draws: 7,
            rank: 5,
        },
        {
            username: "user6d2",
            avatar: "http://localhost:3000/avatar/3.jpg",
            wins: 2,
            losses: 2,
            draws: 2,
            rank: 6,
        },
        {
            username: "user8d2",
            avatar: "http://localhost:3000/avatar/3.jpg",
            wins: 1,
            losses: 4,
            draws: 3,
            rank: 7,
        },
    ]},
    ];

export const load = (() => {
    return {lb: dummy_data};
  }) satisfies PageLoad;