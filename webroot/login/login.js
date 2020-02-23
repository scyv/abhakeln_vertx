new Vue({
    el: "#loginform",
    methods: {
      login(evt) {
        const username = document.querySelector("#username").value;
        const password = document.querySelector("#password").value;
        fetch("/login/login/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                  username,
                  password
              })
        });
      },
      register(evt) {
        const username = document.querySelector("#username").value;
        const password = document.querySelector("#password").value;
        fetch("/login/register/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                  username,
                  password
              })
        });
      }
    }
  });