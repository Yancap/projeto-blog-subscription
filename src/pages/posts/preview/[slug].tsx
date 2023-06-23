import { getPrismicClient } from '@/services/prismic'
import { getSession, useSession } from 'next-auth/react'
import styles from '../post.module.scss'
import Head from 'next/head'
import { RichText } from 'prismic-dom'
import {useEffect} from 'react'
import { GetStaticPaths, GetStaticProps } from 'next'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { Session } from 'next-auth'


interface PreviewPostProps {
  post: {
    slug: string;
    title: string;
    content: string;
    updateAt: string;
  }
}


interface SessionSlug extends Session{
  activeSubscription: string;
}
export default function PreviewPost({ post }: PreviewPostProps){
  let { data: session } = useSession()
  const router = useRouter()
  useEffect(() => {
    if((session as SessionSlug)?.activeSubscription){
      router.push('/posts/' + post.slug)
    }
  }, [session])
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
          <div className={`${styles.content} ${styles.preview}`} 
          dangerouslySetInnerHTML={{__html: post.content}}
          />

          <div className={styles.continueReading}>
            Wanna continue reading?
              <Link href='/'>
                <span>Subscribe now 🤗</span>
              </Link>
            
          </div>
        </article>
      </main>
    </>
  )
}

//É uma opção que só existe em página com parâmetros dinâmicos e gera a página de 
//forma Estática quando o PRIMEIRO Usuário entrar na página Evitando que a Build se torne pesada
export const getStaticPaths: GetStaticPaths = async () => {
  return {
    //Determina quais páginas será geradas nas Build e quais dependeram do acesso do Primeiro Usuário
    paths: [{
      params: {
        slug: 'typescript-por-tras-do-superset-de-javascript' //Nesse caso determina que apenas a pagina com esse determinado slug será gerada
      }
    }], 
    fallback: 'blocking' //Fallback > true: Conteúdo carregado em Client Side, false: Retornar 404 se caso o post não for carregado, blocking: carrega o conteúdo em ServeSide
  }
}
//Função que vai gerar o texto em Server Side
export const getStaticProps: GetStaticProps = async ({params}) => {
  
  //Pega o Route Params da Rota
  const slug = params?.slug ?? '';

  //Pega a Conexão com o Prismic
  const prismic = getPrismicClient()

  //Vai pega o Post do Prismic com base em seu UUID
  const response = await prismic.getByUID('post', String(slug), {})
  
  //Retorna o post do Prismic já formatado
  const post = {
    slug,
    title: RichText.asText(response.data.title),
    content: RichText.asHtml(response.data.content.splice(8, 3)),
    updateAt: new Date(response.last_publication_date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })
  }
  
  return {
    props: {
      post
    },
    revalidate: 60 * 30  // 30 minutes
  }
}