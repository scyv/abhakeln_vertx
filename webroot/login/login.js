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
      const crypto = new SodiumWrapper();
      fetch("/login/login/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          username,
          password: crypto.hash(password)
        })
      })
        .then(response => response.text())
        .then(text => {
          pwdEl.value = "";
          if (text === "OK") {
            new Storage().addMasterKey(crypto.hash(password)).then(() => {
              location.href = "/";
            });
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
      const pwdEl = document.querySelector("#password");
      const username = document.querySelector("#username").value;
      const password = pwdEl.value;
      const crypto = new SodiumWrapper();
      fetch("/login/register/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          username,
          password: crypto.hash(password)
        })
      })
        .then(response => response.text())
        .then(text => {
          pwdEl.value = "";
          if (text === "OK") {
            new Storage().addMasterKey(crypto.hash(password)).then(() => {
              location.href = "/";
            });
          } else {
            this.error = "Registrierung nicht möglich.";
          }
        })
        .catch(err => {
          pwdEl.value = "";
          this.error = err;
        });
    },
    closeError(evt) {
      this.error = null;
    }
  }
});
