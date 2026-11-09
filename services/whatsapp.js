const axios = require("axios");
require("dotenv").config();

async function sendWelcomeMessage(to) {
    try {
        const response = await axios.post(
            `https://graph.facebook.com/v25.0/${process.env.PHONE_NUMBER_ID}/messages`,
            {
                messaging_product: "whatsapp",
                recipient_type: "individual",
                to: to,
                type: "interactive",
                interactive: {
                    type: "button",
                    body: {
                        text: `Welcome to the Skill Tech chatbot. Visit our website: https://skilltechonline.com/

If you want to know about product enquiry, use the Product Enquiry button below. I'm your AI Assistant, ready to assist you with product information.`
                    },
                    action: {
                        buttons: [
                            {
                                type: "reply",
                                reply: {
                                    id: "btn_products",
                                    title: "📦 Product Enquiry"
                                }
                            }
                        ]
                    }
                }
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
                    "Content-Type": "application/json"
                }
            }
        );

        console.log("✅ Message Sent:", response.data);
        return response.data;

    } catch (err) {
        console.error("❌ Error sending welcome message");
        console.error("Status:", err.response?.status);
        console.error(
            "Response:",
            JSON.stringify(err.response?.data, null, 2)
        );
    }
}

async function sendProductsMessage(to) {
    try {
        const response = await axios.post(
            `https://graph.facebook.com/v25.0/${process.env.PHONE_NUMBER_ID}/messages`,
            {
                messaging_product: "whatsapp",
                recipient_type: "individual",
                to: to,
                type: "interactive",
                interactive: {
                    type: "button",
                    body: {
                        text: "I'll help you find the best product for your needs.\n\nAre you interested in:"
                    },
                    action: {
                        buttons: [
                            {
                                type: "reply",
                                reply: {
                                    id: "btn_wholesale",
                                    title: "🏢 Wholesale (Bulk)"
                                }
                            },
                            {
                                type: "reply",
                                reply: {
                                    id: "btn_retail",
                                    title: "🛍️ Retail (Indiv)"
                                }
                            }
                        ]
                    }
                }
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
                    "Content-Type": "application/json"
                }
            }
        );

        console.log("✅ Products Message Sent:", response.data);
        return response.data;

    } catch (err) {
        console.error("❌ Error sending products message");
        console.error("Status:", err.response?.status);
        console.error(
            "Response:",
            JSON.stringify(err.response?.data, null, 2)
        );
    }
}

async function sendProductDetailsMessage(to, product) {
    try {
        const baseUrl = process.env.MEDIA_BASE_URL || process.env.PUBLIC_URL;
        let messageText = `*${product.name}*\n`;
        messageText += `SKU: ${product.sku}\n`;
        const toTitleCase = (slug) => {
            if (!slug) return '';
            return slug.split('-').map(w => w.toUpperCase() === 'TV' ? 'TV' : w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        };

        if (product.screen_size) messageText += `Screen Size: ${product.screen_size}\n`;
        if (product.weight_capacity) messageText += `Weight Capacity: ${product.weight_capacity}\n`;
        if (product.max_vesa) messageText += `Max VESA: ${product.max_vesa}\n`;

        let categoryDisplay = '';
        if (product.slug_path) {
            const parts = product.slug_path.split('/');
            if (parts.length >= 3) {
                categoryDisplay = `${toTitleCase(parts[0])} > ${toTitleCase(parts[1])}`;
            } else if (parts.length === 2) {
                categoryDisplay = `${toTitleCase(parts[0])}`;
            }
        }
        if (!categoryDisplay && product.mainCategory) {
            categoryDisplay = `${product.mainCategory} > ${product.subCategory}`;
        }

        if (categoryDisplay) {
            messageText += `Category: ${categoryDisplay}\n`;
        }
        
        if (product.slug_path) {
            const websiteUrl = `https://skilltechonline.com/${product.slug_path}`;
            messageText += `View on Website: ${websiteUrl}\n`;
        } else if (product.productSlug) {
            let websiteUrl = 'https://skilltechonline.com/';
            if (product.mainCategorySlug && product.subCategorySlug) {
                websiteUrl += `${product.mainCategorySlug}/${product.subCategorySlug}/${product.productSlug}`;
            } else if (product.subCategorySlug) {
                websiteUrl += `${product.subCategorySlug}/${product.productSlug}`;
            } else {
                websiteUrl += `product/${product.productSlug}`;
            }
            messageText += `View on Website: ${websiteUrl}\n`;
        }

        const buttons = [];
        if (product.data_sheet_url) {
            buttons.push({
                type: "reply",
                reply: { id: `dl_doc_${product.id}`, title: "📄 Data Sheet" }
            });
        }
        
        buttons.push({
            type: "reply",
            reply: { id: `more_opts_${product.id}`, title: "View Options" }
        });
        
        let payload;
        
        // Check if there is an image, and if it is a WebP image
        const hasImage = !!product.image_url;
        const isWebp = hasImage && product.image_url.toLowerCase().includes('.webp');

        if (buttons.length > 0) {
            if (hasImage) {
                let fullUrl = `${baseUrl}/${product.image_url}`.replace(/([^:]\/)\/+/g, "$1");
                
                // WhatsApp API does not support .webp images directly.
                // We use a fast, free image proxy (wsrv.nl) to instantly convert it to .jpg on the fly!
                if (isWebp) {
                    fullUrl = `https://wsrv.nl/?url=${encodeURIComponent(fullUrl)}&output=jpg`;
                }

                payload = {
                    messaging_product: "whatsapp",
                    recipient_type: "individual",
                    to: to,
                    type: "interactive",
                    interactive: {
                        type: "button",
                        header: {
                            type: "image",
                            image: { link: fullUrl }
                        },
                        body: { text: messageText },
                        action: { buttons: buttons }
                    }
                };
            } else {
                payload = {
                    messaging_product: "whatsapp",
                    recipient_type: "individual",
                    to: to,
                    type: "interactive",
                    interactive: {
                        type: "button",
                        body: { text: messageText },
                        action: { buttons: buttons }
                    }
                };
            }
        } else {
            // No buttons to show
            if (hasImage) {
                let fullUrl = `${baseUrl}/${product.image_url}`.replace(/([^:]\/)\/+/g, "$1");
                
                if (isWebp) {
                    fullUrl = `https://wsrv.nl/?url=${encodeURIComponent(fullUrl)}&output=jpg`;
                }

                payload = {
                    messaging_product: "whatsapp",
                    recipient_type: "individual",
                    to: to,
                    type: "image",
                    image: {
                        link: fullUrl,
                        caption: messageText
                    }
                };
            } else {
                payload = {
                    messaging_product: "whatsapp",
                    recipient_type: "individual",
                    to: to,
                    type: "text",
                    text: { body: messageText }
                };
            }
        }

        const response = await axios.post(
            `https://graph.facebook.com/v25.0/${process.env.PHONE_NUMBER_ID}/messages`,
            payload,
            {
                headers: {
                    Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
                    "Content-Type": "application/json"
                }
            }
        );

        console.log("✅ Product Message Sent:", response.data);
        return response.data;

    } catch (err) {
        console.error("❌ Error sending product message:", err.message);
        console.error("Response:", JSON.stringify(err.response?.data, null, 2));

        // Fallback: If WhatsApp rejected the message (often due to an invalid/404 image URL),
        // we can attempt to send it again WITHOUT the image header.
        if (err.response?.status === 400 && product.image_url) {
            console.log("⚠️ Retrying product message without image...");
            try {
                // Re-build payload without the image
                const fallbackPayload = {
                    messaging_product: "whatsapp",
                    recipient_type: "individual",
                    to: to,
                    type: "interactive",
                    interactive: {
                        type: "button",
                        body: { text: messageText },
                        action: { buttons: buttons }
                    }
                };
                
                const retryResponse = await axios.post(
                    `https://graph.facebook.com/v25.0/${process.env.PHONE_NUMBER_ID}/messages`,
                    fallbackPayload,
                    {
                        headers: {
                            Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
                            "Content-Type": "application/json"
                        }
                    }
                );
                console.log("✅ Fallback Product Message Sent:", retryResponse.data);
                return retryResponse.data;
            } catch (retryErr) {
                console.error("❌ Fallback also failed:", retryErr.message);
            }
        }
    }
}

async function sendProductMedia(to, relativePath, mediaType, filename) {
    try {
        const baseUrl = process.env.MEDIA_BASE_URL || process.env.PUBLIC_URL;
        const fullUrl = relativePath.startsWith('http') ? relativePath : `${baseUrl}/${relativePath}`.replace(/([^:]\/)\/+/g, "$1");
        console.log(`Sending media from: ${fullUrl}`);
        
        let mediaObject = { link: fullUrl };
        if (filename && mediaType === "document") {
            mediaObject.filename = filename; // Only documents support custom filenames in WhatsApp
        }

        const payload = {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: to,
            type: mediaType, // "document" or "image"
            [mediaType]: mediaObject
        };

        const response = await axios.post(
            `https://graph.facebook.com/v25.0/${process.env.PHONE_NUMBER_ID}/messages`,
            payload,
            {
                headers: {
                    Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
                    "Content-Type": "application/json"
                }
            }
        );

        console.log(`✅ Product ${mediaType} Sent:`, response.data);
        return response.data;

    } catch (err) {
        console.error(`❌ Error sending ${mediaType}`);
        console.error("Response:", JSON.stringify(err.response?.data, null, 2));
    }
}

async function sendProductVideoLink(to, youtubeUrl) {
    try {
        const payload = {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: to,
            type: "text",
            text: {
                preview_url: true, // This enables the rich video preview in WhatsApp
                body: `Here is the product video you requested:\n\n${youtubeUrl}`
            }
        };

        const response = await axios.post(
            `https://graph.facebook.com/v25.0/${process.env.PHONE_NUMBER_ID}/messages`,
            payload,
            {
                headers: {
                    Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
                    "Content-Type": "application/json"
                }
            }
        );

        console.log("✅ Video Link Sent:", response.data);
        return response.data;
    } catch (err) {
        console.error("❌ Error sending video link:", err.response?.data || err.message);
    }
}

async function sendTextMessage(to, textContent) {
    try {
        const payload = {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: to,
            type: "text",
            text: { body: textContent }
        };

        const response = await axios.post(
            `https://graph.facebook.com/v25.0/${process.env.PHONE_NUMBER_ID}/messages`,
            payload,
            {
                headers: {
                    Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
                    "Content-Type": "application/json"
                }
            }
        );
        return response.data;
    } catch (err) {
        console.error("❌ Error sending text message:", err.response?.data || err.message);
    }
}

async function sendProductListMessage(to, products, customMessage = "Here is our catalog containing all available product names and titles:") {
    try {
        // WhatsApp list rows max 10 total across all sections. Using 9 and unique IDs to be safe against API limits/duplicates.
        const productsToDisplay = products.slice(0, 9);
        const rows = productsToDisplay.map((p) => ({
            id: `prod_${p.id}_${p.sku || 'N'}`.substring(0, 200),
            title: (p.name || "Product").substring(0, 24),
            description: (`SKU: ${p.sku}` || "").substring(0, 72)
        }));

        const payload = {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: to,
            type: "interactive",
            interactive: {
                type: "list",
                header: { type: "text", text: "Products" },
                body: { text: customMessage },
                footer: { text: "Select a product below" },
                action: {
                    button: "View Catalog",
                    sections: [
                        {
                            title: "Available Products",
                            rows: rows
                        }
                    ]
                }
            }
        };

        const response = await axios.post(
            `https://graph.facebook.com/v25.0/${process.env.PHONE_NUMBER_ID}/messages`,
            payload,
            {
                headers: {
                    Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
                    "Content-Type": "application/json"
                }
            }
        );
        return response.data;
    } catch (err) {
        console.error("❌ Error sending product list message");
        console.error("Status:", err.response?.status);
        console.error("Response:", JSON.stringify(err.response?.data, null, 2));
    }
}

async function sendCatalogueListMessage(to, catalogues, customMessage = "Here is our catalog containing all available catalogues:") {
    try {
        const rows = catalogues.map((c) => ({
            id: `cat_${c.id}`.substring(0, 200),
            title: (c.title || "Catalogue").substring(0, 24)
        }));

        const payload = {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: to,
            type: "interactive",
            interactive: {
                type: "list",
                header: { type: "text", text: "Catalogues" },
                body: { text: customMessage },
                footer: { text: "Select a catalogue below" },
                action: {
                    button: "View Catalog",
                    sections: [
                        {
                            title: "Available Catalogues",
                            rows: rows
                        }
                    ]
                }
            }
        };

        const response = await axios.post(
            `https://graph.facebook.com/v25.0/${process.env.PHONE_NUMBER_ID}/messages`,
            payload,
            {
                headers: {
                    Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
                    "Content-Type": "application/json"
                }
            }
        );
        return response.data;
    } catch (err) {
        console.error("❌ Error sending catalogue list message");
        console.error("Status:", err.response?.status);
        console.error("Response:", JSON.stringify(err.response?.data, null, 2));
    }
}
async function findUserManualUrl(sku) {
    if (!sku) return null;
    const baseUrl = process.env.MEDIA_BASE_URL ? `${process.env.MEDIA_BASE_URL}/usermanaul` : 'https://seashell-pig-127831.hostingersite.com/media/usermanaul';
    const encodedSku = encodeURIComponent(sku);
    const encodedSkuSpace = encodeURIComponent(sku.replace(/-/g, ' '));
    const encodedSkuNoSpace = encodeURIComponent(sku.replace(/[\s-]/g, ''));
    const possibleUrls = [
        `${baseUrl}/${encodedSku}%20User%20Manual.pdf`,
        `${baseUrl}/${encodedSku}_user%20manual.jpg`,
        `${baseUrl}/${encodedSku}_Manual.pdf`,
        `${baseUrl}/${encodedSku}%20Manual.pdf`,
        `${baseUrl}/${encodedSku}%20Manuel.pdf`,
        `${baseUrl}/${encodedSku}_Manuel.pdf`,
        `${baseUrl}/${encodedSku}%20User%20Manual.jpg`,
        `${baseUrl}/${encodedSku}%20user%20manual.pdf`,
        `${baseUrl}/${encodedSku}_user%20manual.pdf`,
        `${baseUrl}/${encodedSku}_Manual.jpg`,
        `${baseUrl}/${encodedSku}%20manual.pdf`,
        `${baseUrl}/${encodedSku}%20Manual.jpg`,
        `${baseUrl}/${encodedSku}.pdf`,
        `${baseUrl}/${encodedSku}.jpg`,
        `${baseUrl}/${encodedSkuSpace}%20User%20Manual.pdf`,
        `${baseUrl}/${encodedSkuSpace}_user%20manual.jpg`,
        `${baseUrl}/${encodedSkuSpace}_Manual.pdf`,
        `${baseUrl}/${encodedSkuSpace}%20Manual.pdf`,
        `${baseUrl}/${encodedSkuSpace}%20Manuel.pdf`,
        `${baseUrl}/${encodedSkuSpace}_Manuel.pdf`,
        `${baseUrl}/${encodedSkuNoSpace}%20User%20Manual.pdf`,
        `${baseUrl}/${encodedSkuNoSpace}_user%20manual.jpg`,
        `${baseUrl}/${encodedSkuNoSpace}_Manual.pdf`,
        `${baseUrl}/${encodedSkuNoSpace}%20Manual.pdf`,
        `${baseUrl}/${encodedSkuNoSpace}%20Manuel.pdf`,
        `${baseUrl}/${encodedSkuNoSpace}_Manuel.pdf`,
        `${baseUrl}/${encodedSkuNoSpace}%20User%20Manual.jpg`,
        `${baseUrl}/${encodedSkuNoSpace}%20user%20manual.pdf`,
        `${baseUrl}/${encodedSkuNoSpace}_user%20manual.pdf`,
        `${baseUrl}/${encodedSkuNoSpace}_Manual.jpg`,
        `${baseUrl}/${encodedSkuNoSpace}%20manual.pdf`,
        `${baseUrl}/${encodedSkuNoSpace}%20Manual.jpg`,
        `${baseUrl}/${encodedSkuNoSpace}.pdf`,
        `${baseUrl}/${encodedSkuNoSpace}.jpg`
    ];

    const checkUrl = async (url) => {
        try {
            await axios.head(url);
            return url;
        } catch (e) {
            return null;
        }
    };
    
    const results = await Promise.all(possibleUrls.map(checkUrl));
    return results.find(url => url !== null) || null;
}

async function sendMoreOptionsMessage(to, product) {
    try {
        const rows = [];
        
        rows.push({ id: `more_imgs_${product.id}`, title: "More Product Images", description: "View product gallery images" });

        if (product.drawing_image_url) {
            rows.push({ id: `dl_img_${product.id}`, title: "Drawing Image", description: "View the product drawing" });
        }
        
        const manualUrl = await findUserManualUrl(product.sku);
        if (manualUrl) {
            rows.push({ id: `dl_umanual_${product.id}`, title: "User Manual", description: "View the user manual" });
        }
        
        if (product.carton_length_cm && product.carton_width_cm && product.carton_height_cm) {
            rows.push({ id: `cbm_calc_${product.id}`, title: "CBM Calculation", description: "Calculate volume & weight" });
        }
        
        if (product.installation_video_url) {
            rows.push({ id: `dl_vid_${product.id}`, title: "Installation Video", description: "Watch installation guide" });
        }
        
        if (product.youtube_url) {
            rows.push({ id: `dl_pvid_${product.id}`, title: "Product Video", description: "Watch product overview" });
        }

        const payload = {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: to,
            type: "interactive",
            interactive: {
                type: "list",
                header: { type: "text", text: "More Options" },
                body: { text: `Select an option for *${product.name}* (${product.sku}):` },
                action: {
                    button: "View Options",
                    sections: [
                        {
                            title: "Product Options",
                            rows: rows
                        }
                    ]
                }
            }
        };

        const response = await axios.post(
            `https://graph.facebook.com/v25.0/${process.env.PHONE_NUMBER_ID}/messages`,
            payload,
            {
                headers: {
                    Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
                    "Content-Type": "application/json"
                }
            }
        );
        return response.data;
    } catch (err) {
        console.error("❌ Error sending more options message:", err.response?.data || err.message);
    }
}

async function sendCBMCalculationMessage(to, product) {
    try {
        const length = product.carton_length_cm || 0;
        const width = product.carton_width_cm || 0;
        const height = product.carton_height_cm || 0;
        const units = product.units_per_carton || 0;
        const grossWeight = product.gross_weight_per_carton_kg || 0;
        const netWeight = product.net_weight_per_carton_kg || 0;

        const cbmPerCarton = (length * width * height) / 1000000;
        
        let messageText = `*CBM Calculation - ${product.name}*\n\n`;
        messageText += `Quantity per Carton: ${units} units\n`;
        messageText += `Gross Weight: ${grossWeight} kg\n`;
        messageText += `Net Weight: ${netWeight} kg\n`;
        messageText += `Carton Dimension: ${length} x ${width} x ${height} cm\n`;
        messageText += `CBM per Carton: ${cbmPerCarton.toFixed(4)}\n\n`;
        messageText += `Click *Calculate* to enter the number of required cartons and calculate total volume and weight.`;

        const payload = {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: to,
            type: "interactive",
            interactive: {
                type: "button",
                body: { text: messageText },
                action: { 
                    buttons: [
                        {
                            type: "reply",
                            reply: { id: `cbm_start_${product.id}`, title: "Calculate" }
                        }
                    ] 
                }
            }
        };

        const response = await axios.post(
            `https://graph.facebook.com/v25.0/${process.env.PHONE_NUMBER_ID}/messages`,
            payload,
            {
                headers: {
                    Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
                    "Content-Type": "application/json"
                }
            }
        );
        return response.data;
    } catch (err) {
        console.error("❌ Error sending CBM calculation message:", err.response?.data || err.message);
    }
}

async function sendCBMResultMessage(to, resultText, shareLink) {
    try {
        const payload = {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: to,
            type: "interactive",
            interactive: {
                type: "cta_url",
                body: { text: resultText },
                action: {
                    name: "cta_url",
                    parameters: {
                        display_text: "Share Result",
                        url: shareLink
                    }
                }
            }
        };

        const response = await axios.post(
            `https://graph.facebook.com/v25.0/${process.env.PHONE_NUMBER_ID}/messages`,
            payload,
            {
                headers: {
                    Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
                    "Content-Type": "application/json"
                }
            }
        );
        return response.data;
    } catch (err) {
        console.error("❌ Error sending CBM result message:", err.response?.data || err.message);
    }
}


module.exports = {
    sendWelcomeMessage,
    sendProductsMessage,
    sendProductDetailsMessage,
    sendProductMedia,
    sendProductVideoLink,
    sendTextMessage,
    sendProductListMessage,
    sendCatalogueListMessage,
    sendMoreOptionsMessage,
    sendCBMCalculationMessage,
    sendCBMResultMessage,
    findUserManualUrl
};