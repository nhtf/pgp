<script lang="ts">
    import { Layer } from 'svelte-canvas';
    import { sizes, colors, starC } from './constants';

    type rect = {
        x: number;
        y: number;
        a: number;
        size:number;
        colour: string;
    }
    let star_arr: rect[] = [];

    function random(min: number, max: number): number {
        return min + Math.random() * (max + 1 - min);
    }

    const setup = (cvs: { context: CanvasRenderingContext2D; width: number; height:number; }) => {
        cvs.context.imageSmoothingEnabled = false;
        for(let i = 0; i < sizes.stars; i++) {
            //Set up random elements
            let rect: rect = {
            x: random(2, cvs.width - 2),
            y: random(2, cvs.height - 2),
            a: random(0.5, 1),
            size: random(1, 5),
            colour: starC[Math.floor(random(0, 2))]
            };
            star_arr.push(rect);
        }
    }

    function drawHexagon(x: number, y: number, r: number, context: CanvasRenderingContext2D): void {
        context.beginPath();
        const a: number = sizes.angle;
        for (var i = 0; i < 4; i++) {
            context.lineTo(x + r * Math.cos(a * i), y + r * Math.sin(a * i));
        }
        context.stroke();
    }

    function drawGrid(width: number, height: number, context: CanvasRenderingContext2D): void {
        context.strokeStyle = colors.grid;
        context.lineWidth = sizes.linew / 2 > 1 ? sizes.linew / 2 : 1;
        context.lineCap = 'round';
        const r: number = sizes.hexR;
        const a: number = sizes.angle;
        for (let y = -1.5*r; y + r * Math.sin(a) < height + 1.5 * r; y += r * Math.sin(a)) {
            for (let x = -r, 
                j = 0; 
                x + r * (1 + Math.cos(a)) < width + 2.51 * r; 
                x += r * (1 + Math.cos(a)), 
                y += (-1) ** j++ * r * Math.sin(a)) {
                drawHexagon(x, y, r, context);
            }
        }
        
    }

    function drawLeftField(width: number, height: number, context: CanvasRenderingContext2D): void {
        const gradient = context.createRadialGradient(sizes.border, height / 2, sizes.fieldR, sizes.border, height / 2, 0);
        gradient.addColorStop(1, colors.lFill);
        gradient.addColorStop(0, colors.stop);
        context.fillStyle = gradient;
        context.fillRect(sizes.offsetR, sizes.offsetR, width / 2 - sizes.offsetR, height - 2 * sizes.offsetR);
    }

    function drawRightField(width: number, height: number, context: CanvasRenderingContext2D): void {
        const gradient = context.createRadialGradient(width - sizes.border, height / 2, sizes.fieldR, width - sizes.border, height / 2, 0);
        gradient.addColorStop(1, colors.rFill);
        gradient.addColorStop(0, colors.stop);
        context.fillStyle = gradient;
        context.fillRect(width / 2, sizes.offsetR, width / 2 - sizes.offsetR, height - 2 * sizes.offsetR);
    }

    function drawMiddleLine(width: number, height: number, context: CanvasRenderingContext2D): void {
        context.save();
        context.lineCap = 'square';
        context.strokeStyle = `rgba(200,200,200,0.5)`;
        context.fillStyle = 'rgba(100,100,100,0.8)';
        context.lineWidth = sizes.linew;
        const r: number = sizes.hexR * 0.75 > 2 ? sizes.hexR * 0.75 : 2;
        context.beginPath();
        context.moveTo(width / 2, sizes.border);
        context.lineTo(width / 2, height / 2 - r);
        context.arc(width / 2, height / 2, r, 1.5 * Math.PI,  0.5 * Math.PI);
        context.moveTo(width / 2, height / 2 - r);
        context.arc(width / 2, height / 2, r, 1.5 * Math.PI,  0.5 * Math.PI, true);
        context.fill();
        context.moveTo(width / 2, height / 2 + r);
        context.lineTo(width / 2, height - sizes.border);
        context.closePath();
        context.stroke();
        context.restore();
    }

    function drawBorder(width: number, height: number, context: CanvasRenderingContext2D): void {
        const border: number = sizes.border;
        const b_r: number = sizes.borderR;
        context.lineWidth = sizes.linew;
        context.strokeStyle = colors.border;
        context.beginPath();
        context.arc(border, border, b_r, Math.PI,  1.5 * Math.PI);
        context.lineTo(width - border, border - b_r);
        context.arc(width - border, border, b_r, 1.5 * Math.PI,  0);
        context.lineTo(width - border + b_r, height - border - b_r);
        context.arc(width - border, height - border - b_r, b_r, 0,  0.5 * Math.PI);
        context.lineTo(border + b_r, height - border);
        context.arc(border, height - border - b_r, b_r, 0.5 * Math.PI, Math.PI);
        context.lineTo(border - b_r, border);
        context.closePath();
        context.stroke();
    }

    function drawGoal(height: number, context: CanvasRenderingContext2D, x: number, flip: number): void {
        context.save();
        context.lineCap = 'square';
        context.lineWidth = sizes.linew;
        const b_r: number = sizes.borderR;
        let f: boolean;
        let y: number = height / 2 - sizes.goalH / 2;
        let offset_w: number;
        let offset_r: number; 
        if (flip === 1) {
        context.strokeStyle = colors.lStroke;
        context.fillStyle = colors.lFill;
        offset_w = -sizes.goalW;
        offset_r = -b_r;
        f = true;
        }
        else {
        context.strokeStyle = colors.rStroke;
        context.fillStyle = colors.rFill;
        offset_w = sizes.goalW;
        offset_r = b_r;
        f = false;
        }
        context.beginPath();
        context.moveTo(x, y);
        context.lineTo(x + offset_w, y);
        context.arc(x + offset_w, y + b_r, b_r, 1.5 * Math.PI,  Math.PI * flip, f);
        context.lineTo(x + offset_w + offset_r, y + sizes.goalH);
        context.arc(x + offset_w, y + sizes.goalH, b_r, Math.PI * flip,  0.5 * Math.PI, f);
        context.lineTo(x, y + b_r + sizes.goalH);
        context.fill();
        context.stroke();
        context.restore();
    }

    function drawStars(context: CanvasRenderingContext2D): void {
        context.save();
        star_arr.forEach((element) => {
            context.fillStyle = element.colour;
            context.globalAlpha = element.a;
            context.fillRect(element.x, element.y, element.size, element.size);
        });
        context.restore();
    }

    $: render = (cvs: { context: CanvasRenderingContext2D; width: number; height: number; }) => {
        cvs.context.lineCap = 'round';
        drawGrid(cvs.width, cvs.height, cvs.context);
        drawStars(cvs.context);
        drawLeftField(cvs.width, cvs.height, cvs.context);
        drawRightField(cvs.width, cvs.height, cvs.context);
        drawMiddleLine(cvs.width, cvs.height, cvs.context);    
        drawGoal(cvs.height, cvs.context, sizes.border - sizes.linew * 1.5 , 1);
        drawGoal(cvs.height, cvs.context, cvs.width - sizes.border + sizes.linew * 1.5, 0);
        drawBorder(cvs.width, cvs.height, cvs.context);
    };
</script>


<Layer {setup} {render} />