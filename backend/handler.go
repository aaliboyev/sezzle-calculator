package main

import (
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"strings"
	"unicode/utf8"
)

const maxExpressionRunes = 1000

type calculateRequest struct {
	Expression *string `json:"expression"`
}

type apiError struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

func writeJSON(w http.ResponseWriter, status int, body any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(body)
}

func writeError(w http.ResponseWriter, status int, code, message string) {
	writeJSON(w, status, map[string]apiError{"error": {code, message}})
}

func decodeErrMessage(err error) string {
	var typeErr *json.UnmarshalTypeError
	var maxErr *http.MaxBytesError
	switch {
	case errors.As(err, &typeErr):
		return `"expression" must be a string`
	case errors.As(err, &maxErr):
		return "request body too large"
	case errors.Is(err, io.EOF):
		return "request body is empty"
	default:
		return `request body must be JSON: {"expression": "<string>"}`
	}
}

func handleCalculate(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.Header().Set("Allow", http.MethodPost)
		writeError(w, http.StatusMethodNotAllowed, "method_not_allowed", "use POST")
		return
	}
	r.Body = http.MaxBytesReader(w, r.Body, 64*1024)
	dec := json.NewDecoder(r.Body)
	dec.DisallowUnknownFields()
	var req calculateRequest
	if err := dec.Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_request", decodeErrMessage(err))
		return
	}
	if dec.More() {
		writeError(w, http.StatusBadRequest, "invalid_request", "request body has trailing data")
		return
	}
	if req.Expression == nil || strings.TrimSpace(*req.Expression) == "" {
		writeError(w, http.StatusBadRequest, "invalid_request", `"expression" is required and must be a non-empty string`)
		return
	}
	if utf8.RuneCountInString(*req.Expression) > maxExpressionRunes {
		writeError(w, http.StatusBadRequest, "invalid_request", "expression exceeds 1000 characters")
		return
	}
	result, err := Calculate(*req.Expression)
	if err != nil {
		var ce *calcError
		if errors.As(err, &ce) {
			writeError(w, http.StatusUnprocessableEntity, ce.code, ce.message)
			return
		}
		writeError(w, http.StatusInternalServerError, "internal", "internal error")
		return
	}
	writeJSON(w, http.StatusOK, map[string]float64{"result": result})
}
