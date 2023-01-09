<script lang="ts">
	/** @type {import('./$types').PageLoad} */
	export let data: {userlog: string};
	if (data.userlog)
		window.location.href = '/profile/' + data.userlog;
	else
		window.location.href = '/account_setup/';
</script>
