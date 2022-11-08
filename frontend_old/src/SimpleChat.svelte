<script>
    import { createEventDispatcher } from "svelte"
    let username, errorMessage;
    const dispatch = createEventDispatcher();
  
    const onSubmit = (e) => {
      if(errorMessage) return;
      dispatch('username-picked', username)
    }
  
    const onErrorCheck = () => {
      if(!username || username.length < 3){
        errorMessage = "Username should be at least three chars."
      } else {
        errorMessage = "";
      }
    }
  </script>
  
  
  <div class="select-username">
    <form on:submit|preventDefault|stopPropagation={onSubmit}>
      <input 
        type="text" 
        placeholder="Type Username..." 
        bind:value={username} 
        on:keyup={onErrorCheck}/>
      {#if errorMessage}
        <p class="error message">{errorMessage}</p>
      {/if}
      <button type="submit" class="submit-button">Submit</button>
    </form>
  </div>
  
  <style>
    .select-username{
      width: 300px;
      margin: 100px auto;
    }
    input{
      width: 100%;
      padding: 0.5rem;
      border: none;
      outline: none;
      border-bottom: 1px solid lightgray;
    }
    .message{
      margin: 0;
      padding: .5rem 0;
    }
  </style>