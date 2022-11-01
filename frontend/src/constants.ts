
const border = window.innerHeight > window.innerWidth ? window.innerWidth / 10 : window.innerHeight / 10;

export const colors: {
    grid: string;
    lFill: string;
    lStroke: string;
    rFill: string;
    rStroke: string;
    stop: string;
    border: string;
    paddleF: string;
    paddleS: string;
} = {
    grid: 'rgba(75, 75, 75, 0.7)',
    lFill: 'rgba(213, 172, 28, 0.75)',
    lStroke: 'rgba(213, 172, 28, 0.9)',
    rFill: 'rgba(65, 190, 220, 0.75)',
    rStroke: 'rgba(65, 190, 220, 0.9)',
    stop: 'rgba(50,50,50, 0.95)',
    border: 'rgba(222, 229, 19, 1)',
    paddleF: 'rgba(190, 162, 28, 1)',
    paddleS: `rgba(222, 229, 19, 0.9)`
};

export const starC: string[] =  ['white', 'rgb(166, 234, 255)', 'rgb(171, 207, 244)'];

export let sizes: {
    angle: number;
    hexR: number;
    border: number;
    borderR: number;
    fieldR: number;
    goalH: number;
    goalW: number;
    stars: number;
    linew: number;
    paddleH: number;
    paddleW: number;
    offsetR: number;
} = {
    angle: 2 * Math.PI / 6,
    hexR: window.innerWidth / 25,
    border: border,
    borderR: border / 10 > 1 ? border / 10 : 1,
    fieldR: window.innerWidth * 0.42,
    goalH: window.innerHeight / 4,
    goalW: border / 3,
    stars: window.innerWidth * window.innerHeight / 2500,
    linew: border / 10 > 1 ? border / 10 : 1,
    paddleH: window.innerHeight / 10,
    paddleW: window.innerWidth / 175 > 5 ? window.innerWidth / 175 : 5,
    offsetR: border - (border / 10 > 1 ? border / 10 : 1) / 2
};

export let playerOne: {
    x: number;
    y: number;
} = {
    x: window.innerWidth / 4,
    y: window.innerHeight / 2
};

export let playerTwo: {
    x: number;
    y: number;
} = {
    x: window.innerWidth * 0.75,
    y: window.innerHeight / 2
};

export let ballPos: {
    x: number;
    y: number;
} = {
    x: window.innerWidth / 2,
    y: window.innerHeight / 2
};

export let ballSize: number = window.innerHeight / 50 > 1 ? window.innerHeight / 50 : 1;