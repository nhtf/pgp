import type { Line } from "../lib2D/Math2D";
import type { VectorObject } from "../lib2D/Math2D";
import type { triangles } from "./Shader";

export const WIDTH = 440;
export const HEIGHT = 250;
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

export type paddle = {
    x: number;
    y: number;
    angle: number;
}

type rot = {
    x: number;
    y: number;
    z: number;
}

export type level = {
    players: number;
    paddles: paddle[];
    collisions: Line[];
    convexFieldBoxLines: Line[];
    playerAreas: Line[][];
    width: number;
    height:number;
    paddleStartPos: VectorObject[];
    paddleBorderColors: number[][];
    paddleGradientColors: number[][];
    paddleBorder: triangles;
    paddleGradient: triangles;

    fieldBorderColor: number[];
    fieldGradientColors: number[][];
    fieldGradientPos: VectorObject[];
    fieldGradientRot: rot[];
    fieldBorder: triangles;
    fieldGradient: triangles;
    fieldGradientRadius: VectorObject;


    goalBorder: triangles;
    goalGradient: triangles;
    goalBorderColors: number[][];
    goalGradientColors: number[][];

    circleBorder: triangles;
    circleGradient: triangles;
    middleLineMesh: triangles;
    middleLineColor: number[];
    middleCircleColor: number[];

    collisionVertices: number[];
    fieldContour: number[];
    playerAreaCollision: number[];
    paddleContour: number[];
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