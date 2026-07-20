// Generated from openapi.json by generate-openapi-runtime.ts. Do not edit directly.
export const openApiDocument = {
	"openapi": "3.1.0",
	"info": {
		"title": "API Express",
		"version": "0.0.1"
	},
	"components": {
		"schemas": {
			"GreetResponse": {
				"type": "object",
				"properties": {
					"message": {
						"type": "string",
						"example": "Hello, Builder!"
					}
				},
				"required": [
					"message"
				]
			},
			"ErrorResponse": {
				"type": "object",
				"properties": {
					"type": {
						"type": "string",
						"example": "about:blank"
					},
					"title": {
						"type": "string",
						"example": "Bad Request"
					},
					"status": {
						"type": "integer",
						"example": 400
					},
					"detail": {
						"type": "string",
						"example": "The request could not be validated"
					},
					"instance": {
						"type": "string",
						"example": "/v1/greet"
					},
					"code": {
						"type": "string",
						"example": "#ERR_VALIDATION_FAILED"
					},
					"errors": {
						"type": "array",
						"items": {
							"$ref": "#/components/schemas/ErrorDetail"
						}
					}
				},
				"required": [
					"type",
					"title",
					"status",
					"detail",
					"instance",
					"code"
				]
			},
			"ErrorDetail": {
				"type": "object",
				"properties": {
					"source": {
						"type": "string",
						"enum": [
							"body",
							"path",
							"query",
							"header",
							"cookie"
						],
						"example": "query"
					},
					"path": {
						"type": "array",
						"items": {
							"anyOf": [
								{
									"type": "string"
								},
								{
									"type": "number"
								}
							]
						},
						"example": [
							"name"
						]
					},
					"detail": {
						"type": "string",
						"example": "String must contain at least 1 character"
					}
				},
				"required": [
					"source",
					"path",
					"detail"
				]
			},
			"HealthResponse": {
				"type": "object",
				"properties": {
					"status": {
						"type": "string",
						"enum": [
							"ok"
						],
						"example": "ok"
					},
					"version": {
						"type": "string",
						"example": "0.0.1d"
					}
				},
				"required": [
					"status",
					"version"
				]
			}
		}
	},
	"paths": {
		"/v1/greet": {
			"get": {
				"tags": [
					"greet"
				],
				"summary": "Create a greeting",
				"operationId": "greet",
				"parameters": [
					{
						"schema": {
							"type": "string",
							"minLength": 1,
							"default": "Builder",
							"example": "Builder"
						},
						"required": false,
						"name": "name",
						"in": "query"
					}
				],
				"responses": {
					"200": {
						"description": "A greeting",
						"content": {
							"application/json": {
								"schema": {
									"$ref": "#/components/schemas/GreetResponse"
								}
							}
						}
					},
					"400": {
						"description": "The greeting request is invalid",
						"content": {
							"application/problem+json": {
								"schema": {
									"$ref": "#/components/schemas/ErrorResponse"
								}
							}
						}
					},
					"500": {
						"description": "The API could not create the greeting",
						"content": {
							"application/problem+json": {
								"schema": {
									"$ref": "#/components/schemas/ErrorResponse"
								}
							}
						}
					}
				}
			}
		},
		"/v1/health": {
			"get": {
				"tags": [
					"health"
				],
				"summary": "Check API health",
				"operationId": "checkHealth",
				"responses": {
					"200": {
						"description": "The API is healthy",
						"content": {
							"application/json": {
								"schema": {
									"$ref": "#/components/schemas/HealthResponse"
								}
							}
						}
					},
					"500": {
						"description": "The API could not complete the health check",
						"content": {
							"application/problem+json": {
								"schema": {
									"$ref": "#/components/schemas/ErrorResponse"
								}
							}
						}
					}
				}
			}
		}
	},
	"webhooks": {}
} as const;
