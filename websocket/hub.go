package websocket

import (
	"fmt"
	"log"
)

type Hub struct {
	// Registered clients
	clients map[*Client]bool

	// Inbound messages from clients
	broadcast chan []byte

	// Register requests from clients
	register chan *Client

	// Unregister requests from clients
	unregister chan *Client
}

func NewHub() *Hub {
	return &Hub{
		clients:    make(map[*Client]bool),
		broadcast:  make(chan []byte),
		register:   make(chan *Client),
		unregister: make(chan *Client),
	}
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			fmt.Printf("registering a client: %s\n", client.conn.RemoteAddr())
			h.clients[client] = true
		case client := <-h.unregister:
			if _, ok := h.clients[client]; ok {
				fmt.Printf("unregistering a client: %s\n", client.conn.RemoteAddr())
				delete(h.clients, client)
				close(client.send)
			}
		case message := <-h.broadcast:
			for client := range h.clients {
				select {
				case client.send <- message:
					msgType, err := GetMessageType(message)
					if err != nil {
						log.Printf("failed to parse message %s: %v\n", message, err)
					} else {
						if msgType == MessageTypeAddItem {
							msg, err := ParseMessageAddItem(message)
							if err != nil {
								log.Printf("failed to parse MessageAddItem: %v", err)
							}
							log.Printf("successfully parsed message: %+v\n", msg)
						}

					}

					// fmt.Printf("Sending message %s to client %s\n", message, client)
				default:
					fmt.Printf("closing send channel for client %s\n", client.conn.RemoteAddr())
					close(client.send)
					delete(h.clients, client)
				}
			}
		}
	}
}
