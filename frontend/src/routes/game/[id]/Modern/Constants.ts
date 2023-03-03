import type { Line, CollisionLine } from "../lib2D/Math2D";
import type { Vector } from "../lib2D/Math2D";

export const WIDTH = 400;
export const HEIGHT = 225;
export const FIELDWIDTH = 320;
export const FIELDHEIGHT = 180;
export const UPS = 60;
export const PADDLE_PING_TIMEOUT = 120;
export const PADDLE_PING_INTERVAL = 60;

export const linethickness = 1.5;

//Dimensions
export const goalHeight = 65;
export const goalWidth = 10;
export const border = 5;
export const b_r = 3.0; //border radius
export const lineWidthHex = 0.9;
export const field_radius = 150.0;
export const offset_rect = border - linethickness / 2;
export const a = 2 * Math.PI / 6;

//Ball
export const size = 2;

//Paddle
export const paddlexOffset = 10; //for where it spawns offset on x axis , depens on level type
export const paddleHeight = 24;
export const paddleWidth = 2;
export const paddleFillC = 'rgba(190, 162, 28, 1)';
export const paddleStrokeC = `rgba(222, 229, 19, 0.9)`;

//Colors
export const color_grid = 'rgba(75, 75, 75, 0.7)'
export const color_l_f = 'rgba(213, 172, 28, 0.7)';
export const color_l_s = 'rgba(213, 172, 28, 0.9)';
export const color_r_f = 'rgba(65, 190, 220, 0.7)';
export const color_r_s = 'rgba(65, 190, 220, 0.9)';
export const color_stop = "rgba(50,50,50, 0.95)";
export const color_border = `rgba(222, 229, 19, 0.95)`;

export enum players {
    PLAYERONE,
    PLAYERTWO,
    PLAYERTHREE,
    PLAYERFOUR
};

export enum GAME {
    TWOPLAYERS,
    FOURPLAYERS,
};

export type gradient = {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
    r0: number;
    r1: number;
    c0: string;
    c1: string;
}

export type goal = {
    x: number;
    y: number;
    angle: number;
    cf: string;
    cs: string;
}

export type paddle = {
    x: number;
    y: number;
    angle: number;
    cf: string;
    cs: string;
}

export type renderArc = {
    pos: Vector;
    angle1: number;
    angle2: number;
}

export type field = {
    players: number;
    goals: goal[];
    lines: Line[][];
    paddles: paddle[];
    gradients: gradient[];
    arcs: renderArc[];
    collisions: CollisionLine[];
    convexFieldBoxLines: CollisionLine[];
    playerAreas: CollisionLine[][];
    width: number;
    height:number;
}

export const levels = ["/Assets/game/twoplayerLevel.json", "/Assets/game/fourPlayerLevel.json"];

export const scorePositions = [
    [{x: FIELDWIDTH / 4, y: -15}, {x: 3 * FIELDWIDTH / 4, y: -15}],
    [{x: FIELDWIDTH / 4, y: -15}, {x: FIELDWIDTH / 4, y: 195}, {x: 3 * FIELDWIDTH / 4, y: 195}, {x: 3 * FIELDWIDTH / 4, y: -15}]
];

export const scoreColors = [
    [
        {cf: "rgba(213, 172, 28, 0.7)", cs: "rgba(213, 172, 28, 0.9)"},
        {cf: "rgba(65, 190, 220, 0.7)", cs: "rgba(65, 190, 220, 0.9)"}
    ],
    [
        {cf: "rgba(213, 172, 28, 0.7)", cs: "rgba(213, 172, 28, 0.9)"},
        {cf: "rgba(65, 190, 220, 0.7)", cs: "rgba(65, 190, 220, 0.9)"},
        {cf: "rgba(175, 25, 25, 0.7)", cs: "rgba(213, 172, 28, 0.9)"},
        {cf: "rgba(28, 220, 25, 0.7)", cs: "rgba(28, 220, 25, 0.9)"}
    ]
];

export const ballVelociy = [
    [{x: 2, y: 0}, {x: -2, y: 0}],
    [{x: 1.41, y: 1.41}, {x: 1.41, y: -1.41},{x: -1.41, y: -1.41}, {x: -1.41, y: 1.41}]
];




// stuff for the 4 player field

// 0: (115, 12)
// 1: (70, 90)
// 2: (115, 168)
// 3: (205, 168)
// 4: (250, 90)
// 5: (205, 12)
// 6: (160, 90)
// 7: (160, 12)
// 8: (160, 168)

/*
    arcs
0: 7pi/6 -> 9pi/6
1: 5pi/6 -> 7pi/6
2: 3pi/6 -> 5pi/6
3: 1pi/6 -> 3pi /6
4: 11pi/6 -> 1pi/6
5: 9pi/6 -> 11pi/6
*/
