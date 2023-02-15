import { Vector } from "./Math";
import { goalWidth, goalHeight, linethickness } from "./Constants";


export class Goal {
    public width: number;
    public height: number;
    public rotation: number;
    public position: Vector; //Center pos of the goal
    public owner: number;
    public fillColor: string;
    public strokeColor: string;


    public constructor(pos: Vector, rot: number, goalOwner: number, cf: string, cs: string) {
        this.width = goalWidth;
        this.height = goalHeight;
        this.rotation = rot;
        this.position = Vector.load(pos);
        this.owner = goalOwner;
        this.fillColor = cf;
        this.strokeColor = cs;
    }

    public render(context: CanvasRenderingContext2D) {
        context.save();
        context.lineCap = 'square';
        context.lineWidth = linethickness;
        context.strokeStyle = this.strokeColor;
        context.fillStyle = this.fillColor;
        
        const crot = Math.cos(this.rotation);
        const srot = Math.sin(this.rotation);
        const w = this.width / 2;
        const h = this.height / 2;

        const A = {x: crot * (-w -linethickness / 2) + srot * -h, y: -srot * (-w -linethickness / 2) + crot * -h};
        const B = {x: crot * (w + linethickness / 2) + srot * -h, y: -srot * (w + linethickness / 2) + crot * -h};
        const C = {x: crot * (w + linethickness / 2) + srot * h, y: -srot * (w + linethickness / 2) + crot * h};
        const D = {x: crot * (-w -linethickness / 2) + srot * h, y: -srot * (-w -linethickness / 2) + crot * h};

        context.beginPath();
        context.lineJoin = "round";
        context.moveTo(this.position.x + A.x, this.position.y + A.y); //Move to first point of the goal line
        context.lineTo(this.position.x + B.x, this.position.y + B.y);
        context.lineTo(this.position.x + C.x, this.position.y + C.y);
        context.lineTo(this.position.x + D.x, this.position.y + D.y);
        context.fill();
        context.stroke();
        context.restore();
    }
}