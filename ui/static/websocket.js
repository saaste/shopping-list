
import { setItems, setFavorites, updateLastUpdate } from "./app.js";

let socket;
let eventQueue = [];

export const initializeWebSocket = () => {
    let protocol = window.location.protocol === "https:" ? "wss://" : "ws://";
    socket = new WebSocket(protocol + window.location.host + "/ws")

    socket.addEventListener("open", (event) => {
        console.debug("Websocket opened")
        if (eventQueue.length === 0) {
            sendInitEvent();
        } else {
            while (eventQueue.length > 0) {
                sendEvent(eventQueue.pop());
            }
        }
    });

    socket.addEventListener("message", (event) => {
        handleWsMessage(event.data);
    });

    socket.addEventListener("close", (event) => {
        console.debug("Websocket closed");
    });

    socket.addEventListener("error", (event) => {
        console.error("Websocket error:", event);
    });
};

export const sendInitEvent = () => {
    sendEvent({"type": "INITIAL"});
}

export const sendAddItemEvent = (itemName) => {
    sendEvent({"type": "ADD_ITEM", "name": itemName});
}

export const sendSetItemStatusEvent = (itemId, checked) => {
    sendEvent({"type": "SET_ITEM_STATUS", "id": itemId, checked});
}

export const sendRemoveItemEvent = (itemId) => {
    sendEvent({"type": "REMOVE_ITEM", "id": itemId});
}

export const sendSortItemsEvent = (sortedItems) => {
    sendEvent({ "type": "SORT_ITEMS", "items": sortedItems });
}

export const sendRemoveFavoriteEvent = (itemName) => {
    sendEvent({ "type": "REMOVE_FAVORITE", "name": itemName });
}

const sendEvent = (eventObject) => {
    if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(eventObject));
    } else {
        eventQueue.push(eventObject);
        initializeWebSocket();
    }
}

const handleWsMessage = (wsMessage) => {
    const message = JSON.parse(wsMessage)
    console.debug("Websocket message received:", message.type);
    if (message.type == "LIST_UPDATED") {
        const items = message.body.items;
        setItems(items);
        updateLastUpdate();
    }
    if (message.type == "FAVORITES_UPDATED") {
        setFavorites(message.body);
        updateLastUpdate();
    }
}