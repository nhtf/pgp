<script lang="ts">
    import { Layer, t } from "svelte-canvas";
    import { playerOne, sizes, colors } from './constants';

    const setup = () => {
        playerOne.x = window.innerHeight / 4;
        playerOne.y = window.innerHeight / 2;
    }

    $: render = (cvs: { context: CanvasRenderingContext2D }) => {
        //Rendering of the paddle
        cvs.context.strokeStyle = $t; //just for now so it rerenders
        cvs.context.lineWidth = sizes.linew;
        let x = playerOne.x;
        let y = playerOne.y - sizes.paddleH / 2;
        cvs.context.beginPath();
        cvs.context.fillStyle = colors.paddleF;
        cvs.context.strokeStyle = colors.paddleS;
        cvs.context.arc(x, y, sizes.paddleW, Math.PI, 0);
        cvs.context.lineTo(
            x + sizes.paddleW,
            y + sizes.paddleH - sizes.paddleW
        );
        cvs.context.arc(
            x,
            y - sizes.paddleW + sizes.paddleH,
            sizes.paddleW,
            0,
            Math.PI
        );
        cvs.context.lineTo(x - sizes.paddleW, y);
        cvs.context.stroke();
        cvs.context.fill();
    };

</script>

<Layer {render} {setup} />