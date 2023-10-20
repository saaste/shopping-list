import { initializeUI, redrawFavorites, redrawShoppingList } from "./ui.js"
import { initializeWebSocket } from "./websocket.js";

let items = [];
let idToItemMap = new Map()
let favorites = [];

window.onload = () => {
    console.log("Page loaded"); // DEBUG
    initializeUI();
    initializeWebSocket();
}

export const setItems = (newItems) => {
    console.log("Set items to", newItems)
    items = newItems;
    idToItemMap.clear()
    items.forEach((item) => {
        idToItemMap.set(item.id, item);
    });
    redrawShoppingList(items);
    redrawFavorites(favorites);
};

export const setFavorites = (newFavorites) => {
    console.log("Set favorites to", newFavorites)
    favorites = newFavorites;
    redrawFavorites(favorites);
}

export const getItemById = (id) => {
    return idToItemMap.get(id);
}

export const setIdToItemMap = (newMap) => {
    console.log("Set ID to Item Map to", newMap)
    idToItemMap = newMap;
}

export const getFavorites = () => {
    let favs = [];

    favLoop: for (let j = 0; j < favorites.length; j++) {
        for (let i = 0; i < items.length; i++) {
            if (items[i].name.toLowerCase() === favorites[j].toLowerCase()) {
                continue favLoop;
            }
        }
        favs.push(favorites[j]);
    }

    return favs;
}

export const itemExists = (name) => {
    for (let i = 0; i < items.length; i++) {
        if (items[i].name.toLowerCase() === name.toLowerCase()) {
            return true;
        }
    }
    return false;
}