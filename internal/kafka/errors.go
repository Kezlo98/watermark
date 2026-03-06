package kafka

import "errors"

var (
	// ErrNotConnected is returned when an operation requires an active Kafka connection.
	ErrNotConnected = errors.New("not connected to any cluster")

	// ErrAlreadyConnected is returned when trying to connect while already connected.
	ErrAlreadyConnected = errors.New("already connected — disconnect first")

	// ErrTopicNotFound is returned when a requested topic does not exist.
	ErrTopicNotFound = errors.New("topic not found")

	// ErrGroupNotFound is returned when a requested consumer group does not exist.
	ErrGroupNotFound = errors.New("consumer group not found")

	// ErrGroupActive is returned when trying to reset offsets for an active group.
	ErrGroupActive = errors.New("cannot reset offsets: group is active")

	// ErrReadOnly is returned when a write operation is attempted on a read-only cluster.
	ErrReadOnly = errors.New("cluster is read-only")
)

// AppError is a structured error returned to frontend via Wails IPC.
type AppError struct {
	Code    string `json:"code"`
	Message string `json:"message"`
	Detail  string `json:"detail,omitempty"`
}

// Error implements the error interface.
func (e *AppError) Error() string { return e.Message }
