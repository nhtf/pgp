export const WIDTH = 320;
export const HEIGHT = 180;
export const UPS = 60;

export const linethickness = 1.5;

//Dimensions
export const goalHeight = 65;
export const goalWidth = 10;
export const border = 5;
export const b_r = 2.0; //border radius
export const lineWidthHex = 0.9;
export const field_radius = 150.0;
export const offset_rect = border - linethickness / 2;
export const a = 2 * Math.PI / 6;

//Ball
export const size = 2;

//Paddle
export const paddlexOffset = 10; //for where it spawns offset on x axis
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

type gradient = {
    x1: number;
    y1: number;
    r0: number;
    r1: number;
    c0: string;
    c1: string;
    last: boolean;
}

type line = {
    x: number;
    y: number;
    arc: boolean;
    angle1: number | undefined;
    angle2: number | undefined;
    gradient: gradient| undefined;
};

type goal = {
    x: number;
    y: number;
    angle: number;
    cf: string;
    cs: string;
}

type field = {
    players: number;
    goals: goal[];
    lines: line[];
}

export const fields: field[] = [{
    players: 2,
    goals: [{x: -linethickness, y: HEIGHT / 2, angle: Math.PI, cf: 'rgba(213, 172, 28, 0.7)', cs: 'rgba(213, 172, 28, 0.9)'},
            {x: WIDTH  + linethickness, y: HEIGHT / 2, angle: 0, cf: 'rgba(65, 190, 220, 0.7)', cs: 'rgba(65, 190, 220, 0.9)'},
            ],
    lines: [
        {x: WIDTH / 2, y: HEIGHT - border, arc: false},
        {x: border + b_r, y: HEIGHT - border - b_r, arc: true, angle1: 0.5 * Math.PI, angle2: 1.0 * Math.PI},
        {x: border, y: HEIGHT - border - b_r, arc: false},
        {x: border + b_r, y: border + b_r, arc: true, angle1: Math.PI, angle2: 1.5 * Math.PI},
        {x: border + b_r, y: border, arc: false,},
        {x: WIDTH / 2, y: border, arc: false},
        {x: border, y: HEIGHT / 2, arc: false, gradient: {x1: border, y1: HEIGHT / 2, r0: field_radius, r1: 0, c1: color_r_f, c0: color_stop, last: false}},
        {x: WIDTH / 2, y: border, arc: false},
        {x: WIDTH - border - b_r, y: border, arc: false},
        {x: WIDTH - border - b_r, y: border + b_r, arc: true, angle1: 1.5 * Math.PI, angle2: 0},
        {x: WIDTH - border, y: HEIGHT - border - b_r, arc: false},
        {x: WIDTH - border - b_r, y: HEIGHT - border - b_r, arc: true, angle1: 0 * Math.PI, angle2: 0.5 * Math.PI},
        {x: WIDTH / 2, y: HEIGHT - border, arc: false},
        {x: WIDTH, y: HEIGHT / 2, arc: false, gradient: {x1: WIDTH, y1: HEIGHT / 2, r0: field_radius, r1: 0, c1: color_l_f, c0: color_stop, last: true}},
    ]
}];