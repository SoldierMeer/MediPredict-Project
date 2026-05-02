from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import auth
from app.database import create_db_and_tables
from app.routes import auth, medications

app = FastAPI(title="MediPredict API")

# VERY IMPORTANT: This allows your React app (Vite) to talk to this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5173", "http://localhost:5173", "http://127.0.0.1:8080"],# Vite's default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(medications.router)

@app.get("/")
async def root():
    return {"status": "online", "message": "MediPredict Backend is Running"}

@app.on_event("startup")
def on_startup():
    create_db_and_tables()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)