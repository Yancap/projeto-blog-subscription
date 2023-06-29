import React from 'react'
import styles from './styles.module.scss'
import { signIn, useSession } from 'next-auth/react';
import { api } from '@/services/api';
import { getStripeJs } from '@/services/stripe-js';
import { useRouter } from 'next/router';
import { Session } from 'next-auth';

interface SubscribeButtonProps{
  priceId: string;
}

interface SubscribeSession extends Session {
  activeSubscription: object | null;
}

//Gerando uma sessão de inscrição do usuário no Stripe
export const SubscribeButton = ({priceId}: SubscribeButtonProps) => {
  
  const { data: session } = useSession()
  
  
  const router = useRouter()
  async function handleSubscribe(){
    //Caso o usuário não esteja logado no Github, redirecione para o usuário logar
    if (!session) {
      signIn('github')
      return
    }
    
    //Verifica se o usuário tem uma inscrição ativa e redireciona para pagina de post
    if ((session as SubscribeSession).activeSubscription) {
      router.push('/posts')
      return
    }

    try { 
      //Envia a requisição de inscrição para rota 
      const response = await api.post('/subscribe')
      //Pega o ID da Session do Stripe que foi criada
      const { sessionId } = response.data

      const stripe = await getStripeJs()
      //Redireciona o usuário para a inscrição do produto no Stripe com base no seu ID de Session
      await stripe?.redirectToCheckout({sessionId})
    } catch (error) {
      alert(error)
    }
  }
  return (
    <button type='button' className={styles.button} onClick={handleSubscribe}>
        Subscribe now
    </button>
  )
}
