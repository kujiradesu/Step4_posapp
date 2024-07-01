from fastapi import FastAPI, HTTPException
import mysql.connector
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime

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
    quantity: int

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

        # 取引情報を挿入する
        total_amount = sum(item.price * item.quantity for item in items)
        query = """
            INSERT INTO transaction (DATETIME, EMP_CD, STORE_CD, POS_NO, TOTAL_AMT)
            VALUES (%s, %s, %s, %s, %s)
        """
        transaction_data = (datetime.now(), 'EMP001', 'STORE1', 'POS1', total_amount)
        cursor.execute(query, transaction_data)
        transaction_id = cursor.lastrowid

        # 取引詳細を挿入する
        for item in items:
            detail_query = """
                INSERT INTO transaction_details (TRD_ID, PRD_ID, PRD_CODE, PRD_NAME, PRD_PRICE)
                VALUES (%s, %s, %s, %s, %s)
            """
            product_query = "SELECT PRD_ID FROM product_master WHERE CODE = %s"
            cursor.execute(product_query, (item.code,))
            product_id = cursor.fetchone()['PRD_ID']
            detail_data = (transaction_id, product_id, item.code, item.name, item.price)
            cursor.execute(detail_query, detail_data)

        conn.commit()
        cursor.close()
        conn.close()
        return {"status": "success"}
    except mysql.connector.Error as err:
        raise HTTPException(status_code=500, detail=str(err))
    except Exception as e:
        raise HTTPException(status_code=422, detail=str(e))
