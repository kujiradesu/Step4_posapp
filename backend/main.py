from fastapi import FastAPI, HTTPException
import mysql.connector
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

origins = [
    "http://localhost:3000",  # フロントエンドのURLを追加
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MySQL接続設定
db_config = {
    'user': 'tech0gen7student',
    'password': 'vY7JZNfU',
    'host': 'tech0-db-step4-studentrdb-7.mysql.database.azure.com',
    'database': 'pos_app_kujira',
    'ssl_ca': '/path/to/DigiCertGlobalRootG2.crt.pem',
}

class Product(BaseModel):
    code: str
    name: str
    price: int

@app.get("/")
def read_root():
    return {"message": "Hello, FastAPI"}

@app.get("/search_product/{code}")
def search_product(code: str):
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)
        query = "SELECT * FROM product_master WHERE CODE = %s"
        cursor.execute(query, (code,))
        result = cursor.fetchone()
        cursor.close()
        conn.close()
        if result:
            return result
        else:
            raise HTTPException(status_code=404, detail="Product not found")
    except mysql.connector.Error as err:
        raise HTTPException(status_code=500, detail=str(err))

@app.post("/purchase")
def purchase(items: list[Product]):
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()
        for item in items:
            # ここに取引情報を挿入するロジックを追加
            pass
        cursor.close()
        conn.close()
        return {"status": "success"}
    except mysql.connector.Error as err:
        raise HTTPException(status_code=500, detail=str(err))
