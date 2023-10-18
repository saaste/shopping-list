package websocket

import (
	"bytes"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/google/uuid"
	ws "github.com/gorilla/websocket"

	"github.com/saaste/shopping-list/shopping_list"
)

const (
	// Time allowed to write a message to the peer.
	writeWait = 10 * time.Second

	// Time allowed to read the next pong message from the peer.
	pongWait = 60 * time.Second

	// Send pings to peer with this period. Must be less than pongWait.
	pingPeriod = (pongWait * 9) / 10

	// Maximum message size allowed from peer.
	maxMessageSize = 1024 * 4
)

var (
	newline = []byte{'\n'}
	space   = []byte{' '}
)

var upgrader = ws.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
}

type Client struct {
	hub *Hub

	// Websocket connection
	conn *ws.Conn

	// Buffered channel of outbound messages
	send chan []byte
}

// readPump pumps messages from the websocket connection to the hub.
//
// The application runs readPump in a per-connection goroutine. The application
// ensures that there is at most one reader on a connection by executing all
// reads from this goroutine.
func (c *Client) readPump() {
	defer func() {
		fmt.Printf("readPump done for client %s", c.conn.RemoteAddr().String())
		c.hub.unregister <- c
		c.conn.Close()
	}()

	c.conn.SetReadLimit(maxMessageSize)
	c.conn.SetReadDeadline(time.Now().Add(pongWait))
	c.conn.SetPongHandler(func(string) error { c.conn.SetReadDeadline(time.Now().Add(pongWait)); return nil })
	for {
		_, message, err := c.conn.ReadMessage()
		if err != nil {
			if ws.IsUnexpectedCloseError(err, ws.CloseGoingAway, ws.CloseAbnormalClosure) {
				log.Printf("failed to read message: %v\n", err)
			} else {
				log.Printf("websocket error: %v\n", err)
			}
			break
		}
		message = bytes.TrimSpace(bytes.Replace(message, newline, space, -1))

		messageType, err := GetMessageType(message)
		if err != nil {
			log.Printf("failed getting message type from %s: %v\n", string(message), err)
		}

		switch messageType {
		case MessageTypeInitial:
			err := c.handleInitialMessage()
			if err != nil {
				fmt.Printf("failed to handle INITIAL message: %v", err) // TODO: Return error response?
			}
		case MessageTypeAddItem:
			err := c.handleAddItemMessage(message)
			if err != nil {
				fmt.Printf("failed to handle ADD_ITEM message: %v", err) // TODO: Return error response?
			}
		case MessageTypeRemoveItem:
			err := c.handleRemoveItemMessage(message)
			if err != nil {
				fmt.Printf("failed to handle REMOVE_ITEM message: %v", err) // TODO: Return error response?
			}
		case MessageTypeSetItemStatus:
			err := c.handleSetItemStatusMessage(message)
			if err != nil {
				fmt.Printf("failed to handle SET_ITEM_STATUS message: %v", err) // TODO: Return error response?
			}
		case MessageTypeSortItems:
			err := c.handleSortItemsMessage(message)
			if err != nil {
				fmt.Printf("failed to handle SORT_ITEMS message: %v", err) // TODO: Return error response?
			}
		default:
			fmt.Printf("sending message %s to hub's broadcast\n", message)
			c.hub.broadcast <- []byte("unsupported message")
		}
	}
}

// writePump pumps messages from the hub to the websocket connection.
//
// A goroutine running writePump is started for each connection. The
// application ensures that there is at most one writer to a connection by
// executing all writes from this goroutine.
func (c *Client) writePump() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		c.conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.send:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				// The hub closed the channel
				fmt.Printf("Sending CloseMessage for client %+v\n", c)
				c.conn.WriteMessage(ws.CloseMessage, []byte{})
				return
			}

			w, err := c.conn.NextWriter(ws.TextMessage)
			if err != nil {
				log.Printf("failed to get a writer: %v\n", err)
				return
			}
			fmt.Printf("Writing message by client %+v\n", c.conn.RemoteAddr().String())
			fmt.Printf("%s\n\n", message)
			w.Write(message)

			if err := w.Close(); err != nil {
				log.Printf("failed to close writer: %v\n", err)
				return
			}
		case <-ticker.C:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.conn.WriteMessage(ws.PingMessage, nil); err != nil {
				log.Printf("failed to write ping message: %v\n", err)
				return
			}
		}
	}
}

func (c *Client) handleInitialMessage() error {
	appData, err := shopping_list.LoadAppData()
	if err != nil {
		return fmt.Errorf("failed to get app data: %w", err)
	}

	favoritesSorted := appData.Favorites.ToSortedList()
	favoritesUpdatedResponse := Response{
		Type: ResponseTypeFavoritesUpdated,
		Body: favoritesSorted,
	}

	listUpdatedResponse := Response{
		Type: ResponseTypeListUpdated,
		Body: appData.ShoppingList,
	}

	c.hub.broadcast <- []byte(listUpdatedResponse.ToJson())
	c.hub.broadcast <- []byte(favoritesUpdatedResponse.ToJson())
	return nil
}

func (c *Client) handleAddItemMessage(message []byte) error {
	msg, err := ParseMessageAddItem(message)
	if err != nil {
		return fmt.Errorf("failed to parse add item from %s: %w", string(message), err)
	}
	appData, err := shopping_list.LoadAppData()
	if err != nil {
		return fmt.Errorf("failed to get app data: %w", err)
	}

	id := uuid.Must(uuid.NewRandom()).String()

	// Broadcast only if item was actually added
	added := appData.ShoppingList.Add(shopping_list.Item{ID: id, Checked: false, Name: msg.ItemName})
	if !added {
		return nil
	}

	appData.Favorites.Update(msg.ItemName)
	shopping_list.SaveAppData(&appData)

	listUpdatedResponse := Response{
		Type: ResponseTypeListUpdated,
		Body: appData.ShoppingList,
	}

	favoritesSorted := appData.Favorites.ToSortedList()

	favoritesUpdatedResponse := Response{
		Type: ResponseTypeFavoritesUpdated,
		Body: favoritesSorted,
	}

	c.hub.broadcast <- []byte(listUpdatedResponse.ToJson())
	c.hub.broadcast <- []byte(favoritesUpdatedResponse.ToJson())
	return nil
}

func (c *Client) handleRemoveItemMessage(message []byte) error {
	msg, err := ParseMessageRemoveItem(message)
	if err != nil {
		return fmt.Errorf("failed to parse remove item from %s: %w", string(message), err)
	}

	appData, err := shopping_list.LoadAppData()
	if err != nil {
		return fmt.Errorf("failed to get app data: %w", err)
	}

	updatedShoppingList := shopping_list.ShoppingList{
		Items: make([]shopping_list.Item, 0),
	}

	for _, item := range appData.ShoppingList.Items {
		if item.ID != msg.ID {
			updatedShoppingList.Items = append(updatedShoppingList.Items, item)
		}
	}

	appData.ShoppingList = updatedShoppingList
	shopping_list.SaveAppData(&appData)

	response := Response{
		Type: ResponseTypeListUpdated,
		Body: updatedShoppingList,
	}

	c.hub.broadcast <- []byte(response.ToJson())
	return nil
}

func (c *Client) handleSetItemStatusMessage(message []byte) error {
	msg, err := ParseMessageSetItemStatus(message)
	if err != nil {
		return fmt.Errorf("failed to parse set item status from %s: %w", string(message), err)
	}

	appData, err := shopping_list.LoadAppData()
	if err != nil {
		return fmt.Errorf("failed to get app data: %w", err)
	}

	for i, item := range appData.ShoppingList.Items {
		if item.ID == msg.ID {
			appData.ShoppingList.Items[i].Checked = msg.Checked
		}
	}

	shopping_list.SaveAppData(&appData)

	response := Response{
		Type: ResponseTypeListUpdated,
		Body: appData.ShoppingList,
	}

	c.hub.broadcast <- []byte(response.ToJson())
	return nil
}

func (c *Client) handleSortItemsMessage(message []byte) error {
	msg, err := ParseMessageSortItems(message)
	if err != nil {
		return fmt.Errorf("failed to parse set item status from %s: %w", string(message), err)
	}

	appData, err := shopping_list.LoadAppData()
	if err != nil {
		return fmt.Errorf("failed to get app data: %w", err)
	}

	appData.ShoppingList.Items = msg.Items
	shopping_list.SaveAppData(&appData)

	response := Response{
		Type: ResponseTypeListUpdated,
		Body: appData.ShoppingList,
	}
	c.hub.broadcast <- []byte(response.ToJson())
	return nil
}

// serveWs handles websocket requests from the peer.
func ServeWs(hub *Hub, w http.ResponseWriter, r *http.Request) {
	upgrader.CheckOrigin = func(r *http.Request) bool { return true }
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println(err)
		return
	}
	client := &Client{hub: hub, conn: conn, send: make(chan []byte, 256)}
	client.hub.register <- client

	// Allow collection of memory referenced by the caller by doing all work in
	// new goroutines.
	go client.writePump()
	go client.readPump()
}
