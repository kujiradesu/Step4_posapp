"use client";

import { useState } from 'react';
import axios from 'axios';

const Home = () => {
  const [code, setCode] = useState('');
  const [product, setProduct] = useState(null);
  const [cart, setCart] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [totalAmount, setTotalAmount] = useState(0);
  const [history, setHistory] = useState([]);

  const handleSearch = async () => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/search_product/${code}`);
      if (response.data) {
        setProduct({ ...response.data, quantity });
        setHistory([...history, code]); // 履歴に追加
      } else {
        setProduct({ NAME: '商品がマスタ未登録です', PRICE: 0, quantity: 1 });
      }
    } catch (error) {
      console.error('Error searching product:', error);
      setProduct({ NAME: '商品がマスタ未登録です', PRICE: 0, quantity: 1 });
    }
  };

  const handleAddToCart = () => {
    if (product && product.NAME !== '商品がマスタ未登録です') {
      const newCart = [...cart, product];
      setCart(newCart);
      setTotalAmount(newCart.reduce((sum, item) => sum + item.PRICE * item.quantity, 0));
      setProduct(null);
      setCode('');
      setQuantity(1);
    }
  };

  const handlePurchase = async () => {
    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/purchase`, {
        items: cart.map(item => ({
          code: item.code,
          NAME: item.NAME,
          PRICE: item.PRICE,
          quantity: item.quantity,
        })),
      });
      alert(`購入が成功しました。合計金額: ${totalAmount}円`);
      setCart([]);
      setTotalAmount(0);
    } catch (error) {
      console.error('Error making purchase:', error);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <input
            className="border p-2 w-full mb-2 text-black"
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="商品コード"
            list="history"
          />
          <datalist id="history">
            {history.map((item, index) => (
              <option key={index} value={item} />
            ))}
          </datalist>
          <button className="bg-blue-500 text-white p-2 w-full mb-2" onClick={handleSearch}>商品コード読み込み</button>

          {product && (
            <div className="mb-4">
              <input
                className="border p-2 w-full mb-2 text-black"
                type="text"
                value={product.NAME}
                readOnly
                placeholder="商品名"
              />
              <input
                className="border p-2 w-full mb-2 text-black"
                type="text"
                value={`${product.PRICE}円`}
                readOnly
                placeholder="金額"
              />
              <div className="mb-4 text-black">
                <label htmlFor="quantity" className="mr-2">数量:</label>
                <input
                  className="border p-2 w-16"
                  type="number"
                  id="quantity"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  min="1"
                />
              </div>
            </div>
          )}
          <button className="bg-blue-500 text-white p-2 w-full" onClick={handleAddToCart}>追加</button>
        </div>
        <div>
          <h2 className="text-xl font-bold mb-2">購入リスト</h2>
          <ul className="mb-4">
            {cart.map((item, index) => (
              <li key={index} className="border p-2 mb-2">
                {item.NAME} {item.PRICE}円 ×{item.quantity} {item.PRICE * item.quantity}円
              </li>
            ))}
          </ul>
          <p className="mb-4">合計金額: {totalAmount}円</p>
          <button className="bg-blue-500 text-white p-2 w-full" onClick={handlePurchase}>購入</button>
        </div>
      </div>
    </div>
  );
};

export default Home;
