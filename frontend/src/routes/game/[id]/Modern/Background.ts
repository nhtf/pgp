import { 
    WIDTH, 
    HEIGHT, 
    linethickness,
    color_border,
    color_grid,
    b_r,
    border,
    lineWidthHex,

    FIELDWIDTH,
    FIELDHEIGHT,
    a,
 } from "./Constants";

import type { Field } from "./Field";
import type { Goal } from "./Goal";

function random(min: number, max: number) {
    return min + Math.random() * (max + 1 - min);
}

type rect = {
    x: number;
    y: number;
    a: number;
    size: number;
}

export class Background {
    public width: number;
    public height: number;
    public r: number;
    public star_arr: rect[];
    public field: Field;
    public goals: Goal[];

    public constructor(field: Field, goals: Goal[]) {
        this.width = FIELDWIDTH;
        this.height = FIELDHEIGHT;
        this.r = 16;
        const starsFraction = WIDTH * HEIGHT / 100;
        this.field = field;
        this.goals = goals;
        
        this.star_arr = [];
        for(let i = 0; i < starsFraction; i++) {
            //Set up random elements
            let rect = {
            x: random(-this.width / 4, this.width * 1.25),
            y: random(-this.height / 4, this.height * 1.25),
            a: random(0.5, 1),
            size: random(0.1, 0.5)
            };
            this.star_arr.push(rect);
        }
    }


    private drawStars(context: CanvasRenderingContext2D) {
        context.save();
        context.fillStyle = 'white';
        const out = 8 * border;
        this.star_arr.forEach((element) => {
            context.globalAlpha = element.a;
            if (element.x > -out && element.x < this.width + out && element.y > -out && element.y < this.height + out)
                context.fillRect(element.x, element.y, element.size, element.size);
        });
        context.restore();
    }

    private drawHexagon(x: number, y: number, context: CanvasRenderingContext2D) {
        context.beginPath();
        for (var i = 0; i < 4; i++) {
            let toX = x + this.r * Math.cos(a * i);
            let toY = y + this.r * Math.sin(a * i);
            if (toX > this.width + 8 * border)
                toX = this.width + 8 * border;
            if (toY > this.height + 8 * border)
                toY = this.height + 8 * border;
            if (toY < -8 * border)
                toY = -8 * border;
            if (toX < -8 * border)
                toX = -8 * border;
            context.lineTo(toX, toY);
        }
        context.stroke();
    }

    private drawGrid(context: CanvasRenderingContext2D) {
        context.strokeStyle = color_grid;
        context.lineWidth = lineWidthHex;
        context.lineCap = 'round';
        const outX = 8 * border;
        const outY = 8 * border;
        for (let y = -outY; y < this.height + outY; y += this.r * Math.sin(a)) {
            for (let x = -outX, 
                j = 0; 
                x < this.width + outX + 2.5 * this.r; 
                x += this.r * (1 + Math.cos(a)), 
                y += (-1) ** j++ * this.r * Math.sin(a)) {
                this.drawHexagon(x, y, context);
            }
        }
    }

    public render(context: CanvasRenderingContext2D) {
        context.lineCap = 'round';
        this.drawStars(context);
        this.drawGrid(context);
        this.goals.forEach((goal) => goal.render(context));
        this.field.render(context);        
    }
}