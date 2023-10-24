package shopping_list

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"os"
	"strings"
)

type AppConfig struct {
	Password       string   `json:"password"`
	AllowedOrigins []string `json:"allowed_origins"`
}

func LoadAppConfig() (AppConfig, error) {
	appConfig := AppConfig{}
	jsonFile, err := os.Open("config.json")
	if err != nil {
		return appConfig, fmt.Errorf("failed to open config.json: %w", err)
	}

	byteVal, err := ioutil.ReadAll(jsonFile)
	if err != nil {
		return appConfig, fmt.Errorf("failed to read config.json: %w", err)
	}

	err = json.Unmarshal(byteVal, &appConfig)
	if err != nil {
		return appConfig, fmt.Errorf("failed to unmarshal app config: %w", err)
	}

	return appConfig, nil
}

func (c *AppConfig) IsValidOrigin(r *http.Request) bool {
	origin := r.Header.Get("Origin")
	for _, o := range c.AllowedOrigins {
		if origin == o {
			return true
		}
	}
	fmt.Printf("Warning: invalid origin detected from %s. Origin: %s. Allowed values: [ %s ]\n", r.RemoteAddr, origin, strings.Join(c.AllowedOrigins, ", "))
	return false
}
