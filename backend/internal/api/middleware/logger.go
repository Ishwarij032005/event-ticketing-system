package middleware

import (
	"time"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
)

var log = logrus.New()

func init() {
	// Log as JSON instead of the default ASCII formatter.
	log.SetFormatter(&logrus.JSONFormatter{})
}

// Logger returns a gin.HandlerFunc (middleware) that logs requests using logrus.
func Logger() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Start timer
		startTime := time.Now()

		// Process request
		c.Next()

		// Execution time
		latency := time.Since(startTime)

		// Get request details
		status := c.Writer.Status()
		method := c.Request.Method
		path := c.Request.URL.Path
		clientIP := c.ClientIP()
		userAgent := c.Request.UserAgent()

		entry := log.WithFields(logrus.Fields{
			"status":     status,
			"method":     method,
			"path":       path,
			"ip":         clientIP,
			"latency":    latency.String(),
			"user-agent": userAgent,
		})

		if len(c.Errors) > 0 {
			entry.Error(c.Errors.String())
		} else {
			if status >= 400 && status < 500 {
				entry.Warn("Request completed with warning")
			} else if status >= 500 {
				entry.Error("Request completed with error")
			} else {
				entry.Info("Request completed successfully")
			}
		}
	}
}
