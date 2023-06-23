import { fauna } from "@/services/fauna";
import { stripe } from "@/services/stripe";
import { query } from "faunadb";

//Função que lida com a criação ou atualização das informações do usuario no Banco de dados
export async function saveSubscription(subscriptionId: string, customerId: string, createAction = false){
/* 
    Busca o usuario no banco do FaunaDB com o CustomerID (stripe_customer_id) 
*/  
    const userRef = await fauna.query(
    // Retorna o campo 'ref' do usuário com base no customer_id
    query.Select(
        "ref",
        query.Get(
            query.Match(
                query.Index('user_by_stripe_customer_id'), customerId
            )
        )
    )
    )
    
    //Busca todos os dados a subscription do usuário com base no Id da inscrição
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)
    
    const subscriptionData = {
        id: subscription.id,
        user_id: userRef,
        status: subscription.status,
        price_id: subscription.items.data[0].price.id
    }

    //Verifica se é uma ação de criação no Banco de dados
    if(createAction)
        // Salvar os dados da subscription no Fauna DB
        await fauna.query(
            query.Create(
                query.Collection('subscriptions'),
                { data: subscriptionData}
            )
        )
    else
        //Substitui as informações de inscrição do usuário 
        await fauna.query(
            //Replace substitui toda a coluna por completo
            query.Replace(
                query.Select(
                    "ref",
                    query.Get(
                        query.Match(
                            query.Index("subscription_by_id"),
                            subscriptionId
                        )
                    )
                ),
                { data: subscriptionData }
            )
        )
}