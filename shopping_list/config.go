package shopping_list

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"os"
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

func (c *AppConfig) IsValidOrigin(origin string) bool {
	for _, o := range c.AllowedOrigins {
		if origin == o {
			return true
		}
	}
	return false
}
