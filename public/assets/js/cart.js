document.addEventListener("DOMContentLoaded", function () {
    const cartTableBody = document.querySelector("#cart-table tbody");
    const subtotalElement = document.querySelector("#subtotal");
    const grandTotalElement = document.querySelector("#grand-total");
    const donateButton = document.querySelector("#donate");
    const checkoutButton = document.querySelector(".checkout");
    let donationAmount = 0;
    let is_donated = false;

    async function fetchCart() {
        try {
            const response = await fetch('/api/user/cart');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const cart = await response.json();
            if (!cart || cart.length === 0) {
                cartTableBody.innerHTML = `<tr><td colspan="3" class="empty-cart">Your cart is empty.</td></tr>`;
                updateSummary(0);
                return;
            }

            let subtotal = 0;
            cartTableBody.innerHTML = "";

            for (const item of cart) {
                const { productName, quantity, category, image, price } = item;
                const pricePerUnit = price || 0;
                const itemTotal = pricePerUnit * quantity;
                subtotal += itemTotal;

                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>
                        <div class="product-info">
                            <img src="${image || 'https://via.placeholder.com/404'}" alt="${productName}">
                            <div>
                                <p class="product-name">${productName}</p>
                                <p class="product-details">Category: ${category}</p>
                            </div>
                        </div>
                    </td>
                    <td><span class="quantity">${quantity}</span></td>
                    <td>$${itemTotal.toFixed(2)}</td>
                `;
                cartTableBody.appendChild(row);
            }

            updateSummary(subtotal);
        } catch (error) {
            console.error("Error fetching cart:", error);
        }
    }

    function updateSummary(subtotal) {
        const grandTotal = subtotal + donationAmount;
        subtotalElement.textContent = `$${subtotal.toFixed(2)}`;
        grandTotalElement.textContent = `$${grandTotal.toFixed(2)}`;
    }

    donateButton.addEventListener("click", function () {
        if (is_donated === false) {
            donationAmount += 1;
            donateButton.classList.add("clicked");
        } else {
            donationAmount -= 1;
            donateButton.classList.remove("clicked");
        }

        is_donated = !is_donated;

        const subtotal = parseFloat(subtotalElement.textContent.replace('$', '')) || 0;
        updateSummary(subtotal);
    });

    checkoutButton.addEventListener("click", async function () {
        try {
            const response = await fetch('/api/user/cart/clear', {
                method: 'DELETE',
            });
            if (!response.ok) {
                throw new Error("Failed to clear cart on server");
            }


            if(is_donated)popup.innerHTML +=". Thank you For Your donation";
            popup.style.top = '0';
            setTimeout(() => {
                window.location.reload();
            }, 1500);

            
        } catch (error) {
            console.error("Error clearing cart:", error);
            alert("Failed to clear cart. Please try again.");
        }
    });

    fetchCart();
});
