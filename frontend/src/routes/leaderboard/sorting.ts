
type sorting = { type: string; active: string; ascending: boolean };
type sorter = sorting[];
export type leaderdata = {
    username: string;
    avatar: string;
    wins: number;
    losses: number;
    draws: number;
    rank: number;
    id: number;
    gamemode: number;
};

export let LEADERBOARDS = [
    {
        title: "Classic Pong",
        id: "orpong",
        sorter: [
            { type: "rank", active: "active", ascending: false },
            { type: "user", active: "inactive", ascending: false },
            { type: "win", active: "inactive", ascending: false },
            { type: "lose", active: "inactive", ascending: false },
            { type: "draw", active: "inactive", ascending: false },
        ],
        active: true,
    },
    {
        title: "VR Pong",
        id: "vrpong",
        sorter: [
            { type: "rank", active: "active", ascending: false },
            { type: "user", active: "inactive", ascending: false },
            { type: "win", active: "inactive", ascending: false },
            { type: "lose", active: "inactive", ascending: false },
            { type: "draw", active: "inactive", ascending: false },
        ],
        active: false,
    },
    {
        title: "Modern Pong 2P",
        id: "m2pong",
        sorter: [
            { type: "rank", active: "active", ascending: false },
            { type: "user", active: "inactive", ascending: false },
            { type: "win", active: "inactive", ascending: false },
            { type: "lose", active: "inactive", ascending: false },
            { type: "draw", active: "inactive", ascending: false },
        ],
        active: false,
    },
    {
        title: "Modern Pong 4P",
        id: "m4pong",
        sorter: [
            { type: "rank", active: "active", ascending: false },
            { type: "user", active: "inactive", ascending: false },
            { type: "win", active: "inactive", ascending: false },
            { type: "lose", active: "inactive", ascending: false },
            { type: "draw", active: "inactive", ascending: false },
        ],
        active: false,
    },
];

export function changeSort(sorter: sorter, type: number, index: number, leaderboardData: any) {
    sorter.forEach((value, index) => {
        if (index !== type) {
            value.active = "inactive";
            value.ascending = false;
        }
    });
    if (sorter[type].active === "active") {
        sorter[type].ascending = !sorter[type].ascending;
        leaderboardData[index].data.sort(compare_functions[type]);
        if (!sorter[type].ascending) {
            leaderboardData[index].data.reverse();
        }
    } else {
        sorter[type].active = "active";
    }
    LEADERBOARDS[index].sorter = sorter;
    leaderboardData = leaderboardData;
}

function compare_rank(a: leaderdata, b: leaderdata) {
    if (a.rank < b.rank) {
        return -1;
    }
    if (a.rank > b.rank) {
        return 1;
    }
    return 0;
}

function compare_username(a: leaderdata, b: leaderdata) {
    if (a.username < b.username) {
        return -1;
    }
    if (a.username > b.username) {
        return 1;
    }
    return 0;
}

function compare_wins(a: leaderdata, b: leaderdata) {
    if (a.wins < b.wins) {
        return -1;
    }
    if (a.wins > b.wins) {
        return 1;
    }
    return 0;
}

function compare_losses(a: leaderdata, b: leaderdata) {
    if (a.losses < b.losses) {
        return -1;
    }
    if (a.losses > b.losses) {
        return 1;
    }
    return 0;
}

function compare_draws(a: leaderdata, b: leaderdata) {
    if (a.draws < b.draws) {
        return -1;
    }
    if (a.draws > b.draws) {
        return 1;
    }
    return 0;
}

const compare_functions = [
    compare_rank,
    compare_username,
    compare_wins,
    compare_losses,
    compare_draws,
];