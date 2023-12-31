package main

import (
	"errors"
	"flag"
	"fmt"
	"log"
	"net/http"
	"strings"
	"text/template"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"

	"golang.org/x/crypto/bcrypt"

	"github.com/saaste/shopping-list/shopping_list"
	"github.com/saaste/shopping-list/websocket"
)

var requiredPassword string

func main() {
	port := flag.String("port", "8000", "Port")
	flag.Parse()

	appConfig, err := shopping_list.LoadAppConfig()
	if err != nil {
		log.Fatalf("failed to load app config: %v", err)
	}

	requiredPassword = appConfig.Password

	hub := websocket.NewHub()
	go hub.Run()

	r := chi.NewRouter()
	r.Use(middleware.Logger)
	r.Get("/", handleRoot)
	r.Get("/login", handleLogin)
	r.Post("/login", handleLogin)
	r.Get("/logout", handleLogout)
	r.Get("/ws", func(w http.ResponseWriter, r *http.Request) {
		if !appConfig.IsValidOrigin(r) || !isValidAuthCookie(r) {
			http.Error(w, "Forbidden", http.StatusForbidden)
			return
		}

		websocket.ServeWs(hub, w, r)
	})

	fileServer(r, "/static", http.Dir("ui/static"))

	err = http.ListenAndServe(fmt.Sprintf(":%s", *port), r)
	if errors.Is(err, http.ErrServerClosed) {
		log.Println("Server closed")
	} else if err != nil {
		log.Fatalf("Error starting server: %v\n", err)
	}
}

func handleRoot(w http.ResponseWriter, r *http.Request) {
	isAuthenticated := isValidAuthCookie(r)
	if !isAuthenticated {
		http.Redirect(w, r, "/login", http.StatusMovedPermanently)
		return
	}
	t, err := template.ParseFiles("ui/templates/base.html", "ui/templates/home.html")
	if err != nil {
		log.Printf("Failed to parse home templates: %s", err)
		http.Error(w, "Internal Server Error", 500)
	}
	err = t.ExecuteTemplate(w, "base", nil)
	if err != nil {
		log.Printf("Failed to execute home template: %s", err)
		http.Error(w, "Internal Server Error", 500)
	}
}

func handleLogin(w http.ResponseWriter, r *http.Request) {
	fmt.Printf("Method: %s\n", r.Method)
	if r.Method == "POST" {
		r.ParseForm()
		password := r.FormValue("password")
		if password == requiredPassword {
			setAuthCookie(w)
			http.Redirect(w, r, "/", http.StatusMovedPermanently)
			return
		}
	}

	t, err := template.ParseFiles("ui/templates/base.html", "ui/templates/login.html")
	if err != nil {
		log.Printf("Failed to parse login templates: %s", err)
		http.Error(w, "Internal Server Error", 500)
	}
	err = t.ExecuteTemplate(w, "base", nil)
	if err != nil {
		log.Printf("Failed to execute login template: %s", err)
		http.Error(w, "Internal Server Error", 500)
	}
}

func handleLogout(w http.ResponseWriter, r *http.Request) {
	cookie := http.Cookie{
		Name:     "auth",
		Value:    "",
		Path:     "/",
		MaxAge:   0,
		Expires:  time.Unix(0, 0),
		HttpOnly: true,
		Secure:   false,
		SameSite: http.SameSiteLaxMode,
	}
	http.SetCookie(w, &cookie)
	http.Redirect(w, r, "/login", http.StatusMovedPermanently)
}

func fileServer(r chi.Router, path string, root http.FileSystem) {
	if strings.ContainsAny(path, "{}*") {
		panic("FileServer does not permit any URL parameters.")
	}

	if path != "/" && path[len(path)-1] != '/' {
		r.Get(path, http.RedirectHandler(path+"/", http.StatusMovedPermanently).ServeHTTP)
		path += "/"
	}
	path += "*"

	r.Get(path, func(w http.ResponseWriter, r *http.Request) {
		rctx := chi.RouteContext(r.Context())
		pathPrefix := strings.TrimSuffix(rctx.RoutePattern(), "/*")
		fs := http.StripPrefix(pathPrefix, http.FileServer(root))
		fs.ServeHTTP(w, r)
	})
}

func isValidAuthCookie(r *http.Request) bool {
	cookie, err := r.Cookie("auth")
	if err != nil {
		switch {
		case errors.Is(err, http.ErrNoCookie):
			log.Printf("Warning: auth cookie not found.\n")
		default:
			log.Printf("Warning: failed to get auth cookie: %v", err)
		}
		return false
	}

	isValid := isValidPassword(requiredPassword, cookie.Value)
	if !isValid {
		fmt.Printf("Warning: invalid auth cookie from %s: %s", r.RemoteAddr, cookie.Value)
	}

	return cookie != nil && isValid
}

func setAuthCookie(w http.ResponseWriter) {
	cookie := http.Cookie{
		Name:     "auth",
		Value:    hashPassword(requiredPassword),
		Path:     "/",
		MaxAge:   3600 * 24 * 365 * 5,
		HttpOnly: true,
		Secure:   false,
		SameSite: http.SameSiteLaxMode,
	}

	http.SetCookie(w, &cookie)
}

func hashPassword(plainText string) string {
	bytes, err := bcrypt.GenerateFromPassword([]byte(plainText), 4)
	if err != nil {
		log.Fatalf("failed to encrypt password: %v", err)
	}
	return string(bytes)
}

func isValidPassword(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}
