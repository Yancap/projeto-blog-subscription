//npm install stripe-js
import { loadStripe } from '@stripe/stripe-js'

//Integração do Stripe com o Browser
export async function getStripeJs() {
    //Carrega as informações do produto para o client
    const stripeJs = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY as string)
    return stripeJs
}