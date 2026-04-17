# API Testing Guide

Test all endpoints using curl commands or import into Postman/Insomnia.

## Base URL
```
http://localhost:5000
```

## 1. Health Check

Test if the server is running:

```bash
curl http://localhost:5000/api/health
```

Expected Response:
```json
{
  "status": "ok",
  "timestamp": "2026-04-07T10:30:00.000Z"
}
```

---

## 2. Interview Bot - Chat

Test the interview conversation:

```bash
curl -X POST http://localhost:5000/api/interview/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {
        "role": "assistant",
        "content": "What is your name?"
      },
      {
        "role": "user",
        "content": "My name is John Doe"
      }
    ],
    "conversationHistory": [
      {
        "role": "assistant",
        "content": "What is your name?"
      },
      {
        "role": "user",
        "content": "My name is John Doe"
      }
    ]
  }'
```

Expected Response:
```json
{
  "message": "Great to meet you, John! What's your employee ID?",
  "interviewComplete": false
}
```

---

## 3. Interview Bot - Generate Summary

Test summary generation (requires a complete conversation):

```bash
curl -X POST http://localhost:5000/api/interview/generate-summary \
  -H "Content-Type: application/json" \
  -d '{
    "conversationHistory": [
      {
        "role": "assistant",
        "content": "What is your name?"
      },
      {
        "role": "user",
        "content": "John Doe"
      },
      {
        "role": "assistant",
        "content": "What is your job title?"
      },
      {
        "role": "user",
        "content": "Senior Software Engineer"
      },
      {
        "role": "assistant",
        "content": "What team are you on?"
      },
      {
        "role": "user",
        "content": "Platform Engineering"
      },
      {
        "role": "assistant",
        "content": "What is your nationality?"
      },
      {
        "role": "user",
        "content": "USA"
      },
      {
        "role": "assistant",
        "content": "When did you join?"
      },
      {
        "role": "user",
        "content": "January 2022"
      },
      {
        "role": "assistant",
        "content": "What is your personal motto?"
      },
      {
        "role": "user",
        "content": "Innovation through collaboration"
      }
    ]
  }'
```

Expected Response:
```json
{
  "summary": {
    "basicInfo": {
      "name": "John Doe",
      "employeeId": "EMP001",
      "jobTitle": "Senior Software Engineer",
      "team": "Platform Engineering",
      "nationality": "USA",
      "joinTime": "January 2022",
      "personalMotto": "Innovation through collaboration"
    },
    "highlightedQuotes": [...],
    "personalStory": "...",
    "culturalInsights": "...",
    "workPhilosophy": "...",
    "aiUsage": "...",
    "keyTags": [...],
    "summary": "..."
  }
}
```

---

## 4. Digital Persona - Initialize

Initialize the persona with interview data:

```bash
curl -X POST http://localhost:5000/api/persona/initialize \
  -H "Content-Type: application/json" \
  -d '{
    "interviewData": {
      "basicInfo": {
        "name": "John Doe",
        "employeeId": "EMP001",
        "jobTitle": "Senior Software Engineer",
        "team": "Platform Engineering",
        "nationality": "USA",
        "joinTime": "January 2022",
        "personalMotto": "Innovation through collaboration"
      },
      "personalStory": "John has been leading major infrastructure projects...",
      "culturalInsights": "Working in a global team has taught me...",
      "workPhilosophy": "I believe in continuous learning and collaboration...",
      "aiUsage": "I use AI daily for code reviews and documentation...",
      "keyTags": ["Leadership", "Innovation", "AI", "Collaboration"],
      "summary": "John is a passionate engineer who believes in the power of teamwork..."
    }
  }'
```

Expected Response:
```json
{
  "success": true,
  "personaId": "EMP001"
}
```

---

## 5. Digital Persona - Chat

Chat with the initialized persona:

```bash
curl -X POST http://localhost:5000/api/persona/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is your biggest achievement?",
    "conversationHistory": [
      {
        "role": "assistant",
        "content": "Hi! I'\''m John Doe'\''s digital persona. What would you like to know?"
      },
      {
        "role": "user",
        "content": "What is your biggest achievement?"
      }
    ],
    "interviewData": {
      "basicInfo": {
        "name": "John Doe",
        "employeeId": "EMP001",
        "jobTitle": "Senior Software Engineer",
        "team": "Platform Engineering",
        "nationality": "USA",
        "joinTime": "January 2022",
        "personalMotto": "Innovation through collaboration"
      },
      "personalStory": "John has been leading major infrastructure projects...",
      "summary": "John is passionate about engineering excellence..."
    }
  }'
```

Expected Response:
```json
{
  "message": "My biggest achievement has been leading the platform migration project. It was a massive undertaking that required coordination across multiple teams, but we successfully migrated all services with zero downtime. The experience taught me a lot about leadership and the importance of clear communication."
}
```

---

## Postman Collection

Import this JSON into Postman:

```json
{
  "info": {
    "name": "Employee Culture Platform API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Health Check",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "http://localhost:5000/api/health",
          "protocol": "http",
          "host": ["localhost"],
          "port": "5000",
          "path": ["api", "health"]
        }
      }
    },
    {
      "name": "Interview Chat",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"messages\": [\n    {\"role\": \"user\", \"content\": \"My name is John\"}\n  ],\n  \"conversationHistory\": [\n    {\"role\": \"user\", \"content\": \"My name is John\"}\n  ]\n}"
        },
        "url": {
          "raw": "http://localhost:5000/api/interview/chat",
          "protocol": "http",
          "host": ["localhost"],
          "port": "5000",
          "path": ["api", "interview", "chat"]
        }
      }
    },
    {
      "name": "Generate Summary",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"conversationHistory\": []\n}"
        },
        "url": {
          "raw": "http://localhost:5000/api/interview/generate-summary",
          "protocol": "http",
          "host": ["localhost"],
          "port": "5000",
          "path": ["api", "interview", "generate-summary"]
        }
      }
    },
    {
      "name": "Initialize Persona",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"interviewData\": {}\n}"
        },
        "url": {
          "raw": "http://localhost:5000/api/persona/initialize",
          "protocol": "http",
          "host": ["localhost"],
          "port": "5000",
          "path": ["api", "persona", "initialize"]
        }
      }
    },
    {
      "name": "Persona Chat",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"message\": \"What is your role?\",\n  \"conversationHistory\": [],\n  \"interviewData\": {}\n}"
        },
        "url": {
          "raw": "http://localhost:5000/api/persona/chat",
          "protocol": "http",
          "host": ["localhost"],
          "port": "5000",
          "path": ["api", "persona", "chat"]
        }
      }
    }
  ]
}
```

---

## Error Responses

All endpoints may return these error formats:

### 500 Internal Server Error
```json
{
  "error": "Failed to process request",
  "details": "Error message here"
}
```

### 400 Bad Request
```json
{
  "error": "Invalid request format",
  "message": "Missing required fields"
}
```

---

## Testing Tips

1. **Start Simple:** Test health check first
2. **Check Logs:** Watch server terminal for error messages
3. **Verify API Key:** Ensure OpenAI key is set in `.env`
4. **Use Variables:** In Postman, use environment variables for base URL
5. **Save Responses:** Keep successful responses for reference

---

## Automated Testing

Create a test script `test-api.sh`:

```bash
#!/bin/bash

echo "Testing Health Check..."
curl -s http://localhost:5000/api/health | jq

echo "\nTesting Interview Chat..."
curl -s -X POST http://localhost:5000/api/interview/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Test"}],"conversationHistory":[{"role":"user","content":"Test"}]}' \
  | jq

echo "\nAll tests completed!"
```

Run with:
```bash
chmod +x test-api.sh
./test-api.sh
```

---

## Performance Testing

Test response times:

```bash
# Measure response time
time curl -s http://localhost:5000/api/health > /dev/null

# Load test with Apache Bench (if installed)
ab -n 100 -c 10 http://localhost:5000/api/health
```

---

**Last Updated:** 2026-04-07
