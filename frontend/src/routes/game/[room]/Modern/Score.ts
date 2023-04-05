import { a, FIELDWIDTH, scoreColors, scorePositions } from "./Constants";
import type { Team } from "../lib2D/Team";

export class Score {

    private r: number;
    private teams: Array<Team>

    public constructor(teams: Array<Team>) {
        this.r = 15;
        this.teams = teams;
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

    public render(context: CanvasRenderingContext2D) {
        let index = 0;
        if (this.teams.length === 4)
            index = 1;
        this.teams.forEach((team, i) => {
            context.strokeStyle = scoreColors[index][i].cs;
            context.fillStyle = scoreColors[index][i].cf;
            this.drawHexagon(scorePositions[index][i].x, scorePositions[index][i].y, context);
            context.textAlign = "center";
            context.fillStyle = "white";
            context.fillText(team.score.toString(), scorePositions[index][i].x, scorePositions[index][i].y + this.r / 4, 150);
        });
        

        context.font = "24px helvetica";
        context.textBaseline = "middle";
        context.fillText("11:47", FIELDWIDTH / 2, - 3*  this.r / 4, 300);
    }
}