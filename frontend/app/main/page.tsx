"use client";

import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Webcam from 'react-webcam';
import jsQR from 'jsqr';

export default function Home() {
  const [code, setCode] = useState('');
  const [product, setProduct] = useState(null);
  const [cart, setCart] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [totalAmount, setTotalAmount] = useState(0);
  const [history, setHistory] = useState([]);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [intervalId, setIntervalId] = useState(null);
  const [purchaseHistory, setPurchaseHistory] = useState([]);
  const webcamRef = useRef(null);

  useEffect(() => {
    if (code) {
      handleSearch(code);
    }
  }, [code]);

  useEffect(() => {
    console.log("Current product:", product);
  }, [product]);

  const handleSearch = async (code) => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/search_product/${code}`);
      console.log("Backend response:", response.data);
      if (response.data) {
        setProduct({
          NAME: response.data.NAME || response.data.name,
          PRICE: response.data.PRICE || response.data.price,
          CODE: response.data.CODE || response.data.code,
          quantity: 1
        });
        setHistory((prevHistory) => [...prevHistory, code]);
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
      const newCart = [...cart, { ...product, quantity }];
      setCart(newCart);
      setTotalAmount(newCart.reduce((sum, item) => sum + item.PRICE * item.quantity, 0));
      setProduct(null);
      setCode('');
      setQuantity(1);
    }
  };

  const handlePurchase = async () => {
    try {
      const payload = {
        items: cart.map(item => ({
          code: item.CODE,
          name: item.NAME,
          price: item.PRICE,
          quantity: item.quantity,
        })),
      };
      console.log("Purchase payload:", payload);
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/purchase`, payload);
  
      const now = new Date();
      const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
  
      setPurchaseHistory([...purchaseHistory, { timestamp, items: cart, totalAmount }]);
  
      alert(`購入が成功しました。合計金額: ${totalAmount}円（税込）`);
      setCart([]);
      setTotalAmount(0);
    } catch (error) {
      console.error('Error making purchase:', error);
      alert('購入処理中にエラーが発生しました。');
    }
  };
  

  const handleClearCart = () => {
    setCart([]);
    setTotalAmount(0);
  };

  const handleScan = (data) => {
    if (data) {
      setCode(data);
      setIsCameraOpen(false); // バーコードを読み取ったらカメラを閉じる
    }
  };

  const handleError = (err) => {
    console.error(err);
  };

  const captureBarcode = () => {
    if (!webcamRef.current) return;
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;
    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, img.width, img.height);
      const imageData = ctx.getImageData(0, 0, img.width, img.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);
      if (code) {
        handleScan(code.data);
      }
    };
  };

  const toggleCamera = () => {
    if (isCameraOpen) {
      clearInterval(intervalId);
      setIntervalId(null);
      setIsCameraOpen(false);
    } else {
      setIsCameraOpen(true);
      const id = setInterval(captureBarcode, 1000);
      setIntervalId(id);
    }
  };

  return (
    <div className="container mx-auto p-4 min-h-screen bg-gray-100 flex flex-col justify-center items-center">
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-xl">
        <div className="flex justify-between mb-4">
          <input
            className="border p-2 w-full text-black rounded-l-md"
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="バーコードの読み取り"
            list="history"
          />
          <datalist id="history">
            {history.map((item, index) => (
              <option key={index} value={item} />
            ))}
          </datalist>
          <button 
            className="bg-blue-500 text-white px-4 py-2 rounded-r-md hover:bg-blue-600 transition duration-300"
            onClick={toggleCamera}
          >
            カメラでスキャン
          </button>
        </div>

        {isCameraOpen && (
          <div className="mb-4">
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              width={300}
              height={300}
            />
          </div>
        )}

        {product && (
          <div className="bg-gray-50 p-4 mb-4 rounded-md shadow-sm">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-black">{product.NAME}</span>
              <button onClick={() => setProduct(null)} className="text-red-500 hover:text-red-700">×</button>
            </div>
            <div className="mt-2 text-black">
              <span>価格: {product.PRICE}円</span>
            </div>
            <div className="mt-2 flex items-center">
              <label htmlFor="quantity" className="mr-2 text-black">数量:</label>
              <input
                type="number"
                id="quantity"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="border p-1 w-16 rounded-md text-black"
                min="1"
              />
            </div>
            <div className="flex justify-end mt-4">
              <button onClick={handleAddToCart} className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition duration-300">
                追加
              </button>
            </div>
          </div>
        )}

        <div className="bg-gray-50 p-4 mb-4 rounded-md shadow-sm">
          <h2 className="text-xl font-bold mb-2 text-black">購入リスト</h2>
          <div className="flex justify-between mb-2 font-semibold text-black">
            <span>商品情報</span>
            <span>点数</span>
          </div>
          <ul className="mb-4">
            {cart.map((item, index) => (
              <li key={index} className="flex justify-between mb-2 text-black">
                <span>{item.NAME}</span>
                <span>{item.quantity}点</span>
              </li>
            ))}
          </ul>
          <div className="flex justify-between mt-4 border-t pt-2 font-semibold text-black">
            <span>合計金額</span>
            <span>{totalAmount}円</span>
          </div>
        </div>

        <div className="flex justify-between">
          <button onClick={handleClearCart} className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition duration-300">
            リストから削除
          </button>
          <button onClick={handlePurchase} className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition duration-300">
            購入
          </button>
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-bold mb-2 text-black">購入履歴</h2>
          <ul className="mb-4">
            {purchaseHistory.map((purchase, index) => (
              <li key={index} className="mb-4 text-black">
                <div className="font-semibold">{purchase.timestamp}</div>
                <ul className="ml-4">
                  {purchase.items.map((item, idx) => (
                    <li key={idx}>
                      {item.NAME} - {item.quantity}点 - {item.PRICE * item.quantity}円
                    </li>
                  ))}
                </ul>
                <div className="font-semibold mt-2">合計金額: {purchase.totalAmount}円</div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
