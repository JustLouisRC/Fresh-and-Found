document.addEventListener("DOMContentLoaded", function () {
    const pageType = document.body.getAttribute("data-page-type"); // Get the page type (vegan or non-vegan)

    // Fetch products from the server
    fetch("/api/data")
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            const productGrid = document.getElementById("product-grid");
            const products = data.filter(product => product.isVegan === (pageType === "vegan"));

            products.forEach(product => {
                const card = document.createElement("div");
                card.classList.add("card");

                const priceArr = Object.values(product.types);
                card.innerHTML = `
                    <img src="${product.images || 'https://via.placeholder.com/300x200?text=No+Image'}" alt="${product.name}">
                    <div class="card-content">
                        <h2>${product.name}</h2>
                        <div class="price">
                            $${Math.min(...priceArr).toFixed(2)}${Math.min(...priceArr) !== Math.max(...priceArr) ? `-${Math.max(...priceArr).toFixed(2)}` : ''} 
                            <span> /${product.unit} </span>
                        </div>
                        <a href="#" class="button primary solid open-popup-button" id="cart-button-${product._id}">
                            <i class="fa-solid fa-basket-shopping">&emsp;</i>Add to Cart
                        </a>
                        <p>${product.description || 'No description available.'}</p>
                    </div>
                `;
                productGrid.appendChild(card);

                // Attach event listener to the Add to Cart button
                const openPopupBtn = document.getElementById(`cart-button-${product._id}`);
                if (openPopupBtn) {
                    openPopupBtn.addEventListener("click", (event) => {
                        event.preventDefault(); // Prevent default link behavior
                        showPopup(product);  // Show the popup for the clicked product
                    });
                }
            });
        })
        .catch(error => {
            console.error("Error fetching products:", error);
        });
});

// Show the popup with product details
function showPopup(product) {
    const popup = document.getElementById("popup");
    const popupImage = document.getElementById("popup-image");
    const popupTitle = document.getElementById("popup-title");
    const popupPrice = document.getElementById("popup-price");
    const popupDescription = document.getElementById("popup-description");
    const popupProducer = document.getElementById("popup-producer");

    const typeBtnsContainer = document.querySelector(".product-types");
    const increaseQuantityBtn = document.getElementById("increaseQuantity");
    const decreaseQuantityBtn = document.getElementById("decreaseQuantity");
    const quantityDisplay = document.getElementById("quantityDisplay");
    const addToCartBtn = document.getElementById("addToCartBtn");

    let quantity = 1;
    let selectedType = Object.keys(product.types)[0];

    function updatePriceAndType() {
        const pricePerUnit = product.types[selectedType];
        const totalPrice = pricePerUnit * quantity;
        popupPrice.textContent = `$${totalPrice.toFixed(2)}`;

        const activeBtn = document.querySelector(".type-btn.active");
        if (activeBtn) activeBtn.classList.remove("active");
        const selectedBtn = document.querySelector(`.type-btn[data-size="${selectedType}"]`);
        if (selectedBtn) selectedBtn.classList.add("active");
    }

    // Clear the previous types and update the type buttons
    typeBtnsContainer.innerHTML = '';
    Object.keys(product.types).forEach(type => {
        const typeBtn = document.createElement("button");
        typeBtn.classList.add("type-btn");
        typeBtn.setAttribute("data-size", type);
        typeBtn.textContent = type;

        typeBtn.addEventListener("click", () => {
            selectedType = type;
            updatePriceAndType();
        });

        typeBtnsContainer.appendChild(typeBtn);
    });

    if (popup && popupImage && popupTitle && popupPrice && popupDescription && popupProducer) {
        popupImage.src = product.images || "https://via.placeholder.com/300x200?text=No+Image";
        popupTitle.textContent = product.name;
        popupProducer.textContent = product.producer_name || "General";
        popupDescription.textContent = product.description || "No description available.";

        updatePriceAndType();

        // Update quantity and price display
        function updateQuantityDisplay() {
            quantityDisplay.textContent = quantity;
            decreaseQuantityBtn.disabled = quantity <= 1;
            updatePriceAndType();
        }
        updateQuantityDisplay();

        if (increaseQuantityBtn) {
            increaseQuantityBtn.addEventListener("click", () => {
                quantity += 1;
                updateQuantityDisplay();
            });
        }

        if (decreaseQuantityBtn) {
            decreaseQuantityBtn.addEventListener("click", () => {
                if (quantity > 1) quantity -= 1;
                updateQuantityDisplay();
            });
        }

        // Add to Cart button listener
        if (addToCartBtn) {
            addToCartBtn.addEventListener("click", () => {
                const cartItem = {
                    productId: product._id,
                    productName: product.name,
                    category: selectedType,
                    quantity: quantity,
                    price: product.types[selectedType] * quantity,
                    image : product.images,
                };

                console.log(cartItem);

                fetch('/api/user/cart', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(cartItem),
                })
                    .then(response => {
                        if (!response.ok) {
                            throw new Error('Failed to add item to cart');
                        }
                        return response.json();
                    })
                    .then(data => {
                        alert(`Successfully added ${quantity} item(s) of ${product.name} (${selectedType}) to the cart.`);
                        window.location.reload();
                        popup.style.display = "none";
                    })
                    .catch(error => {
                        console.error("Error adding item to cart:", error);
                        alert("Could not add item to cart. Please try again.");
                    });
            });
        }

        togglePopup(popup, "block");
    }
}

function togglePopup(element, display) {
    if (element) {
        element.style.display = display;
    }
}

const closePopupBtn = document.getElementById("closePopup");
if (closePopupBtn) {
    closePopupBtn.addEventListener("click", () => {
        const popup = document.getElementById("popup");
        togglePopup(popup, "none");
    });
}
