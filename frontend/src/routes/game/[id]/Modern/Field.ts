import { 
    WIDTH, 
    HEIGHT, 
    linethickness,
    color_border,
    b_r,
 } from "./Constants";

import type {field, renderArc, gradient} from "./Constants";
import type { Line } from "../Classic/Classic"

export class Field {
    public width: number;
    public height: number;
    public renderLines: Line[];
    public arcs: renderArc[];
    public gradients: gradient[];
    public gradientIndexs: boolean[];

    public constructor(field: field) {
        this.width = WIDTH;
        this.height = HEIGHT;
        this.renderLines = field.lines;
        this.arcs = field.arcs;
        this.gradients = field.gradients;
        this.gradientIndexs = field.gradientIndexs;
    }

    private drawBorder(context: CanvasRenderingContext2D) {
        context.lineWidth = linethickness;
        context.strokeStyle = color_border;
        context.lineJoin = "round";
        context.beginPath();
        let move = true;
        let j = 0;
        this.renderLines.forEach((line, i) => {
            if (move) {
                context.moveTo(line.p0.x, line.p0.y);
                move = false;
            }
            context.lineTo(line.p1.x, line.p1.y);
            if (this.arcs[i].angle1 > 0 || this.arcs[i].angle2 > 0)
                context.arc(this.arcs[i].pos.x, this.arcs[i].pos.y, b_r, this.arcs[i].angle1, this.arcs[i].angle2);
            if (this.gradientIndexs[i]) {
                const gradient = context.createRadialGradient(this.gradients[j].x0, this.gradients[j].y0,this.gradients[j].r0, this.gradients[j].x1, this.gradients[j].y1, this.gradients[j].r1);
                gradient.addColorStop(1, this.gradients[j].c1);
                gradient.addColorStop(0, this.gradients[j].c0);
                context.fillStyle = gradient;
                context.closePath();
                context.stroke();
                context.fill();
                context.beginPath();
                move = true;
                j+=1;
            }
        });
        //This is the last gradient
        const gradient = context.createRadialGradient(this.gradients[j].x0, this.gradients[j].y0,this.gradients[j].r0, this.gradients[j].x1, this.gradients[j].y1, this.gradients[j].r1);
        gradient.addColorStop(1, this.gradients[j].c1);
        gradient.addColorStop(0, this.gradients[j].c0);
        context.fillStyle = gradient;
        context.closePath();
        context.stroke();
        context.fill();
    }

    public render(context: CanvasRenderingContext2D) {
        context.lineCap = 'round';
        this.drawBorder(context);
    }
}