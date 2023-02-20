import { a, border, FIELDWIDTH, color_l_f, color_l_s, color_r_f, color_r_s } from "./Constants";

export class Score {

    private r: number;

    public constructor() {
        this.r = 15;
    }

    private drawHexagon(x: number, y: number, context: CanvasRenderingContext2D) {
        context.beginPath();
        for (var i = 0; i <= 6; i++) {
            let toX = x + this.r * Math.cos(a * i);
            let toY = y + this.r * Math.sin(a * i);
            context.lineTo(toX, toY);
        }
        context.stroke();
        context.fill();
    }

    //TODO need to check the field for where to place the score?
    public render(context: CanvasRenderingContext2D, score: number[]) {
        context.strokeStyle = color_l_s;
        context.fillStyle = color_l_f;
        this.drawHexagon(FIELDWIDTH / 4, - this.r, context);
        context.textAlign = "center";
        context.fillStyle = "white";
		context.fillText(score[0].toString(), FIELDWIDTH / 4, - 3 * this.r / 4, 150);
        context.strokeStyle = color_r_s;
        context.fillStyle = color_r_f;
        this.drawHexagon(3 * FIELDWIDTH / 4, - this.r, context);

        context.fillStyle = "white";
        context.fillText(score[0].toString(), 3 * FIELDWIDTH / 4, - 3 * this.r / 4, 150);

        context.font = "24px helvetica";
        context.textBaseline = "middle";
        context.fillText("11:47", FIELDWIDTH / 2, - 3*  this.r / 4, 300);
    }
}