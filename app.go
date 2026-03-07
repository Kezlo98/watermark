package main

import (
	"context"

	"watermark-01/internal/annotations"
	"watermark-01/internal/config"
	"watermark-01/internal/kafka"
	"watermark-01/internal/schema"
)

// App struct holds references to all services and the Wails runtime context.
type App struct {
	ctx           context.Context
	configSvc     *config.ConfigService
	kafkaSvc      *kafka.KafkaService
	schemaSvc     *schema.SchemaService
	annotationSvc *annotations.AnnotationService
}

// NewApp creates a new App application struct with all services.
func NewApp(c *config.ConfigService, k *kafka.KafkaService, s *schema.SchemaService, a *annotations.AnnotationService) *App {
	return &App{configSvc: c, kafkaSvc: k, schemaSvc: s, annotationSvc: a}
}

// startup is called when the Wails app starts. Passes context to services.
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	a.kafkaSvc.SetContext(ctx)
	a.schemaSvc.SetContext(ctx)
	a.annotationSvc.SetContext(ctx)

	// Auto-connect to last active cluster (non-blocking)
	if id := a.configSvc.GetActiveClusterID(); id != "" {
		go func() {
			if err := a.kafkaSvc.Connect(id); err == nil {
				a.schemaSvc.Configure(id)
			}
		}()
	}
}

// shutdown is called when the Wails app is closing. Cleans up connections.
func (a *App) shutdown(ctx context.Context) {
	a.kafkaSvc.Disconnect()
}
