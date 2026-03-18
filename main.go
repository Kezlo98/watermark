package main

import (
	"embed"

	"watermark-01/internal/annotations"
	"watermark-01/internal/config"
	"watermark-01/internal/kafka"
	"watermark-01/internal/lagalert"
	"watermark-01/internal/schema"
	"watermark-01/internal/templates"
	"watermark-01/internal/updater"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
)

// version is injected at build time via: -ldflags "-X main.version=vX.Y.Z"
var version = "dev"

//go:embed all:frontend/dist
var assets embed.FS

func main() {
	// Initialize config service (loads key + config from ~/.watermark/)
	configSvc, err := config.NewConfigService()
	if err != nil {
		println("Config error:", err.Error())
		return
	}

	kafkaSvc := kafka.NewKafkaService(configSvc)
	schemaSvc := schema.NewSchemaService(configSvc)

	annotationSvc, err := annotations.NewAnnotationService(configSvc.GetConfigDir())
	if err != nil {
		println("Annotations error:", err.Error())
		return
	}

	updaterSvc := updater.NewUpdaterService(version)
	lagAlertSvc := lagalert.NewLagAlertService(kafkaSvc, configSvc.GetConfigDir())

	templateSvc, err := templates.NewTemplateService(configSvc.GetConfigDir())
	if err != nil {
		println("Templates error:", err.Error())
		return
	}

	app := NewApp(configSvc, kafkaSvc, schemaSvc, annotationSvc, updaterSvc, lagAlertSvc, templateSvc)

	err = wails.Run(&options.App{
		Title:  "Watermark",
		Width:  1280,
		Height: 800,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		BackgroundColour: &options.RGBA{R: 10, G: 10, B: 15, A: 1},
		OnStartup:        app.startup,
		OnShutdown:       app.shutdown,
		Bind: []interface{}{
			app,
			configSvc,
			kafkaSvc,
			schemaSvc,
			annotationSvc,
			updaterSvc,
			lagAlertSvc,
			templateSvc,
		},
	})

	if err != nil {
		println("Error:", err.Error())
	}
}
