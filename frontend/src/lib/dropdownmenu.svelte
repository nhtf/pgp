<script lang="ts">
    type data = {text: string; fn: any; show: boolean; redir: string | null;};
    type thing = 
    {
        title: string;
        options: {
            data: data[];
            offsetx: number;
            offsety: number;
        };
        img: string | undefined | null;
    };
    export let drop: thing;
    

    function toggleDropOut(event: Event | undefined,username: string) {
		if (document.getElementById(username)) {
			const elem = document.getElementById(username);
			if (elem) {
				const temp = elem.style.display;
				resetToggles();
				if (temp === "none" || temp === "") {
					elem.style.display = "flex";
                    
					const mouse = event as MouseEvent;
                    if (drop.options.offsety) {
                        elem.style.marginTop = drop.options.offsety + 'px';
                    }
                    else {
					    elem.style.top =  mouse.clientY + 25 + 'px';
                    }
                    if (drop.options.offsetx){
                        elem.style.marginRight = drop.options.offsetx + 'px';
                    }
                    else {
                        elem.style.left = mouse.clientX -30 + 'px';
                    }
				} else {
					elem.style.display = "none";
				}
			}
		}
	}

    function resetToggles() {
		var dropdowns = document.getElementsByClassName("dropdown-content");
		for (let i = 0; i < dropdowns.length; i++) {
			const dropDown = dropdowns[i] as HTMLElement;
			dropDown.style.display = "none";
		}
	}
</script>

<div class="block_cell" 
    on:click={() => toggleDropOut(event, drop.title)}
    on:keypress={() => toggleDropOut(event, drop.title)}>
    {#if !drop.img}
    <div id="dropbtn">{drop.title}</div>
    {:else}
    <img class="small-avatars {drop.title}" id="dropbtn" src={drop.img} alt="avatar" />
    {/if}
    <div id={drop.title} class="dropdown-content">
        {#each drop.options.data as {text, fn, show, redir}}
            {#if show}
                {#if fn}
                    <div class="block_hor drop-hor" id="drop-cell" 
                        on:click={() => fn(text)}
                        on:keypress={() => fn(text)}>
                        {text}
                    </div>
                {:else if redir}
                    <a href={redir}><div class="block_hor" id="drop-cell">{text}</div></a>
                {:else}
                    <div class="block_hor" id="drop-cell">{text}</div>
                {/if}
            {/if}
        {/each}
    </div>
</div>


<style>
    .dropdown-content {
        display: none;
        flex-direction: column;
        position: fixed;
        min-width: 100px;
        background-color: var(--box-color);
        border: 1px solid var(--border-color);
        border-radius: 8px;
        box-shadow: 2px 8px 16px 2px rgba(0, 0, 0, 0.4);
        z-index: 20;
        top: 0;
        justify-content: center;
        align-items: center;
        text-decoration: none;
        margin-right: 5px;
    }

    #drop-cell {
        text-decoration: none;
        color: var(--text-color);
        padding: 8px 10px;
        border-radius: 6px;
    }

    #drop-cell:hover {
        box-shadow: 1px 1px 2px 2px var(--shadow-color);
        cursor: pointer;
    }

    #dropbtn {
        cursor: pointer;
        align-self: center;
        display: flex;
    }

    #dropbtn:hover {
        text-decoration: underline;
    }
    
    .small-avatars {
        margin-right: 2em;
    }

    .block_hor {
	display: flex;
	flex-direction: row;
	padding: 3px;
	justify-content: center;
	align-items: center;

}
</style>
