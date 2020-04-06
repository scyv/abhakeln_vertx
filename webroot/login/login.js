const webEndpoint = WEB_ENDPOINT;

const app = new Vue({
    el: "#loginform",
    data: {
        error: null
    },
    methods: {
        async storeUserdata(userId, password) {
            const storage = new Storage();
            await storage.addMasterKey(password);
            await storage.addUserData(userId);
        },
        login(evt) {
            const pwdEl = document.querySelector("#password");
            const username = document.querySelector("#username").value;
            const password = pwdEl.value;
            const encryption = new Encryption();
            fetch(webEndpoint + "login/login/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    username,
                    password: encryption.hash(password)
                })
            })
                .then(response => response.json())
                .then(response => {
                    pwdEl.value = "";
                    console.log("a");
                    if (response.status === "OK") {
                        console.log("b");
                        this.storeUserdata(response.userId, encryption.hash(password)).then(() => {
                            console.log("c");
                            location.href = "../";
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
            const encryption = new Encryption();
            fetch(webEndpoint + "login/register/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    username,
                    password: encryption.hash(password)
                })
            })
                .then(response => response.json())
                .then(response => {
                    pwdEl.value = "";
                    if (response.status === "OK") {
                        this.storeUserdata(response.userId, encryption.hash(password)).then(() => {
                            location.href = "../";
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
