import { initializeUI, redrawFavorites, redrawShoppingList } from "./ui.js"
import { initializeWebSocket } from "./websocket.js";

let items = [];
let idToItemMap = new Map()
let favorites = [];

window.onload = () => {
    initializeUI();
    initializeWebSocket();
}

export const getItems = () => {
    return items;
}

export const setItems = (newItems) => {
    items = newItems;
    idToItemMap.clear()
    items.forEach((item) => {
        idToItemMap.set(item.id, item);
    });
    redrawShoppingList(items);
    redrawFavorites(favorites);
};

export const setFavorites = (newFavorites) => {
    favorites = newFavorites;
    redrawFavorites(favorites);
}

export const getItemById = (id) => {
    return idToItemMap.get(id);
}

export const setIdToItemMap = (newMap) => {
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