package qr

import (
	"github.com/skip2/go-qrcode"
)

func GenerateQRCode(content string) ([]byte, error) {
	return qrcode.Encode(content, qrcode.Medium, 256)
}
