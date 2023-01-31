<script lang="ts">
    import { Dropdown, DropdownItem, Avatar } from 'flowbite-svelte'
    import type { Invite, User } from "$lib/types";
    import {page} from "$app/stores";
    import { onMount } from 'svelte';
    import { post } from '$lib/Web';

    console.log($page.data.user);

    let chat_invites: any[] = $page.data.invites;
    let friend_requests: any[] = $page.data.friend_requests;
    let notifications : any[] = [];

    async function removeNotification(index: number) {
        let res;
        console.log("removing notification: ", index);
        //TODO actually send a request back to deny invite/request
        if (notifications[index].type === "chat") {
            res = await post(`/room/id/${notifications[index].room.id}/deny/`);
        }
        if (res.ok) {
                notifications.splice(index, 1);
                notifications = notifications;
            }
            console.log(res);
    }

    async function acceptInvite(index: number) {
        let res;
        if (notifications[index].type === "friend") {
            console.log("sending: ", notifications[index].from.username);
            res = await post("/user/me/friends/requests/", {username: notifications[index].from.username});
        }
        else if (notifications[index].type === "chat") {
            res = await post(`/room/id/${notifications[index].room.id}/accept/`);
        }
        if (res.ok) {
                notifications.splice(index, 1);
                notifications = notifications;
            }
            console.log(res);
    }

    function fillNotifications() {
        chat_invites.forEach((invite) => {
            notifications.push({from: invite.from, type: "chat", room: invite.room})
        })
        friend_requests.forEach((request) => {
            notifications.push({from: request.from, type: "friend"})
        });
    }
    fillNotifications();
    console.log("notifications: ",notifications);
  </script>
  
  {#if notifications.length > 0}
  <div id="bell" 
  class="bell">
    <svg class="bell-icon" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"></path>
    </svg>
    <div class="flex relative">
      <div class="new-notifications"></div>
    </div>
  </div>
  <Dropdown triggeredBy="#bell" class="w-full max-w-sm rounded divide-y border-color-custom shadow background-color-custom border-color-custom"
    frameClass="border-color-custom"
    placement="bottom">
    <div slot="header" class="text-center py-2 font-bold text-center ">Notifications</div>
    {#each notifications as {from, type}, index}
    <DropdownItem class="flex space-x-4">
        <Avatar src={from.avatar} rounded />
        <div class="pl-3 w-full"
            on:click={() => acceptInvite(index)}
            on:keypress={() => acceptInvite(index)}>
            <div class="text-gray-500 text-sm mb-1.5 dark:text-gray-400">New {type} invite from <span class="font-semibold text-gray-900 dark:text-white">{from.username}</span></div>
            <div class="text-xs text-blue-600 dark:text-blue-500">Click to accept invite</div>
        </div>
        <div class="close-button">
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
    <a slot="footer" href="/invite" class="block py-2 -my-1 text-sm font-medium text-center text-gray-900 background-color-custom dark:text-white">
      <div class="inline-flex items-center">
        <svg class="mr-2 w-4 h-4 text-gray-500 dark:text-gray-400" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z"></path><path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd"></path></svg>
          View all
      </div>
    </a>
  </Dropdown>
  {/if}

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