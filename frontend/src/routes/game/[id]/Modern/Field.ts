import { 
    WIDTH, 
    HEIGHT, 
    linethickness,
    color_border,
    color_grid,
    color_l_f,
    color_l_s,
    color_r_f,
    color_r_s,
    color_stop,
    goalHeight,
    goalWidth,
    b_r,
    border,
    lineWidthHex,
    field_radius,
    offset_rect,
    a
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
export class Field {
    public width: number;
    public height: number;
    public r: number;
    public star_arr: rect[];

    public constructor() {
        this.width = WIDTH;
        this.height = HEIGHT;
        this.r = 16;
        const starsFraction = WIDTH * HEIGHT / 100;
        
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
        this.star_arr.forEach((element) => {
            context.globalAlpha = element.a;
            if (element.x > -this.width / 4 && element.x < this.width * 1.25 && element.y > -this.height / 4 && element.y < this.height * 1.25)
                context.fillRect(element.x, element.y, element.size, element.size);
        });
        context.restore();
    }

    private drawHexagon(x: number, y: number, context: CanvasRenderingContext2D) {
        context.beginPath();
        for (var i = 0; i < 6; i++) {
            if (x + this.r * Math.cos(a * i) < this.width * 1.25 + 0.5 * this.r)
                context.lineTo(x + this.r * Math.cos(a * i), y + this.r * Math.sin(a * i));
        }
        context.stroke();
    }

    private drawGrid(context: CanvasRenderingContext2D) {
        context.strokeStyle = color_grid;
        context.lineWidth = lineWidthHex;
        context.lineCap = 'round';
        for (let y = -this.height / 4 - this.r; y + this.r * Math.sin(a) < this.height * 1.25 + this.r; y += this.r * Math.sin(a)) {
            for (let x = -this.width / 4 + this.r, 
                j = 0; 
                x - .5 * this.r < this.width * 1.25 + this.r; 
                x += this.r * (1 + Math.cos(a)), 
                y += (-1) ** j++ * this.r * Math.sin(a)) {
                this.drawHexagon(x, y, context);
            }
        }
    }

    private drawLeftField(context: CanvasRenderingContext2D) {
        const gradient = context.createRadialGradient(border, this.height / 2, field_radius, border, this.height / 2, 0);
        gradient.addColorStop(1, color_l_s);
        gradient.addColorStop(0, color_stop);
        context.fillStyle = gradient;
        context.fillRect(offset_rect, offset_rect, this.width / 2 - offset_rect, this.height - 2 * offset_rect);
    }

    private drawRightField(context: CanvasRenderingContext2D) {
        const gradient = context.createRadialGradient(this.width, this.height * 0.5, field_radius, this.width, this.height / 2, 0);
        gradient.addColorStop(1, color_r_f);
        gradient.addColorStop(0, color_stop);
        context.fillStyle = gradient;
        context.fillRect(this.width / 2, offset_rect, this.width / 2 - offset_rect, this.height - 2 * offset_rect);
    }

    private drawMiddleLine(context: CanvasRenderingContext2D) {
        context.save();
        context.lineCap = 'square';
        context.strokeStyle = `rgba(200,200,200,0.5)`;
        context.fillStyle = 'rgba(100,100,100,0.4)';
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
        context.beginPath();
        context.arc(border, border, b_r, Math.PI,  1.5 * Math.PI);
        context.lineTo(this.width - border, border - b_r);
        context.arc(this.width - border, border, b_r, 1.5 * Math.PI,  0);
        context.lineTo(this.width - border + b_r, this.height - border - b_r);
        context.arc(this.width - border, this.height - border - b_r, b_r, 0,  0.5 * Math.PI);
        context.lineTo(border, this.height - border);
        context.arc(border, this.height - border - b_r, b_r, 0.5 * Math.PI, Math.PI);
        context.lineTo(border - b_r, border);
        context.closePath();
        context.stroke();
    }

    private drawGoal(context: CanvasRenderingContext2D, x: number, flip: number) {
        context.save();
        context.lineCap = 'square';
        context.lineWidth = linethickness;
        
        let y = this.height / 2 - goalHeight / 2;
        let offset_w;
        let offset_r; 
        if (flip === 1) {
        context.strokeStyle = color_l_s;
        context.fillStyle = color_l_f;
        offset_w = -goalWidth;
        offset_r = -b_r;
        }
        else {
        context.strokeStyle = color_r_s;
        context.fillStyle = color_r_f;
        offset_w = goalWidth;
        offset_r = b_r;
        }
        context.beginPath();
        context.moveTo(x, y);
        context.lineTo(x + offset_w, y);
        context.arc(x + offset_w, y + b_r, b_r, 1.5 * Math.PI,  Math.PI * flip, flip === 1);
        context.lineTo(x + offset_w + offset_r, y + goalHeight);
        context.arc(x + offset_w, y + goalHeight, b_r, Math.PI * flip,  0.5 * Math.PI, flip === 1);
        context.lineTo(x, y + b_r + goalHeight);
        context.fill();
        context.stroke();
        context.restore();
    }

    public render(context: CanvasRenderingContext2D) {
        context.lineCap = 'round';
        this.drawStars(context);
        this.drawGrid(context);
        this.drawLeftField(context);
        this.drawRightField(context);
        this.drawMiddleLine(context);    
        this.drawGoal(context, border - linethickness, 1);
        this.drawGoal(context, this.width - border + linethickness, 0);
        this.drawBorder(context);
    }
}