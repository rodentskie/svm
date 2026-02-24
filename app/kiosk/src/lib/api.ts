const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/v1';

export async function fetchCategories() {
  const response = await fetch(`${API_BASE_URL}/products/categories`);
  if (!response.ok) {
    throw new Error('Failed to fetch categories');
  }
  return response.json();
}

export async function fetchProductsByCategory(categoryId: number) {
  const response = await fetch(`${API_BASE_URL}/products?category_id=${categoryId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch products');
  }
  return response.json();
}

export async function fetchPaymentMethods(token?: string) {
  const headers: HeadersInit = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  const response = await fetch(`${API_BASE_URL}/payment_methods`, { headers });
  if (!response.ok) {
    throw new Error('Failed to fetch payment methods');
  }
  return response.json();
}

export async function fetchProductById(productId: number | string) {
  const response = await fetch(`${API_BASE_URL}/products/${productId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch product');
  }
  return response.json();
}

export async function createPaymentMethod(method: string, expirySeconds?: number) {
  const response = await fetch(`${API_BASE_URL}/payment_methods`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ method: method.toLowerCase(), expiry_seconds: expirySeconds }),
  });
  if (!response.ok) {
    throw new Error('Failed to create payment method');
  }
  return response.json();
}

export async function createPaymentIntent(amount: number, paymentMethodsAllowed: string[]) {
  const response = await fetch(`${API_BASE_URL}/payment_intents`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount,
      payment_methods_allowed: paymentMethodsAllowed,
    }),
  });
  if (!response.ok) {
    throw new Error('Failed to create payment intent');
  }
  return response.json();
}

export async function attachPaymentIntent(
  paymentMethodId: string,
  paymentIntentId: string,
  returnUrl: string
) {
  const response = await fetch(`${API_BASE_URL}/payment_intents/attach`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      payment_method_id: paymentMethodId,
      payment_intent_id: paymentIntentId,
      return_url: returnUrl,
    }),
  });
  if (!response.ok) {
    throw new Error('Failed to attach payment intent');
  }
  return response.json();
}

export async function getPaymentIntentStatus(paymentIntentId: string) {
  const response = await fetch(`${API_BASE_URL}/payment_intents/${paymentIntentId}`);
  if (!response.ok) {
    throw new Error('Failed to get payment intent status');
  }
  return response.json();
}

export async function createTransaction(
  location: string,
  type: string,
  quantity: number,
  paymentMethod: string,
  rfid: string,
  paymentIntentId: string
) {
  const response = await fetch(`${API_BASE_URL}/transactions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      location,
      type,
      quantity,
      payment_method: paymentMethod,
      rfid,
      payment_intent_id: paymentIntentId,
    }),
  });
  if (!response.ok) {
    throw new Error('Failed to create transaction');
  }
  return response.status === 204 ? null : response.json();
}

export async function fetchStudentByRFID(rfid: string) {
  const response = await fetch(`${API_BASE_URL}/students/rfid?rfid=${encodeURIComponent(rfid)}`);
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Student not found');
    }
    throw new Error('Failed to fetch student data');
  }
  return response.json();
}

export async function validateStudentPIN(rfid: string, pin: string) {
  const response = await fetch(`${API_BASE_URL}/students/pin?rfid=${encodeURIComponent(rfid)}&pin=${encodeURIComponent(pin)}`);
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Invalid PIN');
    }
    throw new Error('Failed to validate PIN');
  }
  return response.json();
}
