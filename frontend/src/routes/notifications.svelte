<script lang="ts">
    import { Dropdown, DropdownItem, Avatar } from 'flowbite-svelte'
    import type { Invite } from "$lib/types";
    import {page} from "$app/stores";
    import { respond } from '$lib/invites';
    import { onMount } from 'svelte';
    import { Subject, Action } from "$lib/types";
    import type {UpdatePacket} from "$lib/types";
    import { updateManager } from "$lib/updateSocket";
    import { invalidate } from "$app/navigation";
    import { BACKEND, } from "$lib/constants";

    $: notifications = $page.data.invites_received as Invite[];
    $: send = $page.data.invites_send as Invite[];
    $: length = $page.data.invites_received.length;
    $: user = $page.data.user;

    async function removeNotification(index: number) {
        const notif = notifications[index];
        respond(notif, "deny");
    }

    async function acceptInvite(index: number) {
        const notif = notifications[index];
        respond(notif, "accept");
    }

    async function updateInvite(update: UpdatePacket) {
		switch (update.action) {
			case Action.ADD:
				if (update.value.from.id !== user?.id) {
					notifications.push(update.value);
					notifications = notifications;
				}
				else {
					send.push(update.value);
					send = send;
				}
				break;
			case Action.REMOVE:
				if (update.value.from.id !== user?.id) {
					notifications = notifications.filter((invites) => invites.id !== update.identifier);
				} else {
					send = send.filter((invites) => invites.id !== update.identifier);
				}
				break ;
		}
        await invalidate(`${BACKEND}/user/me/invites`);
    }

        onMount(() => {
            updateManager.add(Subject.INVITES, updateInvite);
        });
    
  </script>
  

  <!-- //TODO instead of denying the invite when you click the x button just remove the notif or have it as seen or something -->
  <!-- //TODO maybe have the bell shake or something when there is a new notification -->
  <!-- //TODO sound for notification? -->
  {#key length}
  {#if notifications.length > 0}
  <div id="bell" 
  class="bell">
    <svg class="bell-icon" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"></path>
    </svg>
    <div class="flex relative">
        <!-- //TODO maybe have the red circle dissapear if you have seen the notif and only show up when there are new notifs -->
        <div class="new-notifications"></div>
    </div>
  </div>
  <Dropdown triggeredBy="#bell" class="w-full max-w-sm rounded divide-y bor-c shadow bg-c bor-c"
    frameClass="bor-c shadow divide-y w-full max-w-sm"
    placement="bottom">
    <div slot="header" class="text-center py-2 font-bold text-center ">Notifications</div>
    {#each notifications as {from, type}, index}
    <DropdownItem class="flex space-x-4">
        <Avatar src={from.avatar} />
        <div class="pl-3 w-full"
            on:click={() => acceptInvite(index)}
            on:keypress={() => acceptInvite(index)}>
            <div class="text-gray-500 text-sm mb-1.5 dark:text-gray-400">New {type} invite from <span class="font-semibold text-gray-900 dark:text-white">{from.username}</span></div>
            <div class="text-xs text-blue-600 dark:text-blue-500">Click to accept invite</div>
        </div>
        <div class="close-button" title="Deny request">
          <svg fill="currentColor" width="20" height="20"
              on:click={() => removeNotification(index)}
              on:keypress={() => removeNotification(index)}
          >
              <path d="M13.42 12L20 18.58 18.58 20 12 13.42
                      5.42 20 4 18.58 10.58 12 4 5.42 5.42
                      4 12 10.58 18.58 4 20 5.42z"/>
          </svg>
      </div>
      </DropdownItem>
    {/each}
    <a slot="footer" href="/invite" class="block py-2 -my-1 text-sm font-medium text-center text-gray-900 bg-c dark:text-white">
      <div class="inline-flex items-center">
        <svg class="mr-2 w-4 h-4 text-gray-500 dark:text-gray-400" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z"></path><path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd"></path></svg>
          View all
      </div>
    </a>
  </Dropdown>
  {/if}
  {/key}

  <style>
    .bell {
        display: inline-flex;
        align-items: center;
        font-weight: 500;
        font-size: 0.875rem;
        line-height: 1.25rem;
        text-align: center;
        position: relative;
        left: 0.5rem;
    }

    .close-button {
		position: relative;
		align-self: flex-start;
		bottom: 0.25rem;
        left: 0.5rem;
		cursor: pointer;
	}

    .new-notifications {
        display: inline-flex;
        position: relative;
        top: -0.5rem;
        right: 0.75rem;
        width: .875rem;
        height: 0.875rem;
        background-color: red;
        border-radius: 100%;
        border-width: 2px;
        border-color: var(--border-color);
        /* inline-flex relative -top-2 right-3 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-gray-900 */
    }

	.close-button:hover {
		box-shadow: 0 0 3px 2px var(--shadow-color);
		border-radius: 6px;
	}

    .bell-icon {
        width: 1.5rem;
        height: 1.5rem;
    }

    @media (max-width: 750px) {
        .bell-icon {
            width: 1.25rem;
            height: 1.25rem;
        }

        .bell {
            left: 0.25;
        }
    }


  </style>