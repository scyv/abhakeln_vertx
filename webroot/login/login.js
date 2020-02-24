const app = new Vue({
  el: "#loginform",
  data: {
    error: null
  },
  methods: {
    login(evt) {
      const pwdEl = document.querySelector("#password");
      const username = document.querySelector("#username").value;
      const password = pwdEl.value;
      fetch("/login/login/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          username,
          password
        })
      })
        .then(response => response.text())
        .then(text => {
          pwdEl.value = "";
          console.log(text);
          if (text === "OK") {
            location.href = "/";
          } else {
            this.error = "Login nicht möglich. Sind Benutzername und Passwort korrekt angegeben?";
          }
        })
        .catch(err => {
          pwdEl.value = "";
          this.error = err;
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
    },
    closeError(evt) {
      this.error = null;
    }
  }
});
