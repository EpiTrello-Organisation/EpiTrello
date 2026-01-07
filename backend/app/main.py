from fastapi import FastAPI

from app.api.router import api_router

app = FastAPI(title="Trello Clone API")

app.include_router(api_router)


@app.get("/")
def read_root():
    return {"message": "Welcome to the Trello Clone API!"}
