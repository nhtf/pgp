import { 
    WIDTH, 
    HEIGHT, 
    linethickness,
    color_border,
    color_grid,
    b_r,
    border,
    lineWidthHex,
    a,
 } from "./Constants";

function random(min: number, max: number) {
    return min + Math.random() * (max + 1 - min);
}

type rect = {
    x: number;
    y: number;
    a: number;
    size: number;
}

//TODO optimize the drawing of the field? maybe try to make it one image / seperate layer?
//TODO make it use a polyline so it easily can be changed
export class Field {
    public width: number;
    public height: number;
    public r: number;
    public star_arr: rect[];
    public lines: line[];

    public constructor(lines: line[]) {
        this.width = WIDTH;
        this.height = HEIGHT;
        this.r = 16;
        const starsFraction = WIDTH * HEIGHT / 100;
        this.lines = lines;
        
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
        const out = 8 * border;
        for (let y = -out; y < this.height + out; y += this.r * Math.sin(a)) {
            for (let x = -out, 
                j = 0; 
                x < this.width + 2.5 * this.r; 
                x += this.r * (1 + Math.cos(a)), 
                y += (-1) ** j++ * this.r * Math.sin(a)) {
                this.drawHexagon(x, y, context);
            }
        }
    }

    private drawMiddleLine(context: CanvasRenderingContext2D) {
        context.save();
        context.lineCap = 'square';
        context.strokeStyle = `rgba(200,200,200,0.9)`;
        context.fillStyle = 'rgba(100,100,100,1)';
        context.lineWidth = linethickness;
        context.beginPath();
        context.moveTo(this.width / 2, border);
        context.lineTo(this.width / 2, this.height / 2 - this.r);
        context.arc(this.width / 2, this.height / 2, this.r, 1.5 * Math.PI,  0.5 * Math.PI);
        context.moveTo(this.width / 2, this.height / 2 - this.r);
        context.arc(this.width / 2, this.height / 2, this.r, 1.5 * Math.PI,  0.5 * Math.PI, true);
        context.fill();
        context.moveTo(this.width / 2, this.height / 2 + this.r);
        context.lineTo(this.width / 2, this.height - border);
        context.closePath();
        context.stroke();
        context.restore();
    }

    private drawBorder(context: CanvasRenderingContext2D) {
        context.lineWidth = linethickness;
        context.strokeStyle = color_border;
        context.lineJoin = "round";
        context.beginPath();
        context.moveTo(this.lines[0].x, this.lines[0].y);
        this.lines.forEach((pos) => {
            if (pos.arc)
                context.arc(pos.x, pos.y, b_r,pos.angle1, pos.angle2);
            else if (!pos.gradient)
                context.lineTo(pos.x, pos.y);
            else {
                const gradient = context.createRadialGradient(pos.x, pos.y, pos.gradient.r0, pos.gradient.x1, pos.gradient.y1, pos.gradient.r1);
                gradient.addColorStop(1, pos.gradient.c1);
                gradient.addColorStop(0, pos.gradient.c0);
                context.fillStyle = gradient;
                context.closePath();
                context.stroke();
                context.fill();
                if (!pos.last)
                    context.beginPath();
            }
        });
    }

    public render(context: CanvasRenderingContext2D) {
        context.lineCap = 'round';
        this.drawStars(context);
        this.drawGrid(context);
        this.drawBorder(context);
        this.drawMiddleLine(context);
    }
}