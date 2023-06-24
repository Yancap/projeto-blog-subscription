import { getPrismicClient } from '@/services/prismic'
import { GetServerSideProps } from 'next'
import { getSession } from 'next-auth/react'
import styles from './post.module.scss'
import Head from 'next/head'
import { RichText } from 'prismic-dom'
import React from 'react'
import { Session } from 'next-auth'


interface PostProps {
  post: {
    slug: string;
    title: string;
    content: string;
    updateAt: string;
  }
}



export default function Post({ post }: PostProps){
  return (
    <>
      <Head>
        <title>{post.title} | YgNews</title>
      </Head>

      <main className={styles.container}>
        <article className={styles.post}>
          <h1>{post.title}</h1>
          <time>{post.updateAt}</time>
          {/* 
            O Conteúdo está vindo como HTML do Prismic, com isso
            para formatar esse HTML dentro de uma tag, utiliza-se 
            a propriedade "dangerouslySetInnerHTML".
            Essa propriedade é perigoso e deve se utilizada raramente,
            o Prismic possui uma tratativa para essa propriedade, tornando segura 
          */}
          <div className={styles.content} dangerouslySetInnerHTML={{__html: post.content}}>

          </div>
        </article>
      </main>
    </>
  )
}

interface SessionSlug extends Session{
  activeSubscription: string;
}

//Função que vai gerar o texto em Server Side
export const getServerSideProps: GetServerSideProps = async ({req, params}) => {
  //Pega a sessão do usuário de login no GIT
  const session = await getSession({ req });
  
  

  //Pega o Route Params da Rota
  const slug = params?.slug ?? '';
  //Pega a inscrição do usuário e verifica se está ativa
  if (!(session as SessionSlug)?.activeSubscription) {
    return {
      redirect: {
        destination: '/posts/preview/'+ slug,
        permanent: false
      }
    }
  }

  
  //Pega a Conexão com o Prismic
  const prismic = getPrismicClient()

  //Vai pega o Post do Prismic com base em seu UUID
  const respose = await prismic.getByUID('post', String(slug), {})
  
  //Retorna o post do Prismic já formatado
  const post = {
    slug,
    title: RichText.asText(respose.data.title),
    content: RichText.asHtml(respose.data.content),
    updateAt: new Date(respose.last_publication_date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })
  }
  
  return {
    props: {
      post
    }
  }
}