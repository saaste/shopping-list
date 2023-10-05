package main

import (
	"errors"
	"flag"
	"fmt"
	"log"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/gorilla/websocket"
)

func main() {
	port := flag.String("port", "8000", "Port")
	flag.Parse()

	hub := newHub()
	go hub.run()

	r := chi.NewRouter()
	r.Use(middleware.Logger)
	r.Get("/", handleRoot)
	r.Get("/ws", func(w http.ResponseWriter, r *http.Request) {
		serveWs(hub, w, r)
	})

	err := http.ListenAndServe(fmt.Sprintf(":%s", *port), r)
	if errors.Is(err, http.ErrServerClosed) {
		log.Println("Server closed")
	} else if err != nil {
		log.Fatalf("Error starting server: %v\n", err)
	}
}

func handleRoot(w http.ResponseWriter, r *http.Request) {
	fmt.Fprint(w, "Fooo")
}

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
}

// func handleWebSocket(w http.ResponseWriter, r *http.Request) {
// 	upgrader.CheckOrigin = func(r *http.Request) bool { return true }

// 	ws, err := upgrader.Upgrade(w, r, nil)
// 	if err != nil {
// 		log.Printf("failed to upgrade web socket connection: %v\n", err)
// 	}

// 	log.Println("Client connected")

// 	err = ws.WriteMessage(1, []byte("Oh hai, client!"))
// 	if err != nil {
// 		log.Printf("failed to write message: %v\n", err)
// 	}

// 	reader(ws)
// }

// func reader(conn *websocket.Conn) {
// 	for {
// 		messageType, p, err := conn.ReadMessage()
// 		if err != nil {
// 			log.Printf("failed to read the message: %v\n", err)
// 			return
// 		}

// 		log.Printf("message: %s, %d", string(p), messageType)

// 		if err := conn.WriteMessage(messageType, p); err != nil {
// 			log.Printf("failed to write a message: %v\n", err)
// 			return
// 		}
// 	}
// }
