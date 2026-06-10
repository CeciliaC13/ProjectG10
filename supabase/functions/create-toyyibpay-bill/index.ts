// Supabase Edge Function — ToyyibPay createBill
// Location: supabase/functions/create-toyyibpay-bill/index.ts

const TOYYIBPAY_SECRET_KEY    = 'knh1ysms-ewcy-5a05-g27v-zvqo9l8j0140';  // ← replace
const TOYYIBPAY_CATEGORY_CODE = 'zxipigyj';       // ← replace
const TOYYIBPAY_BASE_URL      = 'https://toyyibpay.com'; // sandbox

Deno.serve(async (req) => {

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin':  '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  try {
    const {
      reservationId,
      amount,
      college,
      studentName,
      studentEmail,
      studentPhone,
      returnUrl,
    } = await req.json();

    // Amount in cents
    const amountCents = Math.round(parseFloat(amount) * 100);

    // Build form data for ToyyibPay
    const formData = new URLSearchParams();
    formData.append('userSecretKey',           TOYYIBPAY_SECRET_KEY);
    formData.append('categoryCode',            TOYYIBPAY_CATEGORY_CODE);
    formData.append('billName',                `Room_${reservationId}`.substring(0, 30));
    formData.append('billDescription',         `Room booking ${college}`.substring(0, 100));
    formData.append('billPriceSetting',        '1');
    formData.append('billPayorInfo',           '1');
    formData.append('billAmount',              amountCents.toString());
    formData.append('billReturnUrl',           returnUrl);
    formData.append('billCallbackUrl',         returnUrl);
    formData.append('billExternalReferenceNo', reservationId);
    formData.append('billTo',                  studentName  || 'Student');
    formData.append('billEmail',               studentEmail || 'student@utm.my');
    formData.append('billPhone', studentPhone || '0111234567');
    formData.append('billSplitPayment',        '0');
    formData.append('billSplitPaymentArgs',    '');
    formData.append('billPaymentChannel',      '0');
    formData.append('billContentEmail',        `Thank you for your payment for booking ${reservationId}`);
    formData.append('billChargeToCustomer',    '1');

    // Call ToyyibPay API
    const response = await fetch(`${TOYYIBPAY_BASE_URL}/index.php/api/createBill`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body:    formData.toString(),
    });

    const result = await response.json();
    console.log('ToyyibPay response:', result);

    if (result && result[0] && result[0].BillCode) {
      const billCode   = result[0].BillCode;
      const paymentUrl = `${TOYYIBPAY_BASE_URL}/${billCode}`;

      return new Response(
        JSON.stringify({ success: true, billCode, paymentUrl }),
        {
          headers: {
            'Content-Type':                'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    } else {
      throw new Error(result?.message || 'Failed to create bill');
    }

  } catch (err) {
    console.error('Edge function error:', err);
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      {
        status: 500,
        headers: {
          'Content-Type':                'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
});