package main

import (
	"testing"
	"time"
)

func TestHubBroadcastExcludesSender(t *testing.T) {
	hub := NewHub()
	go hub.Run()
	defer hub.Stop()

	sender := &Client{hub: hub, send: make(chan []byte, 1)}
	receiver := &Client{hub: hub, send: make(chan []byte, 1)}

	hub.register <- sender
	hub.register <- receiver

	payload := []byte("hello")
	hub.broadcast <- BroadcastMessage{sender: sender, data: payload}

	select {
	case got := <-receiver.send:
		if string(got) != string(payload) {
			t.Fatalf("expected %q, got %q", string(payload), string(got))
		}
	case <-time.After(500 * time.Millisecond):
		t.Fatal("receiver did not receive broadcast")
	}

	select {
	case <-sender.send:
		t.Fatal("sender should not receive its own message")
	case <-time.After(100 * time.Millisecond):
	}
}

func TestHubUnregisterClosesClientChannel(t *testing.T) {
	hub := NewHub()
	go hub.Run()
	defer hub.Stop()

	client := &Client{hub: hub, send: make(chan []byte, 1)}
	hub.register <- client
	hub.unregister <- client

	select {
	case _, ok := <-client.send:
		if ok {
			t.Fatal("expected client send channel to be closed")
		}
	case <-time.After(500 * time.Millisecond):
		t.Fatal("client send channel was not closed on unregister")
	}
}
