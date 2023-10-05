package main

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

func newHub() *Hub {
	return &Hub{
		clients:    make(map[*Client]bool),
		broadcast:  make(chan []byte),
		register:   make(chan *Client),
		unregister: make(chan *Client),
	}
}

func (h *Hub) run() {
	for {
		select {
		case client := <-h.register:
			fmt.Printf("registering a client: %+v\n", client)
			h.clients[client] = true
		case client := <-h.unregister:
			if _, ok := h.clients[client]; ok {
				fmt.Printf("unregistering a client: %+v\n", client)
				delete(h.clients, client)
				close(client.send)
			}
		case message := <-h.broadcast:
			fmt.Printf("reading a message from broadcast: %s\n", message)
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

					fmt.Printf("Sending message %s to client %+v\n", message, client)
				default:
					fmt.Printf("closing send channel for client %+v\n", client)
					close(client.send)
					delete(h.clients, client)
				}
			}
		}
	}
}
