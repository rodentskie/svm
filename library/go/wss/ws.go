package wss

import (
	"encoding/json"
	"fmt"
	"library/go/logger"
	"sync"

	"github.com/gorilla/websocket"
	"go.uber.org/zap"
)

var wsLogger = logger.NewLogger("wss")

// Client represents a WebSocket client connection.
type Client struct {
	url  string
	conn *websocket.Conn
	mu   sync.Mutex
}

// Connect establishes a WebSocket connection to the server.
// serverURL should be in the format ws://host:port/path
func Connect(serverURL string) (*Client, error) {
	dialer := websocket.Dialer{}
	conn, _, err := dialer.Dial(serverURL, nil)
	if err != nil {
		wsLogger.Error("failed to connect to websocket server", zap.String("url", serverURL), zap.Error(err))
		return nil, fmt.Errorf("websocket dial failed: %w", err)
	}

	wsLogger.Info("connected to websocket server", zap.String("url", serverURL))
	return &Client{
		url:  serverURL,
		conn: conn,
	}, nil
}

// SendJSON sends a JSON-marshaled object to the server.
func (c *Client) SendJSON(v any) error {
	if c.conn == nil {
		wsLogger.Error("connection is nil, cannot send")
		return fmt.Errorf("websocket connection is nil")
	}

	data, err := json.Marshal(v)
	if err != nil {
		wsLogger.Error("failed to marshal JSON", zap.Error(err))
		return fmt.Errorf("json marshal failed: %w", err)
	}

	c.mu.Lock()
	defer c.mu.Unlock()

	if err := c.conn.WriteMessage(websocket.TextMessage, data); err != nil {
		wsLogger.Error("failed to send message", zap.Error(err))
		return fmt.Errorf("websocket write failed: %w", err)
	}

	wsLogger.Debug("message sent", zap.ByteString("data", data))
	return nil
}

// Close closes the WebSocket connection.
func (c *Client) Close() error {
	if c.conn == nil {
		return nil
	}

	wsLogger.Info("closing websocket connection")
	return c.conn.Close()
}

// IsConnected checks if the client is still connected.
func (c *Client) IsConnected() bool {
	return c.conn != nil
}
