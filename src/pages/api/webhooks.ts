import { stripe } from '@/services/stripe';
import { api } from './../../services/api';
import { NextApiRequest, NextApiResponse } from "next";
import { Readable } from "stream";
import Stripe from 'stripe';
import { saveSubscription } from './_lib/manageSubscription';

//stripe listen --forward-to localhost:3000/api/webhooks
 

//Função Stream que vai lidar com a requisição em formato de Stream
async function buffer(readable: Readable){
    const chunks: any[] = [];
    for await (const chunk of readable){
        chunks.push(
            typeof chunk === 'string' ? Buffer.from(chunk) : chunk
        )
    }
    return Buffer.concat(chunks);
}

//Configuração básica para as rotas que possuem um Stream
export const config = {
    api: {
        bodyParser: false
    }
}

//Seleciona e salva apenas o evento necessário para essa requisição
const relevantEvents = new Set([
    'checkout.session.completed',
    'customer.subscription.updated',
    'customer.subscription.deleted',
]);

export default async (request: NextApiRequest, response: NextApiResponse) => {
    if (request.method === 'POST') {
        //Armazena a requisão do Webhook completa
        const buf = await buffer(request)
/*
        Por questões de segurança, deve-se ter uma chave de acesso privada para esse requisição e
        fazer verificações com base nessa chave privada, pois, caso algum usuário descubra essa rota, 
        ele pode enviar diversas requisições para APi
*/
        
        //Pega a chave privada contida na Header da requisição
        const secret = request.headers['stripe-signature'] as string | string[]
        let event: Stripe.Event;

        try {
            //A chave privada da rota é gerada no 'stripe listen ...'
            //Vai verificar se a chave secreta da requisição é a mesma chave da variável de ambiente
            event = stripe.webhooks.constructEvent(buf, secret, process.env.STRIPE_WEBHOOK_SECRET as string);
        } catch (error) {
            return response.status(404).send('Webhook Error')
        }
        
        const {type} = event
        
        if(relevantEvents.has(type)) {
            try {
                switch (type) {
                /*
                    Caso o usuário atualize sua inscrição, seja criando uma nova, seja atualizando
                    ou deletando. vai realizar a operação de atualização do Banco de Dados
                */
                    case 'customer.subscription.updated':
                    case 'customer.subscription.deleted':
                        /*
                            Caso o usuário atualize ou cancele sua inscrição, vai substituir
                            os dados antigos pela informação nova
                        */
                        
                        const subscription = event.data.object as Stripe.Subscription;
                        await saveSubscription(
                            subscription.id,
                            subscription.customer.toString(),
                            false
                        )
                        break

                    case 'checkout.session.completed':
                        //Caso o usuário não tenha uma sessão no stripe, vai criar essa sessão e atualizar no banco de dados
                        const checkoutSession = event.data.object as Stripe.Checkout.Session
                        await saveSubscription(
                            checkoutSession.subscription?.toString() as string,
                            checkoutSession.customer?.toString() as string,
                            true
                        )
                        break;
                    default:
                        throw new Error('Unhandled event')
                }
            } catch (error) {
                return response.json({ error: "Webhook handler failed."})
            }

        }
        response.json({ received: true }) 
    } else {
        response.setHeader("Allow", "POST");
        response.status(405).end("Method not allowed")
    } 
}