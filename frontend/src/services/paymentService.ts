import axios from 'axios';

export const processMockPayment = async (rentalId: number, userId: number, amount: number, paymentMethod: string) => {
  try {
    const response = await axios.post('http://localhost:3003/api/payments/mock', {
      rentalId: rentalId,
      userId: userId,
      amount,
      paymentMethod: paymentMethod,
    });
    return response.data;
  } catch (error) {
    console.error('Error processing mock payment:', error);
    throw error;
  }
};
