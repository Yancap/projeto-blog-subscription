import { fauna } from "@/services/fauna";
import { stripe } from "@/services/stripe";
import { query } from "faunadb";
import { NextApiRequest, NextApiResponse } from "next";
import { Session, getServerSession } from "next-auth";
import { authOptions } from "./auth/[...nextauth]";

//Informações a serem retornadas pelo BD
interface User {
    ref: {
        id: string;
    }
    data: {
        stripe_customer_id: string;
    }
}
interface ActiveSubscription extends Session {
    activeSubscription: {
        data: {
            status: string;
        }
    }
}

export default async (request: NextApiRequest, response: NextApiResponse) => {
    //Aceita apenas requisição POST
    if(request.method === "POST") {
        //Pega os cookies da requisição onde está armazenado os dados do usuário do Auth do Github
        
        
        const session = await getServerSession(request, response, authOptions)
        
        
        
        //Pega as informações do usuário no Banco de Dados
        const user = await fauna.query<User>(
            query.Get(
                query.Match(
                    query.Index('user_by_email'),
                    query.Casefold(session?.user?.email as string)
                )
            )
        )

        
        //Atribui o ID Stripe a Variável
        let customerId = user.data.stripe_customer_id

        //Se o ID Stripe não existir, significa que o usuario não tem uma sessão ativa no Stripe
        if (!customerId) {
            //Cria um ID unico para o STRIPE com base no email do usuario
            const stripeCustomer = await stripe.customers.create({
                email: session?.user?.email as string,
            })

            //Atualiza as informações do usuário no BD com o ID Stripe
            await fauna.query(
                query.Update(
                    query.Ref(query.Collection('users'), user.ref.id),
                    {
                        data: {
                            stripe_customer_id: stripeCustomer.id
                        }
                    }
                )
            )
            
            //Reatribui o ID Stripe a variável
            customerId = stripeCustomer.id
            return response.status(200).json({customerId})
        }

        
        //Cria a sessão para cada usuario, com base em seu email e o ID Stripe unico
        const stripeCheckoutSession = await stripe.checkout.sessions.create({
            customer: customerId, //ID Stripe do usuário que está comprando 
            payment_method_types: ['card'], //Aceita apenas cartão
            billing_address_collection: 'required', //Necessidade de preenchimento do endereço
            line_items: [ //Quais items que a pessoa adiciona no carrinho e sua quantidade
                {price: 'price_1N8SOMCGnWxAsuIl44EGoj8n', quantity: 1}
            ],
            mode: 'subscription',
            allow_promotion_codes: true,
            success_url: process.env.STRIPE_SUCCESS_URL as string, //Redireciona o Usuário para esse rota em caso de sucesso
            cancel_url: process.env.STRIPE_CANCEL_URL as string //Redireciona o Usuario para esse rota em caso de cancelamento ou fracasso
        })
        return response.status(200).json({sessionId: stripeCheckoutSession.id})
    } else {
        response.setHeader("Allow", "POST");
        response.status(405).end("Method not allowed")
    }
}