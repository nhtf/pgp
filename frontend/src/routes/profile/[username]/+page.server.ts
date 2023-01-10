import type { Actions } from './$types';


export const actions: Actions = {
    
    upload_avatar: async ({request}) => {
        console.log("action thing");
        const data = await request.formData();
        const upload = fetch('http://localhost:3000/account/set_image', {
            method: 'POST',
			credentials: "include",
			mode: "cors",
            body: data
        });
    }
  };
  
  