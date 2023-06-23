//npm install stripe
import Stripe from "stripe";

//Pega a Chave-Privada do Stripe da variavel ambiente
const KEY = process.env.STRIPE_API_KEY as string;

//Configurações Básicas do Stripe
const config: Stripe.StripeConfig  = {
    apiVersion: '2022-11-15',
    appInfo: {
        name: 'IgNews',
        version: '0.1.0'
    }
}

//Inicializa o Stripe com a Chave-Privada e a Config
export const stripe = new Stripe(
    KEY,
    config
)