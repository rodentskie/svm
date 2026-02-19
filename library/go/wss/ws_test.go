package wss

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gorilla/websocket"
)

func TestConnect(t *testing.T) {
	// Start a test WebSocket server
	upgrader := websocket.Upgrader{}
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			t.Fatalf("upgrade error: %v", err)
		}
		defer conn.Close()
	}))
	defer server.Close()

	// Convert http:// to ws://
	wsURL := "ws" + strings.TrimPrefix(server.URL, "http")

	client, err := Connect(wsURL)
	if err != nil {
		t.Fatalf("expected Connect to succeed, got error: %v", err)
	}
	defer client.Close()

	if !client.IsConnected() {
		t.Fatal("expected client to be connected")
	}
}

func TestConnectFailsInvalidURL(t *testing.T) {
	_, err := Connect("ws://invalid-host-that-does-not-exist-12345:9999/ws")
	if err == nil {
		t.Fatal("expected Connect to fail with invalid URL")
	}
}

func TestSendJSON(t *testing.T) {
	upgrader := websocket.Upgrader{}
	msgChan := make(chan string)

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			t.Fatalf("upgrade error: %v", err)
		}
		defer conn.Close()

		_, data, err := conn.ReadMessage()
		if err != nil {
			t.Fatalf("read error: %v", err)
		}
		msgChan <- string(data)
	}))
	defer server.Close()

	wsURL := "ws" + strings.TrimPrefix(server.URL, "http")

	client, err := Connect(wsURL)
	if err != nil {
		t.Fatalf("Connect failed: %v", err)
	}
	defer client.Close()

	type TestData struct {
		Message string `json:"message"`
		Value   int    `json:"value"`
	}

	testData := TestData{Message: "hello", Value: 42}
	err = client.SendJSON(testData)
	if err != nil {
		t.Fatalf("expected SendJSON to succeed, got error: %v", err)
	}

	receivedMsg := <-msgChan

	var decoded TestData
	err = json.Unmarshal([]byte(receivedMsg), &decoded)
	if err != nil {
		t.Fatalf("failed to unmarshal received message: %v", err)
	}

	if decoded.Message != testData.Message || decoded.Value != testData.Value {
		t.Fatalf("expected %v, got %v", testData, decoded)
	}
}

func TestSendJSONFailsWhenNotConnected(t *testing.T) {
	client := &Client{url: "ws://localhost:9999"}

	err := client.SendJSON(map[string]string{"test": "data"})
	if err == nil {
		t.Fatal("expected SendJSON to fail when not connected")
	}
}
