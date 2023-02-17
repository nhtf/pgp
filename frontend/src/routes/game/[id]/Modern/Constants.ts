export const WIDTH = 400;
export const HEIGHT = 225;
export const FIELDWIDTH = 320;
export const FIELDHEIGHT = 180;
export const UPS = 60;

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
export const color_border = `rgba(222, 229, 19, 0.9)`;

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
    last: boolean;
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
    lines: Line[];
    paddles: paddle[];
    gradients: gradient[];
    arcs: renderArc[];
    gradientIndexs: boolean[];
    collisions: Line[];
}

import type { Line } from "../lib2D/Math2D";
import { Vector } from "../lib2D/Math2D";

export const levels = ["/Assets/game/twoplayerLevel.json"];

const field1 = {
    players: 2,
    goals: [{x: -linethickness, y: HEIGHT / 2, angle: Math.PI, cf: 'rgba(213, 172, 28, 0.7)', cs: 'rgba(213, 172, 28, 0.9)'},
            {x: WIDTH  + linethickness, y: HEIGHT / 2, angle: 0, cf: 'rgba(65, 190, 220, 0.7)', cs: 'rgba(65, 190, 220, 0.9)'},
            ],
    lines: [
        {p0: new Vector(WIDTH / 2, HEIGHT - border), p1: new Vector(border + b_r, HEIGHT - border), name: "render1"},
        {p0: new Vector(border, HEIGHT - border), p1: new Vector(border, border + b_r), name: "render2"},
        {p0: new Vector(border, border), p1: new Vector(WIDTH / 2, border), name: "render3"}, //After this a gradient
        {p0: new Vector(WIDTH / 2, border), p1: new Vector(WIDTH - border - b_r, border), name: "render4"},
        {p0: new Vector(WIDTH - border, border), p1: new Vector(WIDTH - border, HEIGHT - border - b_r), name: "render5"},
        {p0: new Vector(WIDTH - border, HEIGHT - border), p1: new Vector(WIDTH / 2, HEIGHT - border), name: "render6"},
    ],
    arcs: [
        {pos: new Vector(border + b_r, HEIGHT - border - b_r), angle1: 0.5 * Math.PI, angle2: 1.0 * Math.PI},
        {pos: new Vector(border + b_r, border + b_r), angle1: 1.0 * Math.PI, angle2: 1.5 * Math.PI},
        {pos: new Vector(0,0), angle1: 0.0 * Math.PI, angle2: 0.0 * Math.PI}, //no arc for this line
        {pos: new Vector(WIDTH - border - b_r, border + b_r ), angle1: 1.5 * Math.PI, angle2: 0.0 * Math.PI},
        {pos: new Vector(WIDTH - border - b_r, HEIGHT - border - b_r), angle1: 0.0 * Math.PI, angle2: 0.5 * Math.PI},
        {pos: new Vector(0,0), angle1: 0.0 * Math.PI, angle2: 0.0 * Math.PI}, //no arc for this line
    ],
    gradients: [
        {x0: border, y0: HEIGHT / 2, x1: border, y1: HEIGHT / 2, r0: field_radius, r1: 0, c1: color_l_f, c0: color_stop, last: false},
        {x0: WIDTH, y0: HEIGHT / 2, x1: WIDTH, y1: HEIGHT / 2, r0: field_radius, r1: 0, c1: color_r_f, c0: color_stop, last: true}
    ],
    gradientIndexs: [false, false, true, false, false, false],
    collisions: [
        {p0: new Vector(border, HEIGHT / 2 - goalHeight / 2 - border), p1: new Vector(border, border), name: "field1"},
        {p0: new Vector(border, border), p1: new Vector(WIDTH - border, border), name: "field2"},
        {p0: new Vector(WIDTH - border, HEIGHT / 2 - goalHeight / 2 - border), p1: new Vector(WIDTH - border, border), name: "field3"},
        {p0: new Vector(WIDTH - border, HEIGHT / 2 + goalHeight / 2 - border), p1: new Vector(WIDTH - border, HEIGHT - border), name: "field4"},
        {p0: new Vector(border, HEIGHT - border), p1: new Vector(WIDTH - border, HEIGHT - border), name: "field5"},
        {p0: new Vector(border, HEIGHT / 2 + goalHeight / 2 - border), p1: new Vector(border, HEIGHT - border), name: "field6"},
    
        {p0: new Vector(border, HEIGHT / 2 - goalHeight / 2 - border), p1: new Vector(border - goalWidth, HEIGHT / 2 - goalHeight / 2 - border), name: "goal1-1"},
        {p0: new Vector(border - goalWidth, HEIGHT / 2 - goalHeight / 2 - border), p1: new Vector(border - goalWidth, HEIGHT / 2 + goalHeight / 2 - border), name: "goal1-2"},
        {p0: new Vector(border, HEIGHT / 2 + goalHeight / 2 - border), p1: new Vector(border - goalWidth, HEIGHT / 2 + goalHeight / 2 - border), name: "goal1-3"},
    
        {p0: new Vector(WIDTH - border, HEIGHT / 2 - goalHeight / 2 - border), p1: new Vector(WIDTH - border + goalWidth, HEIGHT / 2 - goalHeight / 2 - border), name: "goal2-1"},
        {p0: new Vector(WIDTH - border + goalWidth, HEIGHT / 2 - goalHeight / 2 - border), p1: new Vector(WIDTH - border + goalWidth, HEIGHT / 2 + goalHeight / 2 - border), name: "goal2-2"},
        {p0: new Vector(WIDTH - border, HEIGHT / 2 + goalHeight / 2 - border), p1: new Vector(WIDTH - border + goalWidth, HEIGHT / 2 + goalHeight / 2 - border), name: "goal2-3"},
    ],

    paddles: [{x: 10, y: HEIGHT / 2, angle: 0, cf: 'rgba(213, 172, 28, 0.7)', cs: 'rgba(213, 172, 28, 0.9)'},
    {x: WIDTH  - 10, y: HEIGHT / 2, angle: 0, cf: 'rgba(65, 190, 220, 0.7)', cs: 'rgba(65, 190, 220, 0.9)'}]
};

export const fields: field[] = [field1,];