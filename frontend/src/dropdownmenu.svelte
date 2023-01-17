<script lang="ts">
    export let drop: any;

    function toggleDropOut(event: Event | undefined,username: string) {
        console.log("toggggggle");
		if (document.getElementById(username)) {
			const elem = document.getElementById(username);
			if (elem) {
				const temp = elem.style.display;
				resetToggles();
				if (temp === "none" || temp === "") {
					elem.style.display = "flex";
					const mouse = event as MouseEvent;
					elem.style.top =  mouse.clientY + 25 + 'px';
					elem.style.left = mouse.clientX -25 + 'px';
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
    console.log(drop);
</script>

<div class="block_cell" 
    on:click={() => toggleDropOut(event, drop.options.title)}
    on:keypress={() => toggleDropOut(event, drop.options.title)}>
    {#if !drop.img}
    <div id="dropbtn">{drop.options.title}</div>
    {:else}
    <img class="small-avatars" id="dropbtn" src={drop.img} alt="avatar" />
    {/if}
    <div id={drop.options.title} class="dropdown-content">
        {#each drop.options.data as {text, fn, show, redir}}
            {#if show}
                {#if fn}
                    <div class="block_hor" id="drop-cell" 
                        on:click={() => fn()}
                        on:keypress={() => fn()}>
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
        /* top: 50px; */
        top: 0;
        justify-content: center;
        align-items: center;
    }

    #drop-cell {
        color: var(--text-color);
        padding: 8px 10px;
        border-radius: 6px;
    }

    #drop-cell:hover {
        box-shadow: 1px 1px 2px 2px rgba(var(--shadow-color));
        cursor: pointer;
    }

    #dropbtn {
        cursor: pointer;
        align-self: center;
    }

    #dropbtn:hover {
        text-decoration: underline;
    }

    .small-avatars {
		max-width: 35px;
		max-height: 35px;
		border-radius: 50%;
		margin-right: 2em;
	}

    .small-avatars:hover {
		box-shadow: 2px 2px 5px 5px rgba(var(--shadow-color));
	}
</style>
