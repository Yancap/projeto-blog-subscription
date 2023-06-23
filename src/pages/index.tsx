import Head from "next/head";
import styles from "./home.module.scss"
import { SubscribeButton } from "@/components/SubscribeButton";
import {  GetStaticProps } from "next";
import { stripe } from "@/services/stripe";

interface HomeProps {
  product: {
    priceId: string;
    amount: string;
  }
}
export default function Home({ product }: HomeProps) {
  return (
    <>
      <Head>
        <title>Home | YG News</title>
      </Head>
      <main className={styles.container}>
        <section className={styles.hero}>
          <span>👏 Hey, welcome</span>
          <h1>News about the <span>React</span> world.</h1>
          <p>
            Get access to all the publications <br />
            <span>for {product?.amount} month</span>
          </p>
          <SubscribeButton priceId={product.priceId}/>
        </section>

        <img src="/images/avatar.svg" alt="Girl Coding"/>
      </main>
    </>
  )
}

//Buscando o preço do serviço por meio do Static Site Generation
export const getStaticProps: GetStaticProps = async () => {

  //Pega todas as informações do preço do produto no Stripe por meio de seu Id (Pegar o ID no Site)
  const price = await stripe.prices.retrieve('price_1N8SOMCGnWxAsuIl44EGoj8n')

  const product = {
    priceId: price.id,
    amount: new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price.unit_amount as number / 100),
  }
  return {
    props: {
      product
    },
    //Refaz a requisição a cada 24 horas
    revalidate:  60 * 60 * 24 //24 Hours
  }
}