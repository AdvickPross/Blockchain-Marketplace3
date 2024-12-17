import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import "./App.css";
import onlineShoppingImage from "./online-shopping.png"; // Import the image

function App() {
  const CONTRACT_ADDRESS = "0xa745b8121a89280cdd6d6cd36012907fbd2802c9";
  const ABI = [
    // Your ABI remains unchanged here
  ];

  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState("");
  const [items, setItems] = useState([]);
  const [isAuctionChecked, setIsAuctionChecked] = useState(false);
  const [isRentChecked, setIsRentChecked] = useState(false);
  const [useLogistics, setUseLogistics] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [images, setImages] = useState({}); // To store uploaded item images
  const [theme, setTheme] = useState("default");

  useEffect(() => {
    const init = async () => {
      if (typeof window.ethereum !== "undefined") {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        setProvider(provider);

        const accounts = await provider.send("eth_requestAccounts", []);
        setAccount(accounts[0]);

        const signer = provider.getSigner();
        setSigner(signer);

        const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
        setContract(contract);
        loadItems(contract);
      }
    };
    init();
  }, []);

  const loadItems = async (contract) => {
    const itemCount = await contract.itemCount();
    let items = [];
    for (let i = 1; i <= itemCount; i++) {
      const item = await contract.items(i);
      items.push(item);
    }
    setItems(items);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setSelectedImage(reader.result); // Store base64 string
      };
      reader.readAsDataURL(file);
    }
  };

  const listItem = async (
    name,
    price,
    isAuction,
    auctionDuration,
    isRent,
    rentalPrice,
    rentalDuration,
    useLogistics,
    logisticsPrice
  ) => {
    if (!selectedImage) {
      alert("Please upload an image for the item.");
      return;
    }
    const tx = await contract.listItem(
      name,
      ethers.utils.parseEther(price),
      isAuction,
      auctionDuration || 0,
      isRent,
      ethers.utils.parseEther(rentalPrice || "0"),
      rentalDuration || 0,
      useLogistics,
      ethers.utils.parseEther(logisticsPrice || "0")
    );
    await tx.wait();

    setImages((prevImages) => ({ ...prevImages, [items.length + 1]: selectedImage }));
    loadItems(contract);
    setSelectedImage(null);
  };

  const changeTheme = (event) => {
    setTheme(event.target.value);
    document.body.className = ""; // Reset existing theme
    document.body.classList.add(event.target.value); // Add the selected theme
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Elegora</h1>
        <h2>#BlockchainMarketplace</h2><img
          src={onlineShoppingImage}
          alt="Online Shopping"
        />
        <div className="theme-selector">
          <label>Choose Theme: </label>
          <select value={theme} onChange={changeTheme}>
            <option value="default">Default</option>
            <option value="dark">Dark</option>
            <option value="light">Light</option>
            <option value="pink">Pink</option>
          </select>
        </div>
      </header>

      <div className="list-item">
        <h2>List an Item</h2>
        <div className="form-group">
          <label>Item Name</label>
          <input id="itemName" placeholder="Enter item name" className="input-field" />
        </div>
        <div className="form-group">
          <label>Item Price (in ETH)</label>
          <input id="itemPrice" placeholder="Enter item price" className="input-field" />
        </div>
        <div className="form-group">
          <label>Upload Item Image</label>
          <input type="file" accept="image/*" onChange={handleImageChange} />
          {selectedImage && <img src={selectedImage} alt="Preview" className="image-preview" />}
        </div>
        <div className="form-group">
          <label>
            <input type="checkbox" onChange={(e) => setIsAuctionChecked(e.target.checked)} /> Auction
          </label>
          {isAuctionChecked && (
            <input id="auctionDuration" placeholder="Auction Duration (in seconds)" className="input-field" />
          )}
        </div>
        <div className="form-group">
          <label>
            <input type="checkbox" onChange={(e) => setIsRentChecked(e.target.checked)} /> Rent
          </label>
          {isRentChecked && (
            <>
              <input id="rentalPrice" placeholder="Rental Price (in ETH)" className="input-field" />
              <input id="rentalDuration" placeholder="Rental Duration (in seconds)" className="input-field" />
            </>
          )}
        </div>
        <div className="form-group">
          <label>
            <input type="checkbox" onChange={(e) => setUseLogistics(e.target.checked)} /> Include Logistics
          </label>
          {useLogistics && (
            <input id="logisticsPrice" placeholder="Sample Logistics Price (in ETH)" className="input-field" />
          )}
        </div>
        <button
          className="button"
          onClick={() =>
            listItem(
              document.getElementById("itemName").value,
              document.getElementById("itemPrice").value,
              isAuctionChecked,
              isAuctionChecked ? document.getElementById("auctionDuration").value : 0,
              isRentChecked,
              isRentChecked ? document.getElementById("rentalPrice").value : "0",
              isRentChecked ? document.getElementById("rentalDuration").value : 0,
              useLogistics,
              useLogistics ? document.getElementById("logisticsPrice").value : "0"
            )
          }
        >
          List Item
        </button>
      </div>

      <div className="items">
        <h2>Items for Sale</h2>
        {items.map((item) => (
          <div key={item.id} className="item-card">
            {images[item.id] && <img src={images[item.id]} alt={item.name} className="item-image" />}
            <h3>{item.name}</h3>
            <p>Price: {ethers.utils.formatEther(item.price)} ETH</p>
            {item.useLogistics && <p>Logistics Price: {ethers.utils.formatEther(item.logisticsPrice)} ETH</p>}
          </div>
        ))}
      </div>

      <footer className="App-footer">
        <p>Made by AAAS</p>
      </footer>
    </div>
  );
}

export default App;
