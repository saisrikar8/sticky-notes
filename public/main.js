// start fetch event to get groups the user is in
fetch("/api/get-joined-groups", {
  method: "GET",
  credentials: "include"
}).then((response) => response.json())
  .then((data) => {
    console.log("Groups:", data);
  })
  .catch((error) => {
    console.error("Error fetching groups:", error);
  });

document.addEventListener("DOMContentLoaded", (event) => {

});
