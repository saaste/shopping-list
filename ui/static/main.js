let sortableList;
let favorites = ["Maito", "Piimä", "Mehu", "Limppari"];
let favoritesEl;
let addInputEl;
let autoCompleteEl;

window.onload = (e) => {
    sortableList = document.getElementById("sortable-list");
    favoritesEl = document.getElementById("favorites");
    addInputEl = document.getElementById("new-item-name");

    autoCompleteEl = document.getElementById("auto-complete");
    
    addInputEl.addEventListener("focus", () => {
        console.log("focus");
        redrawFavorites();
        autoCompleteEl.classList.remove("hide");
    });
    
    addInputEl.addEventListener("blur", () => {
        console.log("lost focus");
        setTimeout(() => {
            autoCompleteEl.classList.add("hide");
        }, 200);
    });

    addInputEl.addEventListener("keyup", () => {
        redrawFavorites();
    });
};

const redrawFavorites = () => {
    const searchQuery = addInputEl.value.toLowerCase();
    favoritesEl.innerHTML = "";
    favorites.forEach((fav) => {
        if (fav.toLowerCase().startsWith(searchQuery)) {
            const li = document.createElement("li");
            li.addEventListener("click", handleFavoriteClick);
            li.innerText = fav;

            favoritesEl.appendChild(li);
        }
    });
}

const handleFavoriteClick = (e) => {
    const value = e.target.innerText;
    addInputEl.value = value;
    handleAddNewItem();
    
}