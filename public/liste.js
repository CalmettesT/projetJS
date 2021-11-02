document.addEventListener("DOMContentLoaded", async (req, res) => {

  const DateTime = luxon.DateTime;
  let session;
  fetch("/session")
    .then((userdata) => {
      return userdata.json();
    })
    .then((dataUser) => {
      if (dataUser.userid == undefined || dataUser.userid == null) {
        window.location.replace("/");
      } else {
        session = dataUser;

        if (window.location.pathname.startsWith("/listePartie")) {
          const interval = 5;
          const validTime = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

          let next_time = DateTime.now();
          let check = validTime.find((t) => t >= next_time.second);
          let cloak_time = check ? check : validTime[0];

          let params = {};
          if (cloak_time == 0) {
            params.minutes = next_time.minute + 1;
            params.seconds = 0;
          } else {
            params.seconds = cloak_time;
          }
          let new_time = DateTime.now().set(params);

          refreshParties();

          comboAD();
          
          setTimeout(async () => {
            setInterval(async () => {
              console.log("refresh good");
              await refreshParties();
              await comboAD();
            }, interval * 1000);
          }, new_time.diff(DateTime.now()).toObject().milliseconds);
        }

        async function refreshParties() {
          const liste = document.querySelector(".listePartie");
          let actualItems = [];

          for (let index = 0; index < liste.children.length; index++) {
            const element = liste.children[index];
            actualItems.push(element.id);
          }

          await fetch("/recupPartie")
            .then((reponse) => reponse.json())
            .then(async (data) => {
              data.forEach(async (game) => {
                await actualItems.splice(actualItems.indexOf(game._id), 1);

                if (document.getElementById(game._id)) {
                  let item = document.getElementById(game._id);
                  if (game.createurPartie == session.userid) {
                    item.innerHTML =
                      " Nom de la partie: " +
                      game.nomPartie +
                      "<br> Joueur 1: " +
                      game.J1.nomJ1 +
                      "<br> Joueur 2 : " +
                      game.J2.nomJ2 +
                      "<br> Etat : " +
                      game.statue +
                      "<br><form action='/deletePartie/" +
                      game._id +
                      "' method='get'><button class='w3-button' type='submit'>Supprimer</button></form> " +
                      "<br> <form action='/partieEncour/" +
                      game._id +
                      "' method='get'><button class='w3-button' type='submit'" +
                      game._id +
                      "'>Rejoindre</button></form>";
                  } else {
                    item.innerHTML =
                      " Nom de la partie: " +
                      game.nomPartie +
                      "<br> Joueur 1: " +
                      game.J1.nomJ1 +
                      "<br> Joueur 2 : " +
                      game.J2.nomJ2 +
                      "<br> Etat : " +
                      game.statue +
                      "<br> <form action='/partieEncour/" +
                      game._id +
                      "' method='get'><button class='w3-button' type='submit'" +
                      game._id +
                      "'>Rejoindre</button></form>";
                  }
                } else {
                  let li = document.createElement("li");
                  li.id = game._id;
                  if (game.createurPartie == session.userid) {
                    li.innerHTML =
                      " Nom de la partie: " +
                      game.nomPartie +
                      "<br> Joueur 1: " +
                      game.J1.nomJ1 +
                      "<br> Joueur 2 : " +
                      game.J2.nomJ2 +
                      "<br> Etat : " +
                      game.statue +
                      "<br><form action='/deletePartie/" +
                      game._id +
                      "' method='get'><button class='w3-button' type='submit'>Supprimer</button></form> " +
                      "<br> <form action='/partieEncour/" +
                      game._id +
                      "' method='get'><button class='w3-button' type='submit'" +
                      game._id +
                      "'>Rejoindre</button></form>";
                    liste.appendChild(li);
                  } else {
                    li.innerHTML =
                      " Nom de la partie: " +
                      game.nomPartie +
                      "<br> Joueur 1: " +
                      game.J1.nomJ1 +
                      "<br> Joueur 2 : " +
                      game.J2.nomJ2 +
                      "<br> Etat : " +
                      game.statue +
                      "<br> <form action='/partieEncour/" +
                      game._id +
                      "' method='get'><button class='w3-button' type='submit'" +
                      game._id +
                      "'>Rejoindre</button></form>";
                    liste.appendChild(li);
                  }
                }
              });
            });
          await actualItems.forEach((actualItem) => {
            let obj = document.getElementById(actualItem);
            obj.parentNode.removeChild(obj);
          });
        }

        async function comboAD() {
            const liste = document.querySelector(".comboAD");
            let actualItems = [];

            for (let index = 0; index < liste.children.length; index++) {
                const element = liste.children[index];
                actualItems.push(element.id);
            }

            await fetch("/comboAD").then(reponse => reponse.json())
                .then(async data => {
                    data.forEach(async users => {
                        console.log(users);

                        await actualItems.splice(actualItems.indexOf(users._id), 1);

                        if (document.getElementById(users._id)) {
                            let item = document.getElementById(users._id);

                            item.innerHTML = users.pseudo;
                            liste.appendChild(item);

                        }
                        else {
                            let select = document.createElement("option");
                            select.id = users._id

                            select.innerHTML = users.pseudo;
                            liste.appendChild(select);

                        }

                    });
                })
            await actualItems.forEach(actualItem => {      
                let obj = document.getElementById(actualItem);
                obj.parentNode.removeChild(obj);
            })
        }
      }
    });
});
